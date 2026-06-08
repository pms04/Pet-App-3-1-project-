import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';
import { calcCompatScore, DogProfile } from '../utils/compatScore';
import { getEnergyByBreed } from '../constants/breedEnergy';

export interface NearbyDog {
  id: string;
  user_id: string;
  name: string;
  breed: string;
  weight: number;
  birth_date: string;
  gender: 'M' | 'F' | 'MN' | 'FN';
  tendency: string;
  profile: DogProfile;
  latitude: number;
  longitude: number;
  ownerNickname: string;
  ownerProfileImageUrl: string | null;
  score: number;
  grade: 'safe' | 'caution' | 'danger';
  isWalking: boolean;
}

export interface WalkLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  selected_dog_ids: string[];
  updated_at: string;
}

function toAgeMonths(birthDate?: string | null) {
  if (!birthDate) return 36;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 36;
  const now = new Date();
  return Math.max(1, (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth());
}

function toActivityLevel(breed?: string | null): 1 | 2 | 3 | 4 | 5 {
  const energy = getEnergyByBreed(breed || '')?.energy_level ?? 0.6;
  return Math.min(5, Math.max(1, Math.round(energy * 5))) as 1 | 2 | 3 | 4 | 5;
}

function toProfile(row: any): DogProfile {
  const genderValue = String(row.gender || 'M');
  return {
    weightKg: Number(row.weight || 1),
    activityLevel: toActivityLevel(row.breed),
    ageMonths: toAgeMonths(row.birth_date),
    isNeutered: genderValue.includes('N'),
    gender: genderValue.startsWith('F') ? 'F' : 'M',
  };
}

export function useNearbyDogs(
  currentLocation: { latitude: number; longitude: number } | null,
  isWalking: boolean = false,
  selectedDogIds: string[] = [],
) {
  const [dogs, setDogs] = useState<NearbyDog[]>([]);
  const [myProfile, setMyProfile] = useState<DogProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 내 위치를 walk_locations 테이블에 upsert (산책 중일 때만)
  const publishMyLocation = useCallback(async (
    loc: { latitude: number; longitude: number },
    dogIds: string[],
  ) => {
    try {
      const user = await requireCurrentUser();
      await supabase.from('walk_locations').upsert({
        user_id: user.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        selected_dog_ids: dogIds,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (_) { /* silent */ }
  }, []);

  // ── 내 위치 삭제 (산책 종료 시)
  const removeMyLocation = useCallback(async () => {
    try {
      const user = await requireCurrentUser();
      await supabase.from('walk_locations').delete().eq('user_id', user.id);
    } catch (_) { /* silent */ }
  }, []);

  // ── 주변 강아지 데이터 fetch (산책 모드에서만 실시간 위치 기반)
  const fetchNearbyDogs = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const user = await requireCurrentUser();

      // 내 기준 강아지 프로필
      let myDogQuery = supabase.from('dogs').select('*').eq('user_id', user.id);
      if (selectedDogIds.length > 0) {
        myDogQuery = myDogQuery.in('id', selectedDogIds).limit(1);
      } else {
        myDogQuery = myDogQuery.order('created_at', { ascending: true }).limit(1);
      }
      const { data: myDogs } = await myDogQuery;
      const baseProfile = myDogs?.[0] ? toProfile(myDogs[0]) : null;
      setMyProfile(baseProfile);

      // ── 산책 모드: walk_locations에서 실시간 위치 가져오기
      if (isWalking) {
        const { data: locations, error: locError } = await supabase
          .from('walk_locations')
          .select('*')
          .neq('user_id', user.id)
          .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // 10분 이내

        if (locError) throw locError;
        if (!locations || locations.length === 0) {
          setDogs([]);
          return;
        }

        // 각 위치의 사용자 강아지 정보 조회
        const userIds = locations.map((l: any) => l.user_id);
        const { data: dogsData } = await supabase
          .from('dogs')
          .select('*, users(id,nickname,profile_image_url)')
          .in('user_id', userIds);

        const result: NearbyDog[] = [];
        for (const loc of locations) {
          const userDogs = (dogsData || []).filter((d: any) => d.user_id === loc.user_id);
          const selectedIds: string[] = loc.selected_dog_ids || [];
          const visibleDogs = selectedIds.length > 0
            ? userDogs.filter((d: any) => selectedIds.includes(d.id))
            : userDogs.slice(0, 1);

          for (const dog of visibleDogs) {
            const profile = toProfile(dog);
            const compat = baseProfile ? calcCompatScore(baseProfile, profile) : { score: 0, grade: 'danger' as const };
            result.push({
              id: dog.id,
              user_id: dog.user_id,
              name: dog.name,
              breed: dog.breed,
              weight: Number(dog.weight),
              birth_date: dog.birth_date,
              gender: dog.gender,
              tendency: dog.tendency,
              profile,
              latitude: loc.latitude,
              longitude: loc.longitude,
              ownerNickname: dog.users?.nickname || 'WalkFix 사용자',
              ownerProfileImageUrl: dog.users?.profile_image_url || null,
              score: compat.score,
              grade: compat.grade,
              isWalking: true,
            });
          }
        }
        setDogs(result);
      } else {
        // ── 비산책 모드: 마커 표시 안 함 (빈 배열)
        setDogs([]);
      }
    } catch (error) {
      showError('주변 강아지 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, [currentLocation, isWalking, selectedDogIds]);

  // ── Realtime subscription (산책 모드 시 walk_locations 변경 감지)
  useEffect(() => {
    if (!isWalking) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel('walk_locations_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'walk_locations',
      }, () => {
        fetchNearbyDogs();
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [isWalking, fetchNearbyDogs]);

  // ── 주기적 폴링 (5초마다 업데이트 — Realtime 보조)
  useEffect(() => {
    if (!isWalking) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      fetchNearbyDogs();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isWalking, fetchNearbyDogs]);

  useEffect(() => { fetchNearbyDogs(); }, [fetchNearbyDogs]);

  const message = useMemo(() => {
    if (!isWalking) return '산책 모드를 켜면 주변 반려견들이 표시됩니다.';
    if (!myProfile) return '내 반려견을 등록하면 주변 강아지와 궁합을 계산합니다.';
    if (!dogs.length) return '현재 주변에 산책 중인 반려견이 없습니다.';
    return `${dogs.length}마리의 산책 중인 강아지를 표시 중입니다.`;
  }, [dogs.length, myProfile, isWalking]);

  return {
    nearbyDogs: dogs,
    myProfile,
    loading,
    message,
    refresh: fetchNearbyDogs,
    publishMyLocation,
    removeMyLocation,
  };
}

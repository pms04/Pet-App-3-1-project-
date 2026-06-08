import { useCallback, useEffect, useMemo, useState } from 'react';
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
  score: number;
  grade: 'safe' | 'caution' | 'danger';
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

export function useNearbyDogs(currentLocation: { latitude: number; longitude: number } | null) {
  const [dogs, setDogs] = useState<NearbyDog[]>([]);
  const [myProfile, setMyProfile] = useState<DogProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNearbyDogs = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data: myDogs, error: myDogError } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (myDogError) throw myDogError;
      const baseProfile = myDogs?.[0] ? toProfile(myDogs[0]) : null;
      setMyProfile(baseProfile);

      const { data, error } = await supabase
        .from('dogs')
        .select('*, users(id,nickname,profile_image_url)')
        .neq('user_id', user.id)
        .limit(30);
      if (error) throw error;

      const placedDogs = (data || []).map((row: any, index: number) => {
        const profile = toProfile(row);
        const result = baseProfile ? calcCompatScore(baseProfile, profile) : { score: 0, grade: 'danger' as const };
        const angle = (index / Math.max((data || []).length, 1)) * Math.PI * 2;
        const radius = 0.0012 + (index % 4) * 0.00035;
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          breed: row.breed,
          weight: Number(row.weight),
          birth_date: row.birth_date,
          gender: row.gender,
          tendency: row.tendency,
          profile,
          latitude: currentLocation.latitude + Math.cos(angle) * radius,
          longitude: currentLocation.longitude + Math.sin(angle) * radius,
          ownerNickname: row.users?.nickname || 'WalkFix 사용자',
          score: result.score,
          grade: result.grade,
        };
      });
      setDogs(placedDogs);
    } catch (error) {
      showError('주변 강아지 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => { fetchNearbyDogs(); }, [fetchNearbyDogs]);

  const message = useMemo(() => {
    if (!myProfile) return '내 반려견을 등록하면 주변 강아지와 궁합을 계산합니다.';
    if (!dogs.length) return '표시할 주변 강아지 데이터가 아직 없습니다.';
    return `${dogs.length}마리의 주변 강아지를 실제 등록 데이터 기준으로 표시 중입니다.`;
  }, [dogs.length, myProfile]);

  return { nearbyDogs: dogs, myProfile, loading, message, refresh: fetchNearbyDogs };
}

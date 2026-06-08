import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { formatDateTimeLabel, requireCurrentUser, showError } from '../lib/supabaseApi';
import { getEnergyByBreed } from '../constants/breedEnergy';
import { calcCompatScore, DogProfile } from '../utils/compatScore';

export interface LightningParticipantDog {
  id: string;
  name: string;
  breed: string | null;
  weight: number | null;
  birth_date: string | null;
  gender: string | null;
  tendency: string | null;
  user_id: string;
}

export interface LightningParticipant {
  user_id: string;
  nickname: string;
  profileImageUrl: string | null;
  selectedDogIds: string[];
  dogs: LightningParticipantDog[];
}

export interface LightningWalk {
  id: string;
  user_id: string;
  title: string;
  location: string;
  location_lat: number | null;
  location_lng: number | null;
  starts_at: string;
  max_participants: number;
  ai_summary: string | null;
  weather: string | null;
  created_at: string;
  participant_count: number;
  joined: boolean;
  startsAtLabel: string;
  currentParticipants: number;
  maxParticipants: number;
  region: string | null;
  participants: LightningParticipant[];
  participantDogs: LightningParticipantDog[];
  mySelectedDogIds: string[];
  matchScore: number | null;
  matchGrade: 'safe' | 'caution' | 'danger' | null;
}

export interface CreateLightningInput {
  title: string;
  location: string;
  locationLat?: number | null;
  locationLng?: number | null;
  date: string;
  time: string;
  maxParticipants: string;
  region?: string;
  selectedDogIds?: string[];
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildAiSummary(title: string, location: string) {
  return `${location}에서 진행되는 "${title}" 번개입니다. 참여 전 반려견 성향과 리드줄 준비 상태를 확인해 주세요.`;
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

function toProfile(row: Partial<LightningParticipantDog> | any): DogProfile {
  const genderValue = String(row.gender || 'M');
  return {
    weightKg: Number(row.weight || 1),
    activityLevel: toActivityLevel(row.breed),
    ageMonths: toAgeMonths(row.birth_date),
    isNeutered: genderValue.includes('N'),
    gender: genderValue.startsWith('F') ? 'F' : 'M',
  };
}

function computeWalkMatch(myDogs: LightningParticipantDog[], otherDogs: LightningParticipantDog[]) {
  if (!myDogs.length || !otherDogs.length) return { score: null, grade: null };
  const scores: { score: number; grade: 'safe' | 'caution' | 'danger' }[] = [];
  for (const myDog of myDogs) {
    for (const dog of otherDogs) {
      scores.push(calcCompatScore(toProfile(myDog), toProfile(dog)));
    }
  }
  if (!scores.length) return { score: null, grade: null };
  const score = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const grade = score >= 70 ? 'safe' : score >= 40 ? 'caution' : 'danger';
  return { score, grade };
}

export function useLightningWalks(joinedOnly = false) {
  const [walks, setWalks] = useState<LightningWalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await requireCurrentUser();
        const { data } = await supabase.from('users').select('location').eq('id', user.id).single();
        if (data?.location) setUserLocation(data.location);
      } catch (_) {}
    })();
  }, []);

  const fetchWalks = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('lightning_walks')
        .select('id,user_id,title,location,location_lat,location_lng,starts_at,max_participants,ai_summary,weather,created_at,region,lightning_participants(user_id,selected_dog_ids)')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true });
      if (error) throw error;

      const rows = data || [];
      const participantUserIds = Array.from(new Set(rows.flatMap((row: any) => (row.lightning_participants || []).map((p: any) => p.user_id))));
      const participantDogIds = Array.from(new Set(rows.flatMap((row: any) => (row.lightning_participants || []).flatMap((p: any) => p.selected_dog_ids || []))));

      const [{ data: usersData }, { data: dogsData }] = await Promise.all([
        participantUserIds.length
          ? supabase.from('users').select('id,nickname,profile_image_url').in('id', participantUserIds)
          : Promise.resolve({ data: [] as any[] }),
        participantDogIds.length
          ? supabase.from('dogs').select('id,user_id,name,breed,weight,birth_date,gender,tendency').in('id', participantDogIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const usersById = Object.fromEntries((usersData || []).map((profile: any) => [profile.id, profile]));
      const dogsById = Object.fromEntries((dogsData || []).map((dog: any) => [dog.id, dog]));

      const mapped = rows.map((row: any) => {
        const participantsRaw = row.lightning_participants || [];
        const participantCount = participantsRaw.length;
        const maxParticipants = row.max_participants || 4;
        const joinedParticipant = participantsRaw.find((p: any) => p.user_id === user.id);
        const joined = Boolean(joinedParticipant);
        const participants = participantsRaw.map((participant: any) => {
          const selectedDogIds = participant.selected_dog_ids || [];
          const profile = usersById[participant.user_id] || {};
          return {
            user_id: participant.user_id,
            nickname: profile.nickname || 'WalkFix 사용자',
            profileImageUrl: profile.profile_image_url || null,
            selectedDogIds,
            dogs: selectedDogIds.map((id: string) => dogsById[id]).filter(Boolean),
          } as LightningParticipant;
        });
        const mySelectedDogIds = joinedParticipant?.selected_dog_ids || [];
        const myDogs = mySelectedDogIds.map((id: string) => dogsById[id]).filter(Boolean);
        const otherDogs = participants
          .filter((participant) => participant.user_id !== user.id)
          .flatMap((participant) => participant.dogs);
        const match = computeWalkMatch(myDogs, otherDogs);
        const participantDogs = participants.flatMap((participant) => participant.dogs);

        return {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          location: row.location,
          location_lat: row.location_lat ?? null,
          location_lng: row.location_lng ?? null,
          starts_at: row.starts_at,
          max_participants: maxParticipants,
          ai_summary: row.ai_summary,
          weather: row.weather,
          created_at: row.created_at,
          participant_count: participantCount,
          joined,
          startsAtLabel: formatDateTimeLabel(row.starts_at),
          currentParticipants: participantCount,
          maxParticipants,
          region: row.region ?? null,
          participants,
          participantDogs,
          mySelectedDogIds,
          matchScore: match.score,
          matchGrade: match.grade,
        } as LightningWalk;
      });

      let filtered = mapped;
      const regions: Set<string> = new Set();
      if (userLocation) regions.add(userLocation);
      if (regionFilter) regions.add(regionFilter);

      if (regions.size > 0) {
        filtered = mapped.filter((w) => {
          if (!w.region) return true;
          for (const region of regions) {
            if (w.region.includes(region) || region.includes(w.region)) return true;
          }
          return false;
        });
      }

      setWalks(joinedOnly ? filtered.filter((w) => w.joined) : filtered);
    } catch (error) {
      showError('번개 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, [joinedOnly, regionFilter, userLocation]);

  useEffect(() => { fetchWalks(); }, [fetchWalks]);

  const markedDates = useMemo(() => {
    const result: Record<string, { hasJoined: boolean; lightningCount: number }> = {};
    for (const walk of walks) {
      const key = dateKey(walk.starts_at);
      const existing = result[key] || { hasJoined: false, lightningCount: 0 };
      result[key] = {
        hasJoined: existing.hasJoined || walk.joined,
        lightningCount: existing.lightningCount + 1,
      };
    }
    return result;
  }, [walks]);

  const dateCountMap = useMemo(() => {
    const result: Record<string, number> = {};
    for (const walk of walks) {
      const key = dateKey(walk.starts_at);
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [walks]);

  const joinedDateCountMap = useMemo(() => {
    const result: Record<string, number> = {};
    for (const walk of walks) {
      if (!walk.joined) continue;
      const key = dateKey(walk.starts_at);
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }, [walks]);

  const createWalk = useCallback(async (input: CreateLightningInput) => {
    if (!input.title || !input.location || !input.date || !input.time) {
      Alert.alert('입력 확인', '제목, 장소, 날짜, 시간을 모두 입력해 주세요.');
      return false;
    }
    if (!input.selectedDogIds?.length) {
      Alert.alert('반려견 선택', '번개에 함께 갈 반려견을 선택해 주세요.');
      return false;
    }
    try {
      const user = await requireCurrentUser();
      const startsAt = new Date(`${input.date}T${input.time}:00`).toISOString();
      const maxParticipants = Math.max(2, Number(input.maxParticipants) || 4);
      const { data, error } = await supabase
        .from('lightning_walks')
        .insert({
          user_id: user.id,
          title: input.title.trim(),
          location: input.location.trim(),
          location_lat: input.locationLat ?? null,
          location_lng: input.locationLng ?? null,
          starts_at: startsAt,
          max_participants: maxParticipants,
          ai_summary: buildAiSummary(input.title.trim(), input.location.trim()),
          weather: '날씨 정보는 현장 기준으로 확인해 주세요.',
          region: input.region?.trim() || userLocation || null,
        })
        .select('id')
        .single();
      if (error) throw error;
      if (data?.id) {
        await supabase.from('lightning_participants').insert({
          walk_id: data.id,
          user_id: user.id,
          selected_dog_ids: input.selectedDogIds,
        });
      }
      await fetchWalks();
      Alert.alert('번개 생성 완료', '번개가 등록되었습니다. 지정된 시간이 지나면 자동으로 사라집니다.');
      return true;
    } catch (error) {
      showError('번개 생성 실패', error);
      return false;
    }
  }, [fetchWalks, userLocation]);

  const toggleJoin = useCallback(async (walk: LightningWalk, selectedDogIds: string[] = []) => {
    try {
      const user = await requireCurrentUser();
      if (walk.joined) {
        const { error } = await supabase
          .from('lightning_participants')
          .delete()
          .eq('walk_id', walk.id)
          .eq('user_id', user.id);
        if (error) throw error;
        Alert.alert('참여 취소', '번개 참여가 취소되었습니다.');
      } else {
        if (walk.participant_count >= walk.max_participants) {
          Alert.alert('참여 불가', '정원이 모두 찼습니다.');
          return;
        }
        if (!selectedDogIds.length) {
          Alert.alert('반려견 선택', '번개에 함께 갈 반려견을 선택해 주세요.');
          return;
        }
        const { error } = await supabase
          .from('lightning_participants')
          .insert({ walk_id: walk.id, user_id: user.id, selected_dog_ids: selectedDogIds });
        if (error) throw error;
        Alert.alert('참여 완료', '번개에 참여했습니다. 달력에서 확인할 수 있습니다.');
      }
      await fetchWalks();
    } catch (error) {
      showError('참여 처리 실패', error);
    }
  }, [fetchWalks]);

  return {
    walks,
    loading,
    markedDates,
    dateCountMap,
    joinedDateCountMap,
    regionFilter,
    setRegionFilter,
    userLocation,
    refresh: fetchWalks,
    createWalk,
    toggleJoin,
    formatDateTimeLabel,
  };
}

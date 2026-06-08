import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { formatDateTimeLabel, requireCurrentUser, showError } from '../lib/supabaseApi';

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
  region: string | null;  // 지역 태그
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
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildAiSummary(title: string, location: string) {
  return `${location}에서 진행되는 "${title}" 번개입니다. 참여 전 반려견 성향과 리드줄 준비 상태를 확인해 주세요.`;
}

export function useLightningWalks(joinedOnly = false) {
  const [walks, setWalks] = useState<LightningWalk[]>([]);
  const [loading, setLoading] = useState(true);
  // 사용자 선택 지역 필터 (null = 거주지 기반)
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // 사용자 거주지 로드
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
      // 현재 시각 이후의 번개만 (만료된 것은 자동 제외)
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('lightning_walks')
        .select('id,user_id,title,location,location_lat,location_lng,starts_at,max_participants,ai_summary,weather,created_at,region,lightning_participants(user_id)')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true });
      if (error) throw error;

      const mapped = (data || []).map((row: any) => {
        const participants = row.lightning_participants || [];
        const participantCount = participants.length;
        const maxParticipants = row.max_participants || 4;
        const joined = participants.some((p: any) => p.user_id === user.id);
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
        } as LightningWalk;
      });

      // 지역 필터 적용 (거주지 + 선택 지역 모두 표시)
      let filtered = mapped;
      const regions: Set<string> = new Set();
      if (userLocation) regions.add(userLocation);
      if (regionFilter) regions.add(regionFilter);

      if (regions.size > 0) {
        filtered = mapped.filter((w) => {
          if (!w.region) return true; // 지역 미설정 번개는 모두 표시
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

  // 달력 마킹: 내가 참여한 날 = 파랑, 번개가 있는 날 = 번개 수 표시
  const markedDates = useMemo(() => {
    const result: Record<string, { type: 'joined' | 'lightning'; count: number }> = {};
    for (const walk of walks) {
      const key = dateKey(walk.starts_at);
      const existing = result[key];
      if (!existing) {
        result[key] = { type: walk.joined ? 'joined' : 'lightning', count: 1 };
      } else {
        result[key] = {
          type: existing.type === 'joined' || walk.joined ? 'joined' : 'lightning',
          count: existing.count + 1,
        };
      }
    }
    return result;
  }, [walks]);

  // 날짜별 번개 수 (달력 숫자 표시용)
  const dateCountMap = useMemo(() => {
    const result: Record<string, number> = {};
    for (const walk of walks) {
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
        await supabase.from('lightning_participants').insert({ walk_id: data.id, user_id: user.id });
      }
      await fetchWalks();
      Alert.alert('번개 생성 완료', '번개가 등록되었습니다. 지정된 시간이 지나면 자동으로 사라집니다.');
      return true;
    } catch (error) {
      showError('번개 생성 실패', error);
      return false;
    }
  }, [fetchWalks, userLocation]);

  const toggleJoin = useCallback(async (walk: LightningWalk) => {
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
        const { error } = await supabase
          .from('lightning_participants')
          .insert({ walk_id: walk.id, user_id: user.id });
        if (error) throw error;
        Alert.alert('참여 완료', '번개에 참여했습니다! 달력에서 확인할 수 있습니다.');
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
    regionFilter,
    setRegionFilter,
    userLocation,
    refresh: fetchWalks,
    createWalk,
    toggleJoin,
    formatDateTimeLabel,
  };
}

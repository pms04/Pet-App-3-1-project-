import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { formatDateTimeLabel, requireCurrentUser, showError } from '../lib/supabaseApi';

export interface LightningWalk {
  id: string;
  user_id: string;
  title: string;
  location: string;
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
}

export interface CreateLightningInput {
  title: string;
  location: string;
  date: string;
  time: string;
  maxParticipants: string;
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

  const fetchWalks = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data, error } = await supabase
        .from('lightning_walks')
        .select('id,user_id,title,location,starts_at,max_participants,ai_summary,weather,created_at,lightning_participants(user_id)')
        .gte('starts_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true });
      if (error) throw error;
      const mapped = (data || []).map((row: any) => {
        const participants = row.lightning_participants || [];
        const participantCount = participants.length;
        const maxParticipants = row.max_participants || 4;
        const joined = participants.some((participant: any) => participant.user_id === user.id);
        return {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          location: row.location,
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
        };
      });
      setWalks(joinedOnly ? mapped.filter((walk: LightningWalk) => walk.joined) : mapped);
    } catch (error) {
      showError('번개 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, [joinedOnly]);

  useEffect(() => { fetchWalks(); }, [fetchWalks]);

  const markedDates = useMemo(() => walks.reduce<Record<string, 'lightning'>>((acc, walk) => {
    acc[dateKey(walk.starts_at)] = 'lightning';
    return acc;
  }, {}), [walks]);

  const createWalk = useCallback(async (input: CreateLightningInput) => {
    if (!input.title || !input.location || !input.date || !input.time) {
      Alert.alert('입력 확인', '제목, 장소, 날짜, 시간을 모두 입력해주세요.');
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
          starts_at: startsAt,
          max_participants: maxParticipants,
          ai_summary: buildAiSummary(input.title.trim(), input.location.trim()),
          weather: '날씨 정보는 현장 기준으로 확인해 주세요.',
        })
        .select('id')
        .single();
      if (error) throw error;
      if (data?.id) {
        await supabase.from('lightning_participants').insert({ walk_id: data.id, user_id: user.id });
      }
      await fetchWalks();
      Alert.alert('번개 생성 완료', '번개가 등록되었습니다.');
      return true;
    } catch (error) {
      showError('번개 생성 실패', error);
      return false;
    }
  }, [fetchWalks]);

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
      } else {
        if (walk.participant_count >= walk.max_participants) {
          Alert.alert('참여 불가', '정원이 모두 찼습니다.');
          return;
        }
        const { error } = await supabase
          .from('lightning_participants')
          .insert({ walk_id: walk.id, user_id: user.id });
        if (error) throw error;
      }
      await fetchWalks();
    } catch (error) {
      showError('참여 처리 실패', error);
    }
  }, [fetchWalks]);

  return { walks, loading, markedDates, refresh: fetchWalks, createWalk, toggleJoin, formatDateTimeLabel };
}

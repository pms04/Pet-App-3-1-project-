import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export interface GpsPoint {
  latitude: number;
  longitude: number;
}

export interface WalkLog {
  id: string;
  user_id: string;
  dog_id: string;
  distance_km: number;
  duration_sec: number;
  gps_path: GpsPoint[];
  rating: 'GOOD' | 'BAD';
  created_at: string;
}

export function useWalkLogs() {
  const [walkLogs, setWalkLogs] = useState<WalkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWalkLogs = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data, error } = await supabase
        .from('walk_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWalkLogs((data || []) as WalkLog[]);
    } catch (error) {
      showError('산책 기록 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWalkLogs(); }, [fetchWalkLogs]);

  const markedDates = useMemo(() => walkLogs.reduce<Record<string, 'walk'>>((acc, log) => {
    acc[new Date(log.created_at).toISOString().slice(0, 10)] = 'walk';
    return acc;
  }, {}), [walkLogs]);

  const saveWalkLog = useCallback(async (distanceKm: number, durationSec: number, gpsPath: GpsPoint[]) => {
    if (gpsPath.length < 2 || distanceKm <= 0) {
      Alert.alert('저장 불가', '기록할 산책 경로가 충분하지 않습니다.');
      return false;
    }

    try {
      const user = await requireCurrentUser();
      const { data: dogs, error: dogError } = await supabase
        .from('dogs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      if (dogError) throw dogError;
      const dogId = dogs?.[0]?.id;
      if (!dogId) {
        Alert.alert('반려견 등록 필요', '산책 기록을 저장하려면 먼저 프로필 탭에서 반려견을 등록해주세요.');
        return false;
      }

      const { error } = await supabase.from('walk_logs').insert({
        user_id: user.id,
        dog_id: dogId,
        distance_km: Number(distanceKm.toFixed(2)),
        duration_sec: Math.max(1, Math.round(durationSec)),
        gps_path: gpsPath,
        rating: 'GOOD',
      });
      if (error) throw error;
      await fetchWalkLogs();
      Alert.alert('저장 완료', '산책 기록이 Supabase에 저장되었습니다.');
      return true;
    } catch (error) {
      showError('산책 기록 저장 실패', error);
      return false;
    }
  }, [fetchWalkLogs]);

  return { walkLogs, loading, markedDates, refresh: fetchWalkLogs, saveWalkLog };
}

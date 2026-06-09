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
  course_name: string | null;
  is_public: boolean;
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

  // 산책 완료 날짜 마킹 (주황색 — 달력에서 사용)
  const markedDates = useMemo(() => walkLogs.reduce<Record<string, 'walk'>>((acc, log) => {
    acc[new Date(log.created_at).toISOString().slice(0, 10)] = 'walk';
    return acc;
  }, {}), [walkLogs]);

  // 산책 저장 (선택된 강아지 ID 지원)
  const saveWalkLog = useCallback(async (
    distanceKm: number,
    durationSec: number,
    gpsPath: GpsPoint[],
    selectedDogIds?: string[],
  ) => {
    if (gpsPath.length < 1) {
      Alert.alert('저장 불가', '기록할 산책 경로가 없습니다.');
      return false;
    }

    try {
      const user = await requireCurrentUser();

      // 선택된 강아지가 있으면 그 중 첫 번째, 없으면 가장 오래된 강아지
      let dogId: string | undefined;
      if (selectedDogIds && selectedDogIds.length > 0) {
        dogId = selectedDogIds[0];
      } else {
        const { data: dogs, error: dogError } = await supabase
          .from('dogs')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);
        if (dogError) throw dogError;
        dogId = dogs?.[0]?.id;
      }

      if (!dogId) {
        Alert.alert('반려견 등록 필요', '산책 기록을 저장하려면 먼저 프로필 탭에서 반려견을 등록해 주세요.');
        return false;
      }

      // 산책 시간 포맷 (분 단위)
      const durationMin = Math.round(durationSec / 60);
      const durationLabel = durationMin >= 60
        ? `${Math.floor(durationMin / 60)}시간 ${durationMin % 60}분`
        : `${durationMin}분`;

      // 자동 코스 이름 생성 (날짜 기반)
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
      const autoCourseName = `${dateStr} 산책 코스 (${distanceKm.toFixed(2)}km)`;

      const { data: walkLogData, error } = await supabase.from('walk_logs').insert({
        user_id: user.id,
        dog_id: dogId,
        distance_km: Number(distanceKm.toFixed(2)),
        duration_sec: Math.max(1, Math.round(durationSec)),
        gps_path: gpsPath,
        rating: 'GOOD',
        course_name: autoCourseName,
        is_public: false,
      }).select('id').single();
      if (error) throw error;

      // 내 코스(posts 테이블)에도 자동 저장 (커뮤니티 미공개 상태)
      if (walkLogData?.id) {
        await supabase.from('posts').insert({
          user_id: user.id,
          image_url: null,
          course_name: autoCourseName,
          distance: `${distanceKm.toFixed(2)}km`,
          duration: durationLabel,
          content: null,
          tags: [],
          walk_log_id: walkLogData.id,
        });
      }

      await fetchWalkLogs();
      Alert.alert('산책 완료! 🐾', `${distanceKm.toFixed(2)}km 산책이 기록되었습니다.\n코스 탭의 내 코스에서 확인할 수 있습니다.`);
      return true;
    } catch (error) {
      showError('산책 기록 저장 실패', error);
      return false;
    }
  }, [fetchWalkLogs]);

  return { walkLogs, loading, markedDates, refresh: fetchWalkLogs, saveWalkLog };
}

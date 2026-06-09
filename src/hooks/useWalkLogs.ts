import { useCallback, useState } from 'react';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export interface WalkLog {
  id: string;
  user_id: string;
  dog_id: string;
  distance_km: number;
  duration_sec: number;
  gps_path: any; // JSONB
  rating: 'GOOD' | 'BAD';
  created_at: string;
  matched_user_id: string | null;
  matched_dog_id: string | null;
  is_matched_walk: boolean;
  course_name: string | null;
  is_public: boolean;
}

export function useWalkLogs() {
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  const refresh = useCallback(async () => {
    try {
      const user = await requireCurrentUser();
      const { data } = await supabase.from('walk_logs').select('created_at').eq('user_id', user.id);
      const marks: any = {};
      data?.forEach(w => {
        const key = w.created_at.slice(0, 10);
        marks[key] = (marks[key] || '') + 'walk_completed ';
      });
      setMarkedDates(marks);
    } catch (e) {}
  }, []);
  // 산책 저장 (내 코스에만 저장, 커뮤니티는 수동 공유만)
  const saveWalkLog = useCallback(async (input: {
    dog_id: string;
    distance_km: number;
    duration_sec: number;
    gps_path: any;
    rating?: 'GOOD' | 'BAD';
    matched_user_id?: string | null;
    matched_dog_id?: string | null;
    is_matched_walk?: boolean;
  }): Promise<WalkLog | null> => {
    try {
      const user = await requireCurrentUser();

      // 1. walk_logs 테이블에 저장
      const { data: walkLog, error: walkError } = await supabase
        .from('walk_logs')
        .insert({
          user_id: user.id,
          dog_id: input.dog_id,
          distance_km: input.distance_km,
          duration_sec: input.duration_sec,
          gps_path: input.gps_path,
          rating: input.rating || 'GOOD',
          matched_user_id: input.matched_user_id || null,
          matched_dog_id: input.matched_dog_id || null,
          is_matched_walk: input.is_matched_walk || false,
          course_name: `산책 기록 ${new Date().toLocaleDateString('ko-KR')}`,
          is_public: false,
        })
        .select()
        .single();

      if (walkError) throw walkError;

      // 2. posts 테이블에 자동 저장 (내 코스에만)
      // 커뮤니티는 사용자가 수동으로 공유할 때만 등록
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          walk_log_id: walkLog.id,
          course_name: `산책 기록 ${new Date().toLocaleDateString('ko-KR')}`,
          distance: `${input.distance_km.toFixed(2)}km`,
          duration: `${Math.floor(input.duration_sec / 60)}분`,
          gps_path: input.gps_path,
          content: input.is_matched_walk 
            ? `${input.matched_user_id}님과 함께한 산책`
            : '개인 산책',
          tags: input.is_matched_walk ? ['매칭', '산책'] : ['산책'],
        });

      if (postError) throw postError;

      return walkLog as WalkLog;
    } catch (error) {
      showError('산책 저장 실패', error);
      return null;
    }
  }, []);

  return { saveWalkLog, loading, markedDates, refresh };
}

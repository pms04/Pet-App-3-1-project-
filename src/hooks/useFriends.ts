import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export interface Friend {
  id: string;
  name: string;
  profileImageUrl: string | null;
  location: string | null;
  dog: string | null;
  bio: string | null;
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data: pairs, error } = await supabase
        .from('friends')
        .select('user_id,friend_id,status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'ACCEPTED');
      if (error) throw error;

      const ids = Array.from(new Set((pairs || []).map((pair: any) => pair.user_id === user.id ? pair.friend_id : pair.user_id).filter(Boolean)));
      if (!ids.length) {
        setFriends([]);
        return;
      }

      const [{ data: profiles, error: profileError }, { data: dogs, error: dogError }] = await Promise.all([
        supabase.from('users').select('id,nickname,profile_image_url,bio,location').in('id', ids),
        supabase.from('dogs').select('user_id,name').in('user_id', ids),
      ]);
      if (profileError) throw profileError;
      if (dogError) throw dogError;

      setFriends((profiles || []).map((profile: any) => ({
        id: profile.id,
        name: profile.nickname || '이름 없는 사용자',
        profileImageUrl: profile.profile_image_url || null,
        location: profile.location || null,
        bio: profile.bio || null,
        dog: (dogs || []).find((dog: any) => dog.user_id === profile.id)?.name || null,
      })));
    } catch (error) {
      showError('친구 목록 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  return { friends, loading, friendCount: friends.length, refresh: fetchFriends };
}

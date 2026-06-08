import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export type FriendRequestDirection = 'accepted' | 'sent' | 'received';

export interface Friend {
  id: string;
  relationId: string;
  name: string;
  profileImageUrl: string | null;
  location: string | null;
  dog: string | null;
  bio: string | null;
  direction: FriendRequestDirection;
  requestedAt: string | null;
}

function normalizeStatus(status?: string | null) {
  return String(status || '').toLowerCase();
}

function buildFriendRows(rows: any[], profiles: any[], dogs: any[], myUserId: string, direction: FriendRequestDirection): Friend[] {
  return rows
    .map((row) => {
      const otherUserId = row.requester_id === myUserId ? row.addressee_id : row.requester_id;
      const profile = profiles.find((item: any) => item.id === otherUserId);
      if (!profile) return null;
      const representativeDog = dogs.find((dog: any) => dog.user_id === otherUserId);
      return {
        id: profile.id,
        relationId: row.id,
        name: profile.nickname || '이름 없는 사용자',
        profileImageUrl: profile.profile_image_url || null,
        location: profile.location || null,
        bio: profile.bio || null,
        dog: representativeDog?.name || null,
        direction,
        requestedAt: row.created_at || null,
      } as Friend;
    })
    .filter(Boolean) as Friend[];
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data: pairs, error } = await supabase
        .from('friends')
        .select('id,requester_id,addressee_id,status,created_at')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = pairs || [];
      const acceptedRows = rows.filter((row: any) => normalizeStatus(row.status) === 'accepted');
      const sentRows = rows.filter((row: any) => normalizeStatus(row.status) === 'pending' && row.requester_id === user.id);
      const receivedRows = rows.filter((row: any) => normalizeStatus(row.status) === 'pending' && row.addressee_id === user.id);

      const ids = Array.from(new Set(rows.map((pair: any) => pair.requester_id === user.id ? pair.addressee_id : pair.requester_id).filter(Boolean)));
      if (!ids.length) {
        setFriends([]);
        setSentRequests([]);
        setReceivedRequests([]);
        return;
      }

      const [{ data: profiles, error: profileError }, { data: dogs, error: dogError }] = await Promise.all([
        supabase.from('users').select('id,nickname,profile_image_url,bio,location').in('id', ids),
        supabase.from('dogs').select('user_id,name').in('user_id', ids),
      ]);
      if (profileError) throw profileError;
      if (dogError) throw dogError;

      setFriends(buildFriendRows(acceptedRows, profiles || [], dogs || [], user.id, 'accepted'));
      setSentRequests(buildFriendRows(sentRows, profiles || [], dogs || [], user.id, 'sent'));
      setReceivedRequests(buildFriendRows(receivedRows, profiles || [], dogs || [], user.id, 'received'));
    } catch (error) {
      showError('친구 목록 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const acceptRequest = useCallback(async (relationId: string) => {
    try {
      const user = await requireCurrentUser();
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', relationId)
        .eq('addressee_id', user.id);
      if (error) throw error;
      await fetchFriends();
      Alert.alert('친구 수락', '친구 요청을 수락했습니다.');
    } catch (error) {
      showError('친구 수락 실패', error);
    }
  }, [fetchFriends]);

  const rejectRequest = useCallback(async (relationId: string) => {
    try {
      const user = await requireCurrentUser();
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', relationId)
        .eq('addressee_id', user.id);
      if (error) throw error;
      await fetchFriends();
      Alert.alert('친구 거절', '친구 요청을 거절했습니다.');
    } catch (error) {
      showError('친구 거절 실패', error);
    }
  }, [fetchFriends]);

  const cancelRequest = useCallback(async (relationId: string) => {
    try {
      const user = await requireCurrentUser();
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', relationId)
        .eq('requester_id', user.id);
      if (error) throw error;
      await fetchFriends();
      Alert.alert('신청 취소', '친구 신청을 취소했습니다.');
    } catch (error) {
      showError('친구 신청 취소 실패', error);
    }
  }, [fetchFriends]);

  const sendFriendRequest = useCallback(async (otherUserId: string) => {
    try {
      const user = await requireCurrentUser();
      if (user.id === otherUserId) {
        Alert.alert('알림', '자기 자신에게 친구 신청을 보낼 수 없습니다.');
        return;
      }

      // 이미 친구이거나 신청 중인지 확인
      const { data: existing, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`);
      
      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        const rel = existing[0];
        if (rel.status === 'accepted') {
          Alert.alert('알림', '이미 친구 등록이 되어 있습니다.');
        } else {
          Alert.alert('알림', '이미 친구 신청을 보냈거나 받은 상태입니다.');
        }
        return;
      }

      const { error } = await supabase.from('friends').insert({
        requester_id: user.id,
        addressee_id: otherUserId,
        status: 'pending'
      });
      if (error) throw error;
      Alert.alert('완료', '친구 신청을 보냈습니다.');
      await fetchFriends();
    } catch (error) {
      showError('친구 신청 실패', error);
    }
  }, [fetchFriends]);

  return {
    friends,
    sentRequests,
    receivedRequests,
    loading,
    friendCount: friends.length,
    refresh: fetchFriends,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    sendFriendRequest,
  };
}

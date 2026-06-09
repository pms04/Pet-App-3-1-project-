import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { formatTime, requireCurrentUser } from '../lib/supabaseApi';

export interface ChatRoomPreview {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'group' | 'direct';
  // 추가: 상대방 정보 (MessageDetailModal에 전달)
  other_user_id: string | null;
  other_user_nickname: string;
  other_user_profile_image_url: string | null;
}

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoomPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      const { data: memberships, error } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id);
      if (error) throw error;
      const roomIds = Array.from(new Set((memberships || []).map((item: any) => item.room_id)));
      if (!roomIds.length) {
        setRooms([]);
        return;
      }

      // users 테이블 join으로 실제 프로필 이미지 가져오기
      const { data: memberRows } = await supabase
        .from('chat_room_members')
        .select('room_id,user_id,users(id,nickname,profile_image_url)')
        .in('room_id', roomIds);
      const { data: messages } = await supabase
        .from('messages')
        .select('id,room_id,sender_id,content,created_at')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });

      const latestByRoom = new Map<string, any>();
      (messages || []).forEach((message: any) => {
        if (!latestByRoom.has(message.room_id)) latestByRoom.set(message.room_id, message);
      });

      const membersByRoom = (memberRows || []).reduce<Record<string, any[]>>((acc, row: any) => {
        if (!acc[row.room_id]) acc[row.room_id] = [];
        acc[row.room_id].push(row);
        return acc;
      }, {});

      setRooms(roomIds.map((roomId) => {
        const members = membersByRoom[roomId] || [];
        const otherMembers = members.filter((member) => member.user_id !== user.id);
        const names = otherMembers.map((member) => member.users?.nickname).filter(Boolean);
        const latest = latestByRoom.get(roomId);
        const firstOther = otherMembers[0];
        return {
          id: roomId,
          name: names.length ? names.join(', ') : '내 대화방',
          lastMessage: latest?.content || '아직 메시지가 없습니다.',
          time: formatTime(latest?.created_at),
          unread: 0,
          type: otherMembers.length > 1 ? 'group' : 'direct',
          // 상대방 정보 (실제 users 테이블 데이터)
          other_user_id: firstOther?.user_id || null,
          other_user_nickname: firstOther?.users?.nickname || '상대방',
          other_user_profile_image_url: firstOther?.users?.profile_image_url || null,
        };
      }));
    } catch (error) {
      console.warn('[대화방 불러오기 실패]', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Realtime 구독: 새 메시지 도착 시 채팅방 목록 갱신
  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('chat_rooms_messages_watch')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchRooms();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_room_members',
      }, () => {
        fetchRooms();
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [fetchRooms]);

  return { rooms, loading, refresh: fetchRooms };
}

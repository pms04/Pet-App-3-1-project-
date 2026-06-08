import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { formatTime, requireCurrentUser, showError } from '../lib/supabaseApi';

export interface ChatRoomPreview {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  type: 'group' | 'direct';
}

export function useChatRooms() {
  const [rooms, setRooms] = useState<ChatRoomPreview[]>([]);
  const [loading, setLoading] = useState(true);

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
        return {
          id: roomId,
          name: names.length ? names.join(', ') : '내 대화방',
          lastMessage: latest?.content || '아직 메시지가 없습니다.',
          time: formatTime(latest?.created_at),
          unread: 0,
          type: otherMembers.length > 1 ? 'group' : 'direct',
        };
      }));
    } catch (error) {
      showError('대화방 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  return { rooms, loading, refresh: fetchRooms };
}

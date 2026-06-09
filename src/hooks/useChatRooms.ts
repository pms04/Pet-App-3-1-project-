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

      const { data: memberRows } = await supabase
        .from('chat_room_members')
        .select('room_id,user_id')
        .in('room_id', roomIds);
      const { data: messages } = await supabase
        .from('messages')
        .select('id,room_id,sender_id,content,created_at')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });

      const otherUserIds = Array.from(new Set((memberRows || [])
        .filter((row: any) => row.user_id !== user.id)
        .map((row: any) => row.user_id)
        .filter(Boolean)));
      const { data: otherUsers } = otherUserIds.length > 0 ? await supabase
        .from('users')
        .select('id,nickname,profile_image_url')
        .in('id', otherUserIds) : { data: [] };
      const otherUsersById = (otherUsers || []).reduce<Record<string, any>>((acc, userRow: any) => {
        acc[userRow.id] = userRow;
        return acc;
      }, {});

      const latestByRoom = new Map<string, any>();
      (messages || []).forEach((message: any) => {
        if (!latestByRoom.has(message.room_id)) latestByRoom.set(message.room_id, message);
      });

      const membersByRoom = (memberRows || []).reduce<Record<string, any[]>>((acc, row: any) => {
        if (!acc[row.room_id]) acc[row.room_id] = [];
        acc[row.room_id].push(row);
        return acc;
      }, {});

      const roomList: Array<ChatRoomPreview & { latestTimestamp: number }> = roomIds.map((roomId) => {
        const members = membersByRoom[roomId] || [];
        const otherMembers = members.filter((member) => member.user_id !== user.id);
        const otherUserId = otherMembers[0]?.user_id;
        const otherUser = otherUserId ? otherUsersById[otherUserId] : null;
        const otherNickname = otherUser?.nickname || '상대방';
        const otherProfileImageUrl = otherUser?.profile_image_url || null;
        const names = otherMembers
          .map((member) => otherUsersById[member.user_id]?.nickname)
          .filter(Boolean);
        const latest = latestByRoom.get(roomId);
        const latestTimestamp = latest?.created_at ? new Date(latest.created_at).getTime() : 0;
        
        const displayName = otherMembers.length === 1
          ? otherNickname
          : names.length > 0 ? names.join(', ') : '대화방';
        
        return {
          id: roomId,
          name: displayName,
          lastMessage: latest?.content || '아직 메시지가 없습니다.',
          time: formatTime(latest?.created_at),
          unread: 0,
          type: otherMembers.length > 1 ? 'group' : 'direct',
          other_user_id: otherUserId || null,
          other_user_nickname: otherNickname,
          other_user_profile_image_url: otherProfileImageUrl,
          latestTimestamp,
        };
      });

      roomList.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
      setRooms(roomList.map(({ latestTimestamp, ...room }) => room));
    } catch (error) {
      console.warn('[대화방 불러오기 실패]', error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

/**
 * 두 사용자 간의 기존 1:1 채팅방을 찾거나 새로 생성하는 함수
 * @param otherUserId 상대방 사용자 ID
 * @returns 채팅방 ID
 */
export async function getOrCreateDirectChatRoom(otherUserId: string): Promise<string> {
  try {
    const user = await requireCurrentUser();

    // 현재 사용자와 상대방이 모두 속한 채팅방을 검색
    const { data: roomRows, error } = await supabase
      .from('chat_room_members')
      .select('room_id,user_id')
      .in('user_id', [user.id, otherUserId]);

    if (error) throw error;

    const candidateRoomIds = Object.entries((roomRows || []).reduce<Record<string, Set<string>>>((acc, row: any) => {
      if (!acc[row.room_id]) acc[row.room_id] = new Set();
      acc[row.room_id].add(row.user_id);
      return acc;
    }, {})).filter(([_, members]) =>
      members.has(user.id) && members.has(otherUserId)
    ).map(([roomId]) => roomId);

    if (candidateRoomIds.length > 0) {
      return candidateRoomIds[0];
    }

    return await createNewDirectChatRoom(user.id, otherUserId);
  } catch (error) {
    console.error('[채팅방 조회/생성 실패]', error);
    throw error;
  }
}

async function createNewDirectChatRoom(userId: string, otherUserId: string): Promise<string> {
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({})
    .select('id')
    .single();
  
  if (roomError) throw roomError;
  
  const { error: memberError } = await supabase
    .from('chat_room_members')
    .insert([
      { room_id: room.id, user_id: userId },
      { room_id: room.id, user_id: otherUserId },
    ]);
  
  if (memberError) throw memberError;
  
  return room.id;
}

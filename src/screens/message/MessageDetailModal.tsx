import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from 'react-native';
import { supabase } from '../../../supabase';
import { requireCurrentUser, showError } from '../../lib/supabaseApi';
import { T } from '../../styles/styles';

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_nickname?: string;
  sender_profile_image_url?: string | null;
}

interface ChatRoom {
  id: string;
  other_user_nickname: string;
  other_user_profile_image_url: string | null;
  other_user_id: string;
  last_message: string | null;
  last_message_at: string | null;
}

interface Props {
  visible: boolean;
  room: ChatRoom | null;
  onClose: () => void;
}

export function MessageDetailModal({ visible, room, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string>('나');
  const [myProfileImageUrl, setMyProfileImageUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── 내 사용자 정보 로드
  useEffect(() => {
    (async () => {
      try {
        const user = await requireCurrentUser();
        setMyUserId(user.id);
        const { data } = await supabase
          .from('users')
          .select('nickname,profile_image_url')
          .eq('id', user.id)
          .single();
        if (data) {
          setMyNickname(data.nickname || '나');
          setMyProfileImageUrl(data.profile_image_url || null);
        }
      } catch (_) {}
    })();
  }, []);

  // ── 메시지 목록 로드
  const fetchMessages = useCallback(async () => {
    if (!room) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id,room_id,sender_id,content,created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      showError('메시지 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, [room]);

  // ── Realtime 구독 (채팅방 열릴 때)
  useEffect(() => {
    if (!visible || !room) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel(`messages_${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room.id}`,
      }, async (payload: any) => {
        const newMsg = payload.new as Message;
        // 발신자 프로필 정보 가져오기
        const { data: senderData } = await supabase
          .from('users')
          .select('nickname,profile_image_url')
          .eq('id', newMsg.sender_id)
          .single();
        const enrichedMsg: Message = {
          ...newMsg,
          sender_nickname: senderData?.nickname || '사용자',
          sender_profile_image_url: senderData?.profile_image_url || null,
        };
        setMessages((prev) => {
          // 중복 방지
          if (prev.some((m) => m.id === enrichedMsg.id)) return prev;
          return [...prev, enrichedMsg];
        });
        // 스크롤 맨 아래로
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [visible, room, fetchMessages]);

  // ── 메시지 전송
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !room || !myUserId) return;
    setInputText('');
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: myUserId,
        content: text,
      });
      if (error) throw error;
    } catch (error) {
      setInputText(text); // 실패 시 복원
      showError('메시지 전송 실패', error);
    }
  }, [inputText, room, myUserId]);

  // ── 메시지 로드 후 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender_id === myUserId;
    const profileImageUrl = isMe ? myProfileImageUrl : room?.other_user_profile_image_url || null;
    const nickname = isMe ? myNickname : room?.other_user_nickname || '상대방';
    const timeStr = new Date(item.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[ms.messageRow, isMe && ms.messageRowMe]}>
        {!isMe && (
          <View style={ms.avatarWrap}>
            {profileImageUrl
              ? <Image source={{ uri: profileImageUrl }} style={ms.avatar} />
              : <Text style={ms.avatarText}>{nickname.slice(0, 1)}</Text>}
          </View>
        )}
        <View style={[ms.bubbleWrap, isMe && ms.bubbleWrapMe]}>
          {!isMe && <Text style={ms.senderName}>{nickname}</Text>}
          <View style={[ms.bubble, isMe ? ms.bubbleMe : ms.bubbleOther]}>
            <Text style={[ms.bubbleText, isMe && ms.bubbleTextMe]}>{item.content}</Text>
          </View>
          <Text style={[ms.timeText, isMe && ms.timeTextMe]}>{timeStr}</Text>
        </View>
      </View>
    );
  }, [myUserId, myNickname, myProfileImageUrl, room]);

  if (!room) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* 헤더 */}
        <View style={ms.header}>
          <TouchableOpacity onPress={onClose} style={ms.backBtn}>
            <Text style={ms.backText}>{'< 뒤로'}</Text>
          </TouchableOpacity>
          <View style={ms.headerCenter}>
            <View style={ms.headerAvatarWrap}>
              {room.other_user_profile_image_url
                ? <Image source={{ uri: room.other_user_profile_image_url }} style={ms.headerAvatar} />
                : <Text style={ms.headerAvatarText}>{room.other_user_nickname.slice(0, 1)}</Text>}
            </View>
            <Text style={ms.headerTitle}>{room.other_user_nickname}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* 메시지 목록 */}
        {loading ? (
          <View style={ms.loadingWrap}><ActivityIndicator color={T.accent} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={ms.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={ms.emptyWrap}>
                <Text style={ms.emptyText}>{room.other_user_nickname}님과 대화를 시작해 보세요!</Text>
              </View>
            }
          />
        )}

        {/* 입력창 */}
        <View style={ms.inputBar}>
          <TextInput
            style={ms.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#8E8E93"
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[ms.sendBtn, !inputText.trim() && ms.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={ms.sendBtnText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: T.white,
    borderBottomWidth: 0.5,
    borderBottomColor: T.fill2,
  },
  backBtn: { width: 60 },
  backText: { color: T.accent, fontSize: 15, fontWeight: '600' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAvatarWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.fill1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerAvatarText: { fontSize: 14, fontWeight: '800', color: T.accent },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.label1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 20 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: T.label4, textAlign: 'center', lineHeight: 22 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatarWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.fill1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarText: { fontSize: 14, fontWeight: '800', color: T.accent },
  bubbleWrap: { maxWidth: '72%' },
  bubbleWrapMe: { alignItems: 'flex-end' },
  senderName: { fontSize: 11, color: T.label4, marginBottom: 3, marginLeft: 4 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: T.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: T.accent,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 15, color: T.label1, lineHeight: 22 },
  bubbleTextMe: { color: T.white },
  timeText: { fontSize: 10, color: T.label4, marginTop: 3, marginLeft: 4 },
  timeTextMe: { marginLeft: 0, marginRight: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: T.white,
    borderTopWidth: 0.5,
    borderTopColor: T.fill2,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: T.fill1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: T.label1,
    maxHeight: 120,
  },
  sendBtn: {
    backgroundColor: T.accent,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: T.fill2 },
  sendBtnText: { color: T.white, fontSize: 14, fontWeight: '700' },
});

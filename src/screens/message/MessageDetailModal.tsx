import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../supabase';
import { requireCurrentUser, formatTime } from '../../lib/supabaseApi';
import { T } from '../../styles/styles';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  visible: boolean;
  roomId: string | null;
  roomName: string;
  onClose: () => void;
}

export function MessageDetailModal({ visible, roomId, roomName, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && roomId) {
      fetchMessages();
      subscribeMessages();
      getCurrentUser();
    }
  }, [visible, roomId]);

  const getCurrentUser = async () => {
    const user = await requireCurrentUser();
    setMyId(user.id);
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeMessages = () => {
    if (!roomId) return;
    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async () => {
    if (!input.trim() || !roomId || !myId) return;
    const content = input.trim();
    setInput('');
    try {
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: myId,
        content,
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F2F2F7' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.headerBtn}>닫기</Text></TouchableOpacity>
          <Text style={s.headerTitle}>{roomName}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {loading && <ActivityIndicator color={T.accent} style={{ marginBottom: 20 }} />}
          {messages.map((msg) => {
            const isMe = msg.sender_id === myId;
            return (
              <View key={msg.id} style={[s.msgRow, isMe ? s.msgMe : s.msgOther]}>
                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
                  <Text style={[s.msgText, isMe && { color: '#FFF' }]}>{msg.content}</Text>
                </View>
                <Text style={s.timeText}>{formatTime(msg.created_at)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={s.inputArea}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요..."
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
            <Text style={s.sendBtnText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerBtn: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  msgRow: { marginBottom: 12, maxWidth: '80%' },
  msgMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#FF8C00' },
  bubbleOther: { backgroundColor: '#FFF', borderWidth: 0.5, borderColor: '#C6C6C8' },
  msgText: { fontSize: 15, color: '#1C1C1E', lineHeight: 20 },
  timeText: { fontSize: 10, color: '#8E8E93', marginTop: 4 },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 12,
    backgroundColor: '#FFF',
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: { marginLeft: 12, paddingVertical: 8, paddingHorizontal: 4 },
  sendBtnText: { color: '#FF8C00', fontWeight: '700', fontSize: 16 },
});

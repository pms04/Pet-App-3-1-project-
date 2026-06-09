import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, StyleSheet,
} from 'react-native';
import { styles } from '../styles/styles';
import { useChatRooms, ChatRoomPreview } from '../hooks/useChatRooms';
import { MessageDetailModal } from './message/MessageDetailModal';

export function MessageScreen() {
  const [query, setQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomPreview | null>(null);
  const { rooms, loading, refresh } = useChatRooms();
  const filteredRooms = useMemo(
    () => rooms.filter((room) => `${room.name} ${room.lastMessage}`.toLowerCase().includes(query.toLowerCase())),
    [rooms, query],
  );

  return (
    <View style={styles.appleContainer}>
      <Text style={[styles.appleSectionTitle, { marginTop: 20, marginBottom: 16 }]}>메시지</Text>
      <View style={{
        backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 12,
        paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 16,
      }}>
        <Text style={{ marginRight: 8 }}>검색</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="대화방 또는 친구 검색"
          style={{ flex: 1, fontSize: 14 }}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {loading ? (
        <View style={{ paddingTop: 40, alignItems: 'center' }}>
          <ActivityIndicator color="#FF8C00" />
          <Text style={{ color: '#8E8E93', marginTop: 10 }}>대화방을 불러오는 중입니다.</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredRooms.length === 0 ? (
            <View style={{ padding: 24, backgroundColor: '#F2F2F7', borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#1C1C1E', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>대화방이 없습니다.</Text>
              <Text style={{ color: '#8E8E93', fontSize: 13, textAlign: 'center' }}>
                지도에서 주변 강아지에게 산책을 신청하면 대화방이 생성됩니다.
              </Text>
            </View>
          ) : (
            filteredRooms.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.listItemRow}
                onPress={() => setSelectedRoom(chat)}
                activeOpacity={0.8}
              >
                {/* 상대방 실제 프로필 이미지 표시 */}
                <View style={ms.avatarWrap}>
                  {chat.other_user_profile_image_url
                    ? <Image source={{ uri: chat.other_user_profile_image_url }} style={ms.avatarImage} />
                    : <Text style={ms.avatarText}>
                        {chat.type === 'group' ? 'G' : chat.name.slice(0, 1)}
                      </Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.listItemTitle}>{chat.type === 'direct' ? chat.other_user_nickname : (chat.name === '대화방' ? chat.other_user_nickname : chat.name)}</Text>
                    <Text style={{ fontSize: 11, color: '#8E8E93' }}>{chat.time}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <Text style={[styles.listItemSub, { flex: 1 }]} numberOfLines={1}>{chat.lastMessage}</Text>
                    {chat.unread > 0 && (
                      <View style={{
                        backgroundColor: '#FF8C00', minWidth: 18, height: 18, borderRadius: 9,
                        justifyContent: 'center', alignItems: 'center', marginLeft: 8, paddingHorizontal: 4,
                      }}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{chat.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* MessageDetailModal에 room 전체 객체 전달 (상대방 프로필 포함) */}
      <MessageDetailModal
        visible={!!selectedRoom}
        room={selectedRoom ? {
          id: selectedRoom.id,
          other_user_nickname: selectedRoom.other_user_nickname,
          other_user_profile_image_url: selectedRoom.other_user_profile_image_url,
          other_user_id: selectedRoom.other_user_id || '',
          last_message: selectedRoom.lastMessage,
          last_message_at: null,
        } : null}
        onClose={() => setSelectedRoom(null)}
      />
    </View>
  );
}

const ms = StyleSheet.create({
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#FF8C00' },
});

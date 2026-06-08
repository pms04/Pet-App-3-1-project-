import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { styles } from '../styles/styles';
import { useChatRooms } from '../hooks/useChatRooms';
import { MessageDetailModal } from './message/MessageDetailModal';

export function MessageScreen() {
  const [query, setQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string } | null>(null);
  const { rooms, loading, refresh } = useChatRooms();
  const filteredRooms = useMemo(() => rooms.filter((room) => `${room.name} ${room.lastMessage}`.toLowerCase().includes(query.toLowerCase())), [rooms, query]);

  return (
    <View style={styles.appleContainer}>
      <Text style={[styles.appleSectionTitle, { marginTop: 20, marginBottom: 16 }]}>메시지</Text>
      <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ marginRight: 8 }}>검색</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="대화방 또는 친구 검색" style={{ flex: 1, fontSize: 14 }} placeholderTextColor="#8E8E93" />
      </View>
      {loading ? (
        <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color="#FF8C00" /><Text style={{ color: '#8E8E93', marginTop: 10 }}>대화방을 불러오는 중입니다.</Text></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />} contentContainerStyle={{ paddingBottom: 100 }}>
          {filteredRooms.length === 0 ? (
            <View style={{ padding: 24, backgroundColor: '#F2F2F7', borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#1C1C1E', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>대화방이 없습니다.</Text>
              <Text style={{ color: '#8E8E93', fontSize: 13, textAlign: 'center' }}>지도에서 주변 강아지에게 산책을 신청하면 대화방이 생성됩니다.</Text>
            </View>
          ) : filteredRooms.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.listItemRow}
              onPress={() => setSelectedRoom({ id: chat.id, name: chat.name })}
            >
              <View style={styles.listAvatarPlaceholder}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#FF8C00' }}>{chat.type === 'group' ? 'G' : chat.name.slice(0, 1)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.listItemTitle}>{chat.name}</Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93' }}>{chat.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <Text style={[styles.listItemSub, { flex: 1 }]} numberOfLines={1}>{chat.lastMessage}</Text>
                  {chat.unread > 0 && <View style={{ backgroundColor: '#FF8C00', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 8, paddingHorizontal: 4 }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{chat.unread}</Text></View>}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <MessageDetailModal
        visible={!!selectedRoom}
        roomId={selectedRoom?.id || null}
        roomName={selectedRoom?.name || ''}
        onClose={() => setSelectedRoom(null)}
      />
    </View>
  );
}

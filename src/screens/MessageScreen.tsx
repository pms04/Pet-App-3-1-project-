import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import { CHAT_ROOMS } from '../constants/mockData';

export function MessageScreen() {
  return (
    <View style={styles.appleContainer}>
      <Text style={[styles.appleSectionTitle, { marginTop: 20, marginBottom: 16 }]}>💬 메시지</Text>
      
      <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ marginRight: 8 }}>🔍</Text>
        <TextInput placeholder="대화방 또는 친구 검색" style={{ flex: 1, fontSize: 14 }} placeholderTextColor="#8E8E93" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {CHAT_ROOMS.map(chat => (
          <TouchableOpacity key={chat.id} style={styles.listItemRow}>
            <View style={styles.listAvatarPlaceholder}>
              <Text style={{ fontSize: 20 }}>{chat.type === 'group' ? '👥' : '🐶'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.listItemTitle}>{chat.name}</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93' }}>{chat.time}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <Text style={[styles.listItemSub, { flex: 1 }]} numberOfLines={1}>{chat.lastMessage}</Text>
                {chat.unread > 0 && (
                  <View style={{ backgroundColor: '#FF8C00', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 8, paddingHorizontal: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

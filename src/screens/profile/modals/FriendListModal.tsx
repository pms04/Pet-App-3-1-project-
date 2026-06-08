import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { styles } from '../../../styles/styles';
import { Friend } from '../../../hooks/useFriends';

interface Props {
  visible: boolean;
  onClose: () => void;
  friends: Friend[];
}

export function FriendListModal({ visible, onClose, friends }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>내 산책 친구</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 50, alignItems: 'flex-end' }}><Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>닫기</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {friends.length === 0 ? (
          <Text style={{ color: '#8E8E93', textAlign: 'center', marginTop: 30 }}>아직 등록된 산책 친구가 없습니다.</Text>
        ) : friends.map((friend) => (
          <View key={friend.id} style={styles.listItemRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.listAvatarPlaceholder}><Text style={{ fontSize: 15, fontWeight: '800', color: '#FF8C00' }}>{friend.name.slice(0, 1)}</Text></View>
              <View><Text style={styles.listItemTitle}>{friend.name}</Text><Text style={styles.listItemSub}>{friend.location || '지역 미입력'} · {friend.dog || '반려견 정보 없음'}</Text></View>
            </View>
            <TouchableOpacity style={styles.listActionButton} onPress={() => { onClose(); Alert.alert('알림', '메시지 탭에서 대화를 이어갈 수 있습니다.'); }}><Text style={styles.listActionButtonText}>대화</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
}

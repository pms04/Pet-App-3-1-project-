// 친구 목록 모달 (원본 동일)
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { styles } from '../../../styles/styles';
import { sampleFriends } from '../../../constants/sampleSocial';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FriendListModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>내 산책 친구</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 50, alignItems: 'flex-end' }}>
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>닫기</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {sampleFriends.map((friend) => (
          <View key={friend.id} style={styles.listItemRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.listAvatarPlaceholder}><Text style={{ fontSize: 16 }}>🧑‍💻</Text></View>
              <View>
                <Text style={styles.listItemTitle}>{friend.name}</Text>
                <Text style={styles.listItemSub}>{friend.location} · {friend.dog}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => { onClose(); Alert.alert('알림', '메시지 함으로 이동합니다.'); }}
            >
              <Text style={styles.listActionButtonText}>대화</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
}

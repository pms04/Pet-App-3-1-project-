// 모임 목록 모달 (원본 동일)
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { styles } from '../../../styles/styles';
import { sampleGroups } from '../../../constants/sampleSocial';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GroupListModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>내 소속 모임</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 50, alignItems: 'flex-end' }}>
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>닫기</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {sampleGroups.map((group) => (
          <View key={group.id} style={styles.listItemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle} numberOfLines={1}>{group.title}</Text>
              <Text style={styles.listItemSub}>{group.time} · 참여 {group.members}명</Text>
            </View>
            <TouchableOpacity
              style={[styles.listActionButton, { backgroundColor: '#FF8C00' }]}
              onPress={() => { onClose(); Alert.alert('참가', '해당 모임 소통방으로 진입합니다.'); }}
            >
              <Text style={[styles.listActionButtonText, { color: '#FFF' }]}>입장</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
}

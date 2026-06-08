import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { styles } from '../../../styles/styles';
import { LightningWalk } from '../../../hooks/useLightningWalks';

interface Props {
  visible: boolean;
  onClose: () => void;
  groups: LightningWalk[];
}

export function GroupListModal({ visible, onClose, groups }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>내 참여 모임</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 50, alignItems: 'flex-end' }}><Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>닫기</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {groups.length === 0 ? (
          <Text style={{ color: '#8E8E93', textAlign: 'center', marginTop: 30 }}>참여 중인 번개 산책이 없습니다.</Text>
        ) : groups.map((group) => (
          <View key={group.id} style={styles.listItemRow}>
            <View style={{ flex: 1 }}><Text style={styles.listItemTitle} numberOfLines={1}>{group.title}</Text><Text style={styles.listItemSub}>{group.startsAtLabel} · 참여 {group.currentParticipants}/{group.maxParticipants}명</Text></View>
            <TouchableOpacity style={[styles.listActionButton, { backgroundColor: '#FF8C00' }]} onPress={() => { onClose(); Alert.alert('참가', '번개 산책 탭에서 상세 내용을 확인해 주세요.'); }}><Text style={[styles.listActionButtonText, { color: '#FFF' }]}>확인</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Modal>
  );
}

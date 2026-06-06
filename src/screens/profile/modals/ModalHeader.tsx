// 모달 공용 헤더 (취소/제목/저장)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../../styles/styles';

interface Props {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}

export function ModalHeader({ title, onCancel, onSave, saveLabel = '저장' }: Props) {
  return (
    <View style={styles.modalHeaderContainer}>
      <TouchableOpacity onPress={onCancel}>
        <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>취소</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>{title}</Text>
      <TouchableOpacity onPress={onSave}>
        <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>{saveLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

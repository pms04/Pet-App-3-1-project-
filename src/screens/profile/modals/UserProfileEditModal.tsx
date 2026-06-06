// 사용자 프로필(반려인) 수정 모달
import React from 'react';
import { Modal, ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../../../styles/styles';
import { ModalHeader } from './ModalHeader';
import type { UserProfileEdit } from '../../../hooks/useUserProfile';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  edit: UserProfileEdit;
  patch: (p: Partial<UserProfileEdit>) => void;
}

const GENDERS = [{ key: 'M', label: '남성' }, { key: 'F', label: '여성' }] as const;

export function UserProfileEditModal({ visible, onClose, onSave, edit, patch }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalHeader title="반려인 프로필 수정" onCancel={onClose} onSave={onSave} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>이름 (닉네임)</Text>
          <TextInput
            style={styles.appleInput}
            placeholder="이름 또는 닉네임"
            placeholderTextColor="#AEAEB2"
            value={edit.name}
            onChangeText={(v) => patch({ name: v })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>성별</Text>
          <View style={styles.appleGenderSegmentRow}>
            {GENDERS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.appleSegmentButton, edit.gender === item.key && styles.appleSegmentButtonActive]}
                onPress={() => patch({ gender: item.key })}
                activeOpacity={0.9}
              >
                <Text style={[styles.appleSegmentButtonText, edit.gender === item.key && styles.appleSegmentButtonTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>출생연도</Text>
          <TextInput
            style={styles.appleInput}
            placeholder="예: 1995"
            placeholderTextColor="#AEAEB2"
            keyboardType="numeric"
            value={edit.birthYear}
            onChangeText={(v) => patch({ birthYear: v })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>거주지</Text>
          <TextInput
            style={styles.appleInput}
            placeholder="예: 김포시 구래동"
            placeholderTextColor="#AEAEB2"
            value={edit.location}
            onChangeText={(v) => patch({ location: v })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>한줄 소개</Text>
          <TextInput
            style={styles.appleInput}
            placeholder="반려견과 함께하는 나를 소개해주세요"
            placeholderTextColor="#AEAEB2"
            value={edit.bio}
            onChangeText={(v) => patch({ bio: v })}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

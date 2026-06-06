// 앨범 추가 모달
import React from 'react';
import { Modal, ScrollView, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../../styles/styles';
import { ModalHeader } from './ModalHeader';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  imageUri: string | null;
  onPickImage: () => void;
  memo: string;
  onMemoChange: (v: string) => void;
}

export function AlbumAddModal({
  visible, onClose, onSave, imageUri, onPickImage, memo, onMemoChange,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalHeader title="추억 사진첩 추가" onCancel={onClose} onSave={onSave} saveLabel="올리기" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>사진 등록 (내 핸드폰 갤러리)</Text>
          <TouchableOpacity style={styles.galleryPickerCardTrigger} onPress={onPickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.galleryPreviewImageReal} />
            ) : (
              <View style={styles.galleryPickerCenterContainer}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>🖼️</Text>
                <Text style={styles.galleryPickerTriggerText}>터치하여 휴대폰 갤러리에서 사진 가져오기</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>오늘의 기록 및 메모</Text>
          <TextInput
            style={[styles.appleInput, { height: 100, paddingTop: 12, paddingBottom: 12 }]}
            placeholder="오늘 반려견과 함께했던 소중한 일기나 메모를 적어주세요."
            placeholderTextColor="#AEAEB2"
            multiline
            value={memo}
            onChangeText={onMemoChange}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

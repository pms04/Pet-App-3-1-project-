// 앨범 상세(메모 수정) 모달
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../../styles/styles';
import type { AlbumItem } from '../../../hooks/useAlbums';

interface Props {
  item: AlbumItem | null;
  memo: string;
  onMemoChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AlbumDetailModal({ item, memo, onMemoChange, onClose, onSave }: Props) {
  return (
    <Modal visible={item !== null} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.albumDetailOverlayContainer}>
        <View style={styles.albumDetailCentralCard}>
          <View style={styles.detailCardPolaroidTopFrame}>
            {item && <Image source={{ uri: item.url }} style={styles.albumDetailImageReal} resizeMode="cover" />}
          </View>
          <View style={styles.detailCardTextContainer}>
            <Text style={styles.detailCardDateHeader}>📅 산책 기록일: {item?.date}</Text>
            <Text style={styles.appleLabel}>추억 메모장</Text>
            <TextInput
              style={styles.albumDetailEditableMemoInput}
              multiline
              numberOfLines={3}
              value={memo}
              onChangeText={onMemoChange}
              placeholder="여기에 소중한 일기 메모를 보충 기입해 보세요..."
              placeholderTextColor="#AEAEB2"
            />
            <View style={styles.detailActionButtonsRow}>
              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#E5E5EA' }]}
                onPress={onClose}
              >
                <Text style={{ color: '#000', fontWeight: '600', fontSize: 14 }}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.detailActionBtn, { backgroundColor: '#FF8C00' }]}
                onPress={onSave}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>메모 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

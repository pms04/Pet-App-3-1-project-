// 앨범 그리드 + 선택모드 — ProfileScreen 발췌
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../styles/styles';
import type { AlbumItem } from '../../hooks/useAlbums';

interface Props {
  albums: AlbumItem[];
  isSelectMode: boolean;
  selectedPhotos: string[];
  onAdd: () => void;
  onCancelSelect: () => void;
  onPress: (item: AlbumItem) => void;
  onLongPress: (item: AlbumItem) => void;
  onDeleteSelected: () => void;
}

function AlbumGridInner({
  albums, isSelectMode, selectedPhotos,
  onAdd, onCancelSelect, onPress, onLongPress, onDeleteSelected,
}: Props) {
  return (
    <View style={styles.appleCardSection}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={[styles.appleSectionTitle, { marginBottom: 2 }]}>앨범</Text>
          {isSelectMode && (
            <Text style={{ fontSize: 12, color: '#FF3B30', fontWeight: '600' }}>선택 삭제 모드 가동 중</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isSelectMode ? (
            <TouchableOpacity
              style={[styles.jobsAddInlineButton, { marginRight: 8, backgroundColor: '#FFE5E5' }]}
              onPress={onCancelSelect}
            >
              <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '700' }}>취소</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.jobsAddInlineButton, { marginRight: 8 }]} onPress={onAdd}>
              <Text style={styles.jobsAddInlineButtonText}>+ 추가</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.galleryGridContainer}>
        {albums.map((item) => {
          const isTargetSelected = selectedPhotos.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.polaroidFrameSquare, isTargetSelected && styles.polaroidFrameSquareSelected]}
              activeOpacity={0.9}
              onPress={() => onPress(item)}
              onLongPress={() => onLongPress(item)}
            >
              <View style={styles.polaroidImageWrapper}>
                <Image source={{ uri: item.url }} style={styles.galleryImage} />
                {isSelectMode && (
                  <View style={[styles.photoCheckboxCircle, isTargetSelected && styles.photoCheckboxCircleChecked]}>
                    {isTargetSelected && <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900' }}>✓</Text>}
                  </View>
                )}
              </View>
              <View style={styles.polaroidBottomArea}>
                <Text style={styles.polaroidMemoSnippet} numberOfLines={1}>{item.memo}</Text>
                <Text style={styles.polaroidDateText}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isSelectMode && (
        <TouchableOpacity style={styles.deleteActionBarButton} onPress={onDeleteSelected}>
          <Text style={styles.deleteActionBarButtonText}>
            선택한 사진 삭제 ({selectedPhotos.length}장)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export const AlbumGrid = React.memo(AlbumGridInner);

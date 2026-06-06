// 앨범 로컬 상태(CRUD + 선택모드 + 상세) 캡슐화 — 원본 동작 동일
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_ALBUMS } from '../constants/sampleSocial';

export interface AlbumItem {
  id: string;
  url: string;
  memo: string;
  date: string;
}

export function useAlbums() {
  const [albums, setAlbums] = useState<AlbumItem[]>(DEFAULT_ALBUMS);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedAlbumItem, setSelectedAlbumItem] = useState<AlbumItem | null>(null);

  const addItem = useCallback((uri: string, memo: string) => {
    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    const newItem: AlbumItem = {
      id: Date.now().toString(),
      url: uri,
      memo: memo || '오늘의 소중한 산책 기록 🐾',
      date: dateString,
    };
    setAlbums((prev) => [newItem, ...prev]);
    Alert.alert('완료', '디바이스 갤러리의 사진이 내 앨범에 성공적으로 추가되었습니다.');
  }, []);

  const togglePhoto = useCallback((id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const startSelectModeWith = useCallback((id: string) => {
    setIsSelectMode(true);
    setSelectedPhotos([id]);
  }, []);

  const cancelSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedPhotos([]);
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedPhotos.length === 0) {
      Alert.alert('알림', '삭제할 사진이 선택되지 않았습니다.');
      return;
    }
    Alert.alert(
      '사진 삭제 확인',
      `선택한 ${selectedPhotos.length}장의 사진을 앨범에서 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setAlbums((prev) => prev.filter((item) => !selectedPhotos.includes(item.id)));
            setSelectedPhotos([]);
            setIsSelectMode(false);
            Alert.alert('삭제 완료', '선택한 항목이 안전하게 정리되었습니다.');
          },
        },
      ]
    );
  }, [selectedPhotos]);

  const updateMemo = useCallback((id: string, memo: string) => {
    setAlbums((prev) => prev.map((item) => (item.id === id ? { ...item, memo } : item)));
    setSelectedAlbumItem(null);
    Alert.alert('알림', '메모 내용이 안전하게 수정 및 저장되었습니다.');
  }, []);

  return {
    albums,
    isSelectMode,
    selectedPhotos,
    selectedAlbumItem,
    setSelectedAlbumItem,
    addItem,
    togglePhoto,
    startSelectModeWith,
    cancelSelectMode,
    deleteSelected,
    updateMemo,
  };
}

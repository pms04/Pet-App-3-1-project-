import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export interface AlbumItem {
  id: string;
  url: string;
  memo: string;
  date: string;
}

export function useAlbums() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedAlbumItem, setSelectedAlbumItem] = useState<AlbumItem | null>(null);

  const fetchAlbums = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      const formatted: AlbumItem[] = data.map(item => ({
        id: item.id,
        url: item.image_url,
        memo: item.memo || '',
        date: new Date(item.created_at).toLocaleDateString(),
      }));
      setAlbums(formatted);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const addItem = useCallback(async (uri: string, memo: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('albums')
      .insert({
        user_id: user.id,
        image_url: uri,
        memo: memo,
      })
      .select()
      .single();

    if (error) {
      Alert.alert('오류', '앨범 저장에 실패했습니다.');
    } else if (data) {
      const newItem: AlbumItem = {
        id: data.id,
        url: data.image_url,
        memo: data.memo || '',
        date: new Date(data.created_at).toLocaleDateString(),
      };
      setAlbums((prev) => [newItem, ...prev]);
      Alert.alert('완료', '사진이 내 앨범에 성공적으로 추가되었습니다.');
    }
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
          onPress: async () => {
            const { error } = await supabase
              .from('albums')
              .delete()
              .in('id', selectedPhotos);

            if (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            } else {
              setAlbums((prev) => prev.filter((item) => !selectedPhotos.includes(item.id)));
              setSelectedPhotos([]);
              setIsSelectMode(false);
              Alert.alert('삭제 완료', '선택한 항목이 정리되었습니다.');
            }
          },
        },
      ]
    );
  }, [selectedPhotos]);

  const updateMemo = useCallback(async (id: string, memo: string) => {
    const { error } = await supabase
      .from('albums')
      .update({ memo })
      .eq('id', id);

    if (error) {
      Alert.alert('오류', '메모 수정에 실패했습니다.');
    } else {
      setAlbums((prev) => prev.map((item) => (item.id === id ? { ...item, memo } : item)));
      setSelectedAlbumItem(null);
      Alert.alert('알림', '메모 내용이 저장되었습니다.');
    }
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
    refresh: fetchAlbums,
  };
}

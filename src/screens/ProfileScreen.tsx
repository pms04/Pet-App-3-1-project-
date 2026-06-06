// ProfileScreen — 조립 전용 (각 영역은 sub-component / hook 으로 분리)
// 동작/UI/Supabase 호출/네비게이션은 원본과 100% 동일합니다.
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { styles } from '../styles/styles';

import { useImagePicker } from '../hooks/useImagePicker';
import { useDogs, type DogRecord } from '../hooks/useDogs';
import { useUserProfile, type UserProfileEdit } from '../hooks/useUserProfile';
import { useAlbums, type AlbumItem } from '../hooks/useAlbums';
import { useDogForm } from '../hooks/useDogForm';

import { UserProfileHeader } from './profile/UserProfileHeader';
import { DogList } from './profile/DogList';
import { AlbumGrid } from './profile/AlbumGrid';

import { FriendListModal } from './profile/modals/FriendListModal';
import { GroupListModal } from './profile/modals/GroupListModal';
import { DogRegisterModal } from './profile/modals/DogRegisterModal';
import { DogEditModal } from './profile/modals/DogEditModal';
import { UserProfileEditModal } from './profile/modals/UserProfileEditModal';
import { AlbumAddModal } from './profile/modals/AlbumAddModal';
import { AlbumDetailModal } from './profile/modals/AlbumDetailModal';

export function ProfileScreen() {
  const { pick } = useImagePicker();

  const { dogs, fetching, insertDog, updateDog } = useDogs();
  const { nickname, genderForAvatar, loadEditDefaults, updateProfile } = useUserProfile();
  const albumsCtx = useAlbums();

  // 사용자 아바타 (원본도 클라이언트 메모리 상태)
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // 모달 표시 플래그
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditDogModalOpen, setIsEditDogModalOpen] = useState(false);
  const [isEditUserProfileOpen, setIsEditUserProfileOpen] = useState(false);
  const [isAddAlbumModalOpen, setIsAddAlbumModalOpen] = useState(false);

  // 반려견 폼 (등록/수정 별도 인스턴스)
  const registerForm = useDogForm();
  const editForm = useDogForm();
  const [editingDogId, setEditingDogId] = useState<string | null>(null);

  // 사용자 프로필 수정 폼
  const [userEdit, setUserEdit] = useState<UserProfileEdit>({
    name: '', gender: 'M', birthYear: '', location: '', bio: '',
  });
  const patchUserEdit = useCallback(
    (p: Partial<UserProfileEdit>) => setUserEdit((prev) => ({ ...prev, ...p })),
    []
  );

  // 앨범 추가용 임시 입력
  const [selectedLocalImageUri, setSelectedLocalImageUri] = useState<string | null>(null);
  const [newPhotoMemo, setNewPhotoMemo] = useState('');

  // 앨범 상세 메모 텍스트
  const [detailMemoText, setDetailMemoText] = useState('');

  // ── 이미지 픽 — 원본 pickImageFor 동작 동일
  const pickImageFor = useCallback(async (target: 'user' | 'dog' | 'album' | 'editdog') => {
    const uri = await pick();
    if (!uri) return;
    if (target === 'user') {
      setUserAvatar(uri);
      Alert.alert('성공', '사용자 프로필 사진이 갤러리 이미지로 변경되었습니다.');
    } else if (target === 'dog') {
      registerForm.patch({ avatarUri: uri });
      Alert.alert('성공', '반려견 이미지 가용 인덱스 바인딩이 완료되었습니다.');
    } else if (target === 'album') {
      setSelectedLocalImageUri(uri);
    } else if (target === 'editdog') {
      editForm.patch({ avatarUri: uri });
      Alert.alert('성공', '반려견 이미지가 변경되었습니다.');
    }
  }, [pick, registerForm, editForm]);

  // ── 반려견 등록
  const handleRegisterDog = useCallback(async () => {
    const ok = await insertDog({
      name: registerForm.form.name,
      weight: registerForm.form.weight,
      birthDate: registerForm.form.birthDate,
      gender: registerForm.form.gender,
      breed: registerForm.form.selectedBreed,
      tendency: registerForm.form.tendency,
      avatarUri: registerForm.form.avatarUri,
    });
    if (ok) {
      // 원본과 동일: gender 는 유지, 나머지 입력값 초기화
      registerForm.patch({
        name: '', weight: '', birthDate: '', tendency: '',
        selectedBreed: '', breedSearch: '', avatarUri: null,
      });
      setIsRegisterModalOpen(false);
    }
  }, [insertDog, registerForm]);

  // ── 반려견 수정 모달 열기
  const openEditDogModal = useCallback((dog: DogRecord) => {
    setEditingDogId(dog.id);
    editForm.hydrateFromDog(dog);
    setIsEditDogModalOpen(true);
  }, [editForm]);

  const handleUpdateDog = useCallback(async () => {
    if (!editingDogId) return;
    const ok = await updateDog(editingDogId, {
      name: editForm.form.name,
      weight: editForm.form.weight,
      birthDate: editForm.form.birthDate,
      gender: editForm.form.gender,
      breed: editForm.form.selectedBreed,
      tendency: editForm.form.tendency,
      avatarUri: editForm.form.avatarUri,
    });
    if (ok) {
      setIsEditDogModalOpen(false);
      setEditingDogId(null);
    }
  }, [editingDogId, updateDog, editForm]);

  // ── 사용자 프로필 수정 열기/저장
  const openEditUserProfile = useCallback(async () => {
    const defaults = await loadEditDefaults();
    setUserEdit(defaults);
    setIsEditUserProfileOpen(true);
  }, [loadEditDefaults]);

  const handleUpdateUserProfile = useCallback(async () => {
    const ok = await updateProfile(userEdit);
    if (ok) setIsEditUserProfileOpen(false);
  }, [updateProfile, userEdit]);

  // ── 앨범 추가
  const handleAddAlbumItem = useCallback(() => {
    if (!selectedLocalImageUri) { Alert.alert('오류', '갤러리에서 사진을 선택해 주세요.'); return; }
    albumsCtx.addItem(selectedLocalImageUri, newPhotoMemo);
    setSelectedLocalImageUri(null);
    setNewPhotoMemo('');
    setIsAddAlbumModalOpen(false);
  }, [selectedLocalImageUri, newPhotoMemo, albumsCtx]);

  // ── 앨범 클릭/롱프레스
  const handlePhotoPress = useCallback((item: AlbumItem) => {
    if (albumsCtx.isSelectMode) {
      albumsCtx.togglePhoto(item.id);
    } else {
      albumsCtx.setSelectedAlbumItem(item);
      setDetailMemoText(item.memo);
    }
  }, [albumsCtx]);

  const handlePhotoLongPress = useCallback((item: AlbumItem) => {
    if (!albumsCtx.isSelectMode) albumsCtx.startSelectModeWith(item.id);
  }, [albumsCtx]);

  const handleUpdateMemo = useCallback(() => {
    if (!albumsCtx.selectedAlbumItem) return;
    albumsCtx.updateMemo(albumsCtx.selectedAlbumItem.id, detailMemoText);
  }, [albumsCtx, detailMemoText]);

  return (
    <ScrollView
      style={styles.appleContainer}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <UserProfileHeader
        userAvatar={userAvatar}
        userGenderForAvatar={genderForAvatar}
        userNickname={nickname}
        albumsCount={albumsCtx.albums.length}
        onPickAvatar={() => pickImageFor('user')}
        onOpenFriendModal={() => setIsFriendModalOpen(true)}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
        onOpenEditProfile={openEditUserProfile}
      />

      <DogList
        dogs={dogs}
        fetching={fetching}
        onAdd={() => setIsRegisterModalOpen(true)}
        onEdit={openEditDogModal}
      />

      <AlbumGrid
        albums={albumsCtx.albums}
        isSelectMode={albumsCtx.isSelectMode}
        selectedPhotos={albumsCtx.selectedPhotos}
        onAdd={() => setIsAddAlbumModalOpen(true)}
        onCancelSelect={albumsCtx.cancelSelectMode}
        onPress={handlePhotoPress}
        onLongPress={handlePhotoLongPress}
        onDeleteSelected={albumsCtx.deleteSelected}
      />

      <FriendListModal visible={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} />
      <GroupListModal visible={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />

      <AlbumAddModal
        visible={isAddAlbumModalOpen}
        onClose={() => { setIsAddAlbumModalOpen(false); setSelectedLocalImageUri(null); }}
        onSave={handleAddAlbumItem}
        imageUri={selectedLocalImageUri}
        onPickImage={() => pickImageFor('album')}
        memo={newPhotoMemo}
        onMemoChange={setNewPhotoMemo}
      />

      <AlbumDetailModal
        item={albumsCtx.selectedAlbumItem}
        memo={detailMemoText}
        onMemoChange={setDetailMemoText}
        onClose={() => albumsCtx.setSelectedAlbumItem(null)}
        onSave={handleUpdateMemo}
      />

      <DogRegisterModal
        visible={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSave={handleRegisterDog}
        form={registerForm.form}
        patch={registerForm.patch}
        onPickAvatar={() => pickImageFor('dog')}
      />

      <DogEditModal
        visible={isEditDogModalOpen}
        onClose={() => setIsEditDogModalOpen(false)}
        onSave={handleUpdateDog}
        form={editForm.form}
        patch={editForm.patch}
        onPickAvatar={() => pickImageFor('editdog')}
      />

      <UserProfileEditModal
        visible={isEditUserProfileOpen}
        onClose={() => setIsEditUserProfileOpen(false)}
        onSave={handleUpdateUserProfile}
        edit={userEdit}
        patch={patchUserEdit}
      />
    </ScrollView>
  );
}

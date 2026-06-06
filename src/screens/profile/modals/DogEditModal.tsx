// 반려견 수정 모달
import React from 'react';
import { Modal } from 'react-native';
import { ModalHeader } from './ModalHeader';
import { DogFormFields } from './DogFormFields';
import type { DogFormState } from '../../../hooks/useDogForm';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  form: DogFormState;
  patch: (p: Partial<DogFormState>) => void;
  onPickAvatar: () => void;
}

export function DogEditModal({ visible, onClose, onSave, form, patch, onPickAvatar }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <>
        <ModalHeader title="반려견 프로필 수정" onCancel={onClose} onSave={onSave} />
        <DogFormFields
          form={form}
          patch={patch}
          onPickAvatar={onPickAvatar}
          fallbackAvatar="default"
          avatarHint="반려견 사진 변경"
          breedPlaceholder="품종 키워드 검색..."
        />
      </>
    </Modal>
  );
}

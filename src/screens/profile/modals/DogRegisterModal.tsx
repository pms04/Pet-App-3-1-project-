// 반려견 신규 등록 모달
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

export function DogRegisterModal({ visible, onClose, onSave, form, patch, onPickAvatar }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <>
        <ModalHeader title="새로운 반려견 등록" onCancel={onClose} onSave={onSave} />
        <DogFormFields
          form={form}
          patch={patch}
          onPickAvatar={onPickAvatar}
          fallbackAvatar="emoji"
          avatarHint="반려견 시각 데이터 등록"
          breedPlaceholder="수기로 품종 키워드 검색..."
        />
      </>
    </Modal>
  );
}

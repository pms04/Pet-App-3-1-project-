// 반려견 등록/수정 모달 공용 폼 본문 (중복 JSX 제거)
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { styles } from '../../../styles/styles';
import { DefaultDogAvatar } from '../../../components/DefaultDogAvatar';
import { BreedSearchInline } from './BreedSearchInline';
import type { DogFormState, DogGender } from '../../../hooks/useDogForm';

interface Props {
  form: DogFormState;
  patch: (p: Partial<DogFormState>) => void;
  onPickAvatar: () => void;
  /** 미선택 시 fallback 아이콘. 등록은 🐶 이모지, 수정은 DefaultDogAvatar */
  fallbackAvatar?: 'emoji' | 'default';
  avatarHint: string;
  breedPlaceholder: string;
}

const GENDER_OPTIONS = [
  { key: 'M', label: '남아' },
  { key: 'F', label: '여아' },
  { key: 'MN', label: '중성화 남아' },
  { key: 'FN', label: '중성화 여아' },
] as const;

export function DogFormFields({
  form, patch, onPickAvatar,
  fallbackAvatar = 'default', avatarHint, breedPlaceholder,
}: Props) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity style={styles.dogAvatarUploadTrigger} onPress={onPickAvatar} activeOpacity={0.8}>
          {form.avatarUri ? (
            <Image source={{ uri: form.avatarUri }} style={{ width: 70, height: 70, borderRadius: 35 }} />
          ) : fallbackAvatar === 'emoji' ? (
            <Text style={{ fontSize: 24 }}>🐶</Text>
          ) : (
            <DefaultDogAvatar size={70} />
          )}
          <View style={styles.avatarEditBadgeSmallAbsolute}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>+</Text>
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 6, fontWeight: '500' }}>{avatarHint}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>이름</Text>
        <TextInput
          style={styles.appleInput}
          placeholder="강아지 이름 입력"
          placeholderTextColor="#AEAEB2"
          value={form.name}
          onChangeText={(v) => patch({ name: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>견종 검색 선택</Text>
        <BreedSearchInline
          selectedBreed={form.selectedBreed}
          onSelect={(b) => patch({ selectedBreed: b, showBreedSearch: false })}
          isOpen={form.showBreedSearch}
          onToggle={() => patch({ showBreedSearch: !form.showBreedSearch })}
          searchValue={form.breedSearch}
          onSearchChange={(v) => patch({ breedSearch: v })}
          placeholder={breedPlaceholder}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>몸무게 (kg)</Text>
        <TextInput
          style={styles.appleInput}
          placeholder="예: 5.4"
          placeholderTextColor="#AEAEB2"
          keyboardType="numeric"
          value={form.weight}
          onChangeText={(v) => patch({ weight: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>생년월일</Text>
        <TextInput
          style={styles.appleInput}
          placeholder="YYYY-MM-DD 형식 (예: 2023-04-12)"
          placeholderTextColor="#AEAEB2"
          value={form.birthDate}
          onChangeText={(v) => patch({ birthDate: v })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>성별 및 중성화</Text>
        <View style={styles.appleGenderSegmentRow}>
          {GENDER_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.appleSegmentButton, form.gender === item.key && styles.appleSegmentButtonActive]}
              onPress={() => patch({ gender: item.key as DogGender })}
              activeOpacity={0.9}
            >
              <Text style={[styles.appleSegmentButtonText, form.gender === item.key && styles.appleSegmentButtonTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.appleLabel}>특성 및 성향</Text>
        <TextInput
          style={styles.appleInput}
          placeholder="관찰된 사회성 및 특징 기록"
          placeholderTextColor="#AEAEB2"
          value={form.tendency}
          onChangeText={(v) => patch({ tendency: v })}
        />
      </View>
    </ScrollView>
  );
}

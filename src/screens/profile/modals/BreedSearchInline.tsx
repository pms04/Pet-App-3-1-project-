// 등록/수정 모달 양쪽에서 사용되던 견종 검색 박스 (중복 제거)
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { styles } from '../../../styles/styles';
import { AKC_BREEDS } from '../../../constants/breeds';

interface Props {
  selectedBreed: string;
  onSelect: (breed: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
}

export function BreedSearchInline({
  selectedBreed,
  onSelect,
  isOpen,
  onToggle,
  searchValue,
  onSearchChange,
  placeholder = '품종 키워드 검색...',
}: Props) {
  const filtered = AKC_BREEDS.filter((b) =>
    b.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.appleSelector, selectedBreed !== '' && { borderColor: '#1C1C1E', borderWidth: 1 }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.appleSelectorText, selectedBreed === '' && { color: '#AEAEB2' }]}>
          {selectedBreed !== '' ? selectedBreed : placeholder}
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 12 }}>▼</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.addressSearchBoxContainer}>
          <TextInput
            style={styles.addressSearchInputInside}
            placeholder="검색어 입력 (예: 푸들, 말티, 포메)"
            placeholderTextColor="#8E8E93"
            value={searchValue}
            onChangeText={onSearchChange}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
            {filtered.length === 0 ? (
              <Text style={styles.addressSearchNoResult}>매칭되는 AKC 표준 품종이 없습니다.</Text>
            ) : (
              filtered.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={styles.addressSearchItemRow}
                  onPress={() => onSelect(b)}
                >
                  <Text style={styles.addressSearchItemText}>🔍 {b}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </>
  );
}

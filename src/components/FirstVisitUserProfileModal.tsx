import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../../supabase';
import { styles } from '../styles/styles';

// 최초 방문 시 사용자 프로필 입력 모달 (요구사항 2)
export function FirstVisitUserProfileModal({ visible, onComplete }: { visible: boolean; onComplete: () => void }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthYear, setBirthYear] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !birthYear || !location) {
      Alert.alert('오류', '이름, 출생연도, 거주지를 입력해주세요.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          user_real_name: name,
          user_gender: gender,
          user_birth_year: birthYear,
          user_location: location,
          user_bio: bio,
          profile_completed: true,
        }
      });
      if (error) {
        Alert.alert('오류', error.message);
      } else {
        onComplete();
      }
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>반려인 정보 등록</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={{ fontSize: 14, color: '#8E8E93', marginBottom: 20, lineHeight: 20 }}>
          WalkFix에 오신 것을 환영합니다! 🐾{'\n'}반려인 정보를 입력하면 더 정확한 매칭이 가능합니다.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>이름 (닉네임)</Text>
          <TextInput style={styles.appleInput} placeholder="이름 또는 닉네임" placeholderTextColor="#AEAEB2" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>성별</Text>
          <View style={styles.appleGenderSegmentRow}>
            {([{ key: 'M', label: '남성' }, { key: 'F', label: '여성' }] as const).map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.appleSegmentButton, gender === item.key && styles.appleSegmentButtonActive]}
                onPress={() => setGender(item.key)}
                activeOpacity={0.9}
              >
                <Text style={[styles.appleSegmentButtonText, gender === item.key && styles.appleSegmentButtonTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>출생연도</Text>
          <TextInput style={styles.appleInput} placeholder="예: 1995" placeholderTextColor="#AEAEB2" keyboardType="numeric" value={birthYear} onChangeText={setBirthYear} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>거주지</Text>
          <TextInput style={styles.appleInput} placeholder="예: 김포시 구래동" placeholderTextColor="#AEAEB2" value={location} onChangeText={setLocation} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.appleLabel}>한줄 소개 (선택)</Text>
          <TextInput style={styles.appleInput} placeholder="반려견과 함께하는 나를 소개해주세요" placeholderTextColor="#AEAEB2" value={bio} onChangeText={setBio} />
        </View>

        <TouchableOpacity style={styles.authButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.authButtonText}>{loading ? '저장 중...' : '시작하기'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

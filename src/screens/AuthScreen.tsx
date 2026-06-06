import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../supabase';
import { styles } from '../styles/styles';

// ==========================================
// AuthScreen (로그인 / 회원가입)
// ==========================================
export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (isSignUp && !nickname) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname: nickname } },
      });

      if (authError) {
        Alert.alert('회원가입 실패', authError.message);
        setLoading(false);
        return;
      }
      if (authData?.user) {
        Alert.alert('성공', '회원가입이 완료되었습니다! 자동 로그인됩니다.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('로그인 실패', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.authTitle}>WalkFix 🐾</Text>
      <Text style={styles.authSubTitle}>{isSignUp ? '새로운 산책 크루 조인하기' : '반려견 실시간 매칭 시작하기'}</Text>

      <TextInput
        style={styles.authInput}
        placeholder="이메일 주소"
        placeholderTextColor="#8E8E93"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.authInput}
        placeholder="비밀번호 (6자 이상)"
        placeholderTextColor="#8E8E93"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {isSignUp && (
        <TextInput
          style={styles.authInput}
          placeholder="앱에서 사용할 닉네임"
          placeholderTextColor="#8E8E93"
          value={nickname}
          onChangeText={setNickname}
        />
      )}

      <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
        <Text style={styles.authButtonText}>{loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ marginTop: 20 }}>
        <Text style={{ color: '#FF8C00', fontSize: 14, fontWeight: '600' }}>
          {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

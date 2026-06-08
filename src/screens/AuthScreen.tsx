import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../../supabase';
import { styles } from '../styles/styles';

// ──────────────────────────────────────────────────────────────
// AuthScreen — 스티브 잡스 미니멀 디자인 + 소셜 로그인 UI
// ──────────────────────────────────────────────────────────────
export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('입력 확인', '이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    if (isSignUp && !nickname.trim()) {
      Alert.alert('입력 확인', '닉네임을 입력해 주세요.');
      return;
    }
    setLoading(true);
    if (isSignUp) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nickname: nickname.trim() } },
      });
      if (authError) {
        Alert.alert('회원가입 실패', authError.message);
      } else if (authData?.user) {
        Alert.alert('환영합니다!', '회원가입이 완료되었습니다. 자동으로 로그인됩니다.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) Alert.alert('로그인 실패', error.message);
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider: 'kakao' | 'google') => {
    // Expo/React Native 환경에서는 Supabase OAuth + WebBrowser 플로우 필요
    // 실제 연동 시 expo-auth-session 또는 expo-web-browser 사용
    Alert.alert(
      provider === 'kakao' ? '카카오 로그인' : 'Google 로그인',
      `${provider === 'kakao' ? '카카오' : 'Google'} 계정으로 로그인하려면 Supabase 대시보드에서 해당 OAuth Provider를 활성화한 뒤 앱을 재빌드해 주세요.\n\n(현재 개발 환경에서는 이메일 로그인을 이용해 주세요.)`,
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.authContainer, { paddingTop: 80, paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 앱 로고 */}
        <View style={styles.authLogoWrapper}>
          <Text style={styles.authLogoText}>🐾</Text>
        </View>
        <Text style={styles.authTitle}>WalkFix</Text>
        <Text style={styles.authSubTitle}>
          {isSignUp ? '반려견과 함께하는 새로운 산책 시작하기' : '반려견 실시간 매칭 & 산책 커뮤니티'}
        </Text>

        {/* 소셜 로그인 */}
        <TouchableOpacity
          style={[styles.authSocialButton, styles.authKakaoButton]}
          onPress={() => handleSocialLogin('kakao')}
          activeOpacity={0.8}
        >
          <Text style={styles.authSocialIcon}>💬</Text>
          <Text style={[styles.authSocialText, { color: '#3C1E1E' }]}>카카오로 계속하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authSocialButton, styles.authGoogleButton]}
          onPress={() => handleSocialLogin('google')}
          activeOpacity={0.8}
        >
          <Text style={styles.authSocialIcon}>🔵</Text>
          <Text style={styles.authSocialText}>Google로 계속하기</Text>
        </TouchableOpacity>

        {/* 구분선 */}
        <View style={styles.authDividerRow}>
          <View style={styles.authDividerLine} />
          <Text style={styles.authDividerText}>또는 이메일로</Text>
          <View style={styles.authDividerLine} />
        </View>

        {/* 이메일 입력 */}
        <TextInput
          style={styles.authInput}
          placeholder="이메일 주소"
          placeholderTextColor="#8E8E93"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
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
            placeholder="닉네임"
            placeholderTextColor="#8E8E93"
            value={nickname}
            onChangeText={setNickname}
          />
        )}

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.authButtonText}>
            {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} activeOpacity={0.7}>
          <Text style={styles.authToggleText}>
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

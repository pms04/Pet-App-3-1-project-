import React from 'react';
import { View, Text } from 'react-native';

// 기본 프로필 SVG 대신 이모지 기반 기본 이미지 컴포넌트
export function DefaultUserAvatar({ gender, size = 84 }: { gender?: string; size?: number }) {
  const icon = gender === 'F' ? '👩' : '👨';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
    </View>
  );
}

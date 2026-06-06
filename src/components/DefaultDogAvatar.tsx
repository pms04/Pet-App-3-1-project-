import React from 'react';
import { View, Text } from 'react-native';

export function DefaultDogAvatar({ size = 48 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>🐶</Text>
    </View>
  );
}

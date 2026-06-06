// 공용 디자인 토큰 (색상/그림자/spacing)
// 값은 원본 styles.ts에서 추출했으며 동일한 hex/숫자를 유지합니다.
import { Platform } from 'react-native';

export const colors = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSub: '#636366',
  textMuted: '#8E8E93',
  textPlaceholder: '#AEAEB2',
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  primary: '#007AFF',
  brand: '#FF8C00',
  danger: '#FF3B30',
  dangerSoft: '#FFE5E5',
  black: '#000000',
  white: '#FFFFFF',
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
};

export const isIOS = Platform.OS === 'ios';

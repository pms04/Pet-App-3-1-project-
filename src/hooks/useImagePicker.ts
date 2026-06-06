// 갤러리 권한+이미지 선택 공통 훅 (원본 pickImageFromGallery 동작 동일)
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function useImagePicker() {
  const pick = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 업로드하려면 갤러리 접근 권한이 필요합니다.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    return null;
  };

  return { pick };
}

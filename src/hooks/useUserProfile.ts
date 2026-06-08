import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export interface UserProfileEdit {
  name: string;
  gender: 'M' | 'F';
  birthYear: string;
  location: string;
  bio: string;
  profileImageUrl?: string;
}

export function useUserProfile() {
  const [nickname, setNickname] = useState('WalkFix 크루');
  const [genderForAvatar, setGenderForAvatar] = useState<string>('M');

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (user.user_metadata?.nickname) setNickname(user.user_metadata.nickname);
      if (user.user_metadata?.user_gender) setGenderForAvatar(user.user_metadata.user_gender);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loadEditDefaults = useCallback(async (): Promise<UserProfileEdit> => {
    const { data: { user } } = await supabase.auth.getUser();
    const md = user?.user_metadata ?? {};
    return {
      name: userData?.nickname || md.user_real_name || md.nickname || '',
      gender: (md.user_gender as 'M' | 'F') || 'M',
      birthYear: md.user_birth_year || '',
      location: md.user_location || '',
      bio: md.user_bio || '',
    };
  }, []);

  const updateProfile = useCallback(async (edit: UserProfileEdit): Promise<boolean> => {
    if (!edit.name || !edit.birthYear || !edit.location) {
      Alert.alert('오류', '이름, 출생연도, 거주지를 입력해주세요.');
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        user_real_name: edit.name,
        user_gender: edit.gender,
        user_birth_year: edit.birthYear,
        user_location: edit.location,
        user_bio: edit.bio,
        profile_completed: true,
      },
    });
    if (error) { Alert.alert('수정 실패', error.message); return false; }
    setGenderForAvatar(edit.gender);
    Alert.alert('수정 완료', '프로필이 업데이트되었습니다.');
    await refresh();
    return true;
  }, [profileImageUrl, refresh]);

  return { nickname, genderForAvatar, refresh, loadEditDefaults, updateProfile };
}

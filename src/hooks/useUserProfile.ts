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
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const md = user.user_metadata ?? {};
    setNickname(md.nickname || md.user_real_name || 'WalkFix 크루');
    setGenderForAvatar(md.user_gender || 'M');
    setLocation(md.user_location || '');
    setBio(md.user_bio || '');

    const { data } = await supabase
      .from('users')
      .select('profile_image_url,nickname,bio,location')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      if (data.profile_image_url) setProfileImageUrl(data.profile_image_url);
      if (data.nickname) setNickname(data.nickname);
      if (data.bio) setBio(data.bio);
      if (data.location) setLocation(data.location);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loadEditDefaults = useCallback(async (): Promise<UserProfileEdit> => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .maybeSingle();
    const md = user?.user_metadata ?? {};
    return {
      name: userData?.nickname || md.user_real_name || md.nickname || '',
      gender: (md.user_gender as 'M' | 'F') || 'M',
      birthYear: md.user_birth_year || '',
      location: userData?.location || md.user_location || '',
      bio: userData?.bio || md.user_bio || '',
      profileImageUrl: userData?.profile_image_url || null,
    };
  }, []);

  const updateProfile = useCallback(async (edit: UserProfileEdit): Promise<boolean> => {
    if (!edit.name || !edit.birthYear || !edit.location) {
      Alert.alert('오류', '이름, 출생연도, 거주지를 입력해주세요.');
      return false;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error: authError } = await supabase.auth.updateUser({
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
    if (authError) { Alert.alert('수정 실패(Auth)', authError.message); return false; }

    const { error: dbError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      nickname: edit.name,
      bio: edit.bio,
      location: edit.location,
      profile_image_url: edit.profileImageUrl || profileImageUrl,
      updated_at: new Date().toISOString(),
    });
    if (dbError) { Alert.alert('수정 실패(DB)', dbError.message); return false; }

    setNickname(edit.name);
    setGenderForAvatar(edit.gender);
    setLocation(edit.location);
    setBio(edit.bio);
    setProfileImageUrl(edit.profileImageUrl || profileImageUrl);
    Alert.alert('수정 완료', '프로필이 업데이트되었습니다.');
    await refresh();
    return true;
  }, [profileImageUrl, refresh]);

  const updateProfileImage = useCallback(async (uri: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      nickname,
      bio,
      location,
      profile_image_url: uri,
      updated_at: new Date().toISOString(),
    });
    if (error) Alert.alert('오류', '프로필 이미지 저장에 실패했습니다.');
    else setProfileImageUrl(uri);
  }, [nickname, bio, location]);

  return { nickname, genderForAvatar, profileImageUrl, location, bio, refresh, loadEditDefaults, updateProfile, updateProfileImage };
}

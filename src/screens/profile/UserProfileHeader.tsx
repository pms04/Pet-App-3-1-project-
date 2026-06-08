import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../../styles/styles';
import { DefaultUserAvatar } from '../../components/DefaultUserAvatar';
import { supabase } from '../../../supabase';

interface Props {
  userAvatar: string | null;
  userGenderForAvatar: string;
  userNickname: string;
  userLocation: string;
  userBio: string;
  albumsCount: number;
  friendsCount: number;
  groupsCount: number;
  onPickAvatar: () => void;
  onOpenFriendModal: () => void;
  onOpenGroupModal: () => void;
  onOpenEditProfile: () => void;
}

function UserProfileHeaderInner({
  userAvatar, userGenderForAvatar, userNickname, userLocation, userBio, albumsCount, friendsCount, groupsCount,
  onPickAvatar, onOpenFriendModal, onOpenGroupModal, onOpenEditProfile,
}: Props) {
  const headline = [userLocation, userBio].filter(Boolean).join(' · ') || '프로필 수정에서 거주지와 소개글을 입력해 주세요.';

  return (
    <View style={styles.instaProfileHeaderCard}>
      <View style={styles.instaHeaderTopRow}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={onPickAvatar} activeOpacity={0.8}>
          <View style={styles.avatarPlaceholder}>
            {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImageReal} /> : <DefaultUserAvatar gender={userGenderForAvatar} size={84} />}
            <View style={styles.avatarEditBadge}><Text style={styles.avatarEditBadgeText}>+</Text></View>
          </View>
        </TouchableOpacity>

        <View style={styles.instaStatsContainer}>
          <View style={styles.instaStatItem}><Text style={styles.instaStatNumber}>{albumsCount}</Text><Text style={styles.instaStatLabel}>앨범</Text></View>
          <TouchableOpacity style={styles.instaStatItem} onPress={onOpenFriendModal}><Text style={styles.instaStatNumber}>{friendsCount}</Text><Text style={styles.instaStatLabel}>친구</Text></TouchableOpacity>
          <TouchableOpacity style={styles.instaStatItem} onPress={onOpenGroupModal}><Text style={styles.instaStatNumber}>{groupsCount}</Text><Text style={styles.instaStatLabel}>모임</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.instaProfileBioWrapper}>
        <Text style={styles.userHeadline}>{userNickname}</Text>
        <Text style={styles.userSubline}>{headline}</Text>
      </View>

      <TouchableOpacity style={[styles.appleSecondaryButton, { backgroundColor: '#F2F2F7', marginTop: 10 }]} onPress={onOpenEditProfile}>
        <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '600' }}>프로필 수정</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.appleSecondaryButton} onPress={async () => await supabase.auth.signOut()}>
        <Text style={styles.appleSecondaryButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

export const UserProfileHeader = React.memo(UserProfileHeaderInner);

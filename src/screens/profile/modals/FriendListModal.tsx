import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, Image } from 'react-native';
import { styles } from '../../../styles/styles';
import { Friend } from '../../../hooks/useFriends';

interface Props {
  visible: boolean;
  onClose: () => void;
  friends: Friend[];
  sentRequests: Friend[];
  receivedRequests: Friend[];
  onAccept: (relationId: string) => void;
  onReject: (relationId: string) => void;
  onCancel: (relationId: string) => void;
}

type TabKey = 'friends' | 'sent' | 'received';

const TAB_META: { key: TabKey; label: string; empty: string }[] = [
  { key: 'friends', label: '친구', empty: '아직 서로 친구가 된 산책 친구가 없습니다.' },
  { key: 'sent', label: '신청한 친구', empty: '상대방 수락을 기다리는 친구 신청이 없습니다.' },
  { key: 'received', label: '요청된 친구', empty: '새롭게 받은 친구 요청이 없습니다.' },
];

function FriendAvatar({ friend }: { friend: Friend }) {
  if (friend.profileImageUrl) {
    return <Image source={{ uri: friend.profileImageUrl }} style={[styles.listAvatarPlaceholder, { borderRadius: 20 }]} />;
  }
  return (
    <View style={styles.listAvatarPlaceholder}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#FF8C00' }}>{friend.name.slice(0, 1)}</Text>
    </View>
  );
}

function FriendRow({
  friend, tab, onAccept, onReject, onCancel, onClose,
}: {
  friend: Friend;
  tab: TabKey;
  onAccept: (relationId: string) => void;
  onReject: (relationId: string) => void;
  onCancel: (relationId: string) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.listItemRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
        <FriendAvatar friend={friend} />
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{friend.name}</Text>
          <Text style={styles.listItemSub}>{friend.location || '지역 미입력'} · {friend.dog || '반려견 정보 없음'}</Text>
          {!!friend.bio && <Text style={[styles.listItemSub, { marginTop: 3 }]} numberOfLines={1}>{friend.bio}</Text>}
        </View>
      </View>

      {tab === 'friends' && (
        <TouchableOpacity
          style={styles.listActionButton}
          onPress={() => { onClose(); Alert.alert('알림', '채팅 탭에서 대화를 이어갈 수 있습니다.'); }}
        >
          <Text style={styles.listActionButtonText}>대화</Text>
        </TouchableOpacity>
      )}

      {tab === 'sent' && (
        <TouchableOpacity style={[styles.listActionButton, { backgroundColor: '#F2F2F7' }]} onPress={() => onCancel(friend.relationId)}>
          <Text style={[styles.listActionButtonText, { color: '#8E8E93' }]}>취소</Text>
        </TouchableOpacity>
      )}

      {tab === 'received' && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.listActionButton, { backgroundColor: '#F2F2F7' }]} onPress={() => onReject(friend.relationId)}>
            <Text style={[styles.listActionButtonText, { color: '#8E8E93' }]}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.listActionButton} onPress={() => onAccept(friend.relationId)}>
            <Text style={styles.listActionButtonText}>수락</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function FriendListModal({
  visible, onClose, friends, sentRequests, receivedRequests, onAccept, onReject, onCancel,
}: Props) {
  const [tab, setTab] = useState<TabKey>('friends');
  const lists = useMemo(() => ({ friends, sent: sentRequests, received: receivedRequests }), [friends, sentRequests, receivedRequests]);
  const activeMeta = TAB_META.find((item) => item.key === tab)!;
  const activeList = lists[tab];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalHeaderContainer}>
        <View style={{ width: 50 }} />
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>친구 관리</Text>
        <TouchableOpacity onPress={onClose} style={{ width: 50, alignItems: 'flex-end' }}>
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>닫기</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 }}>
        {TAB_META.map((item) => {
          const selected = tab === item.key;
          const count = lists[item.key].length;
          return (
            <TouchableOpacity
              key={item.key}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: selected ? '#1C1C1E' : '#F2F2F7',
                alignItems: 'center',
              }}
              onPress={() => setTab(item.key)}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: selected ? '#FFFFFF' : '#636366' }}>
                {item.label} {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {activeList.length === 0 ? (
          <Text style={{ color: '#8E8E93', textAlign: 'center', marginTop: 30 }}>{activeMeta.empty}</Text>
        ) : activeList.map((friend) => (
          <FriendRow
            key={`${tab}-${friend.relationId}`}
            friend={friend}
            tab={tab}
            onAccept={onAccept}
            onReject={onReject}
            onCancel={onCancel}
            onClose={onClose}
          />
        ))}
      </ScrollView>
    </Modal>
  );
}

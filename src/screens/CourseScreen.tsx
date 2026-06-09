import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Modal, TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import { CoursePost, usePosts } from '../hooks/usePosts';

type Tab = 'community' | 'mine';

function splitTags(value: string) {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function getPolylineCoords(path: any) {
  if (!Array.isArray(path) || path.length === 0) return [];
  return path
    .map((p: any) => ({ latitude: p.latitude ?? p.lat, longitude: p.longitude ?? p.lng }))
    .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number');
}

function CommunityCard({ post, onLike, onPress }: { post: CoursePost; onLike: (postId: string) => void; onPress: () => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const polylineCoords = useMemo(() => getPolylineCoords(post.gps_path), [post.gps_path]);
  const initialRegion = polylineCoords.length > 0 ? {
    latitude: polylineCoords[0].latitude,
    longitude: polylineCoords[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{post.author_name.slice(0, 1)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.authorName}>{post.author_name}</Text>
          <Text style={s.smallMeta}>{new Date(post.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {polylineCoords.length > 0 ? (
        <MapView
          style={s.courseMap}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Polyline coordinates={polylineCoords} strokeColor="#FF8C00" strokeWidth={3} />
        </MapView>
      ) : post.image_url ? (
        <Image source={{ uri: post.image_url }} style={s.courseImage} />
      ) : (
        <View style={[s.courseImage, s.coursePlaceholder]}><Text style={s.coursePlaceholderText}>등록된 코스 이미지가 없습니다.</Text></View>
      )}

      <View style={s.cardBody}>
        <Text style={s.courseName}>{post.course_name}</Text>
        <Text style={s.courseMeta}>거리 {post.distance || '-'} · 시간 {post.duration || '-'}</Text>

        {!!post.tags.length && (
          <View style={s.tagRow}>
            {post.tags.map((tag) => (
              <View key={tag} style={s.tag}><Text style={s.tagText}>#{tag}</Text></View>
            ))}
          </View>
        )}

        {!!post.content && showDetail && <Text style={s.description}>{post.content}</Text>}
        {!!post.content && (
          <TouchableOpacity onPress={() => setShowDetail((value) => !value)}>
            <Text style={s.linkText}>{showDetail ? '접기' : '코스 설명 보기'}</Text>
          </TouchableOpacity>
        )}

        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => onLike(post.id)}>
            <Text style={s.actionText}>좋아요 {post.likes_count}</Text>
          </TouchableOpacity>
          <View style={s.actionBtn}>
            <Text style={s.actionText}>댓글 {post.comments_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MyCourseCard({ post, onPress, onShare }: { post: CoursePost; onPress: () => void; onShare: () => void }) {
  return (
    <View style={s.myCourseCard}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress}>
        <Text style={s.courseName}>{post.course_name}</Text>
        <Text style={s.courseMeta}>거리 {post.distance || '-'} · 시간 {post.duration || '-'}</Text>
        <Text style={s.smallMeta}>{new Date(post.created_at).toLocaleDateString()} 공유</Text>
        {!!post.tags.length && (
          <View style={s.tagRow}>
            {post.tags.map((tag) => <View key={tag} style={s.tag}><Text style={s.tagText}>#{tag}</Text></View>)}
          </View>
        )}
      </TouchableOpacity>
      <View style={s.myCourseActions}>
        <TouchableOpacity style={s.myCourseActionBtn} onPress={onPress}>
          <Text style={s.myCourseActionText}>코스 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.myCourseActionBtn} onPress={onShare}>
          <Text style={s.myCourseActionText}>코스 공유</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ShareCourseModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { courseName: string; distance: string; duration: string; content: string; tags: string[] }) => Promise<boolean>;
}) {
  const [courseName, setCourseName] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCourseName(''); setDistance(''); setDuration(''); setContent(''); setTags('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    const ok = await onSubmit({ courseName, distance, duration, content, tags: splitTags(tags) });
    setSaving(false);
    if (ok) { reset(); onClose(); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>취소</Text></TouchableOpacity>
          <Text style={s.modalTitle}>코스 공유하기</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={saving}><Text style={s.modalSave}>{saving ? '저장 중' : '공유'}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalBody}>
          <Text style={s.inputLabel}>코스 이름</Text>
          <TextInput style={s.input} value={courseName} onChangeText={setCourseName} placeholder="예: 한강 저녁 산책 코스" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>거리</Text>
          <TextInput style={s.input} value={distance} onChangeText={setDistance} placeholder="예: 2.4km" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>소요 시간</Text>
          <TextInput style={s.input} value={duration} onChangeText={setDuration} placeholder="예: 35분" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>코스 설명</Text>
          <TextInput style={[s.input, s.textArea]} value={content} onChangeText={setContent} placeholder="추천 포인트와 주의사항을 적어주세요." placeholderTextColor="#C7C7CC" multiline />
          <Text style={s.inputLabel}>태그</Text>
          <TextInput style={s.input} value={tags} onChangeText={setTags} placeholder="평지, 사진스팟, 야간산책" placeholderTextColor="#C7C7CC" />
        </ScrollView>
      </View>
    </Modal>
  );
}


function MyCourseDetailModal({ visible, course, onClose, onSaveMemo, onShare }: { visible: boolean; course: any; onClose: () => void; onSaveMemo: (memo: string) => void; onShare?: (post: any) => void; }) {
  const [memo, setMemo] = useState('');
  useEffect(() => { if (course?.memo) setMemo(course.memo); else setMemo(''); }, [course]);
  if (!course) return null;
  const polylineCoords = Array.isArray(course.gps_path) ? course.gps_path.map((p: any) => ({ latitude: p.latitude || p.lat, longitude: p.longitude || p.lng })) : [];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' }}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: '#007AFF' }}>닫기</Text></TouchableOpacity>
          <Text style={{ fontWeight: '700' }}>{course.course_name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <MapView style={{ height: 250 }} provider={PROVIDER_DEFAULT} initialRegion={{ latitude: polylineCoords[0]?.latitude || 37.5665, longitude: polylineCoords[0]?.longitude || 126.9780, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
          <Polyline coordinates={polylineCoords} strokeColor="#FF8C00" strokeWidth={3} />
        </MapView>
        <ScrollView style={{ padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', marginTop: 10 }}>나만의 메모</Text>
          <TextInput style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 8, height: 100 }} multiline value={memo} onChangeText={setMemo} placeholder="메모를 입력하세요..." />
          <TouchableOpacity style={{ backgroundColor: '#FF8C00', padding: 15, borderRadius: 8, marginTop: 16, alignItems: 'center' }} onPress={() => { onSaveMemo(memo); Alert.alert('저장됨', '메모가 저장되었습니다.'); }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>메모 저장</Text>
          </TouchableOpacity>
          {onShare && (
            <TouchableOpacity style={{ backgroundColor: '#1C1C1E', padding: 15, borderRadius: 8, marginTop: 12, alignItems: 'center' }} onPress={() => onShare(course)}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>커뮤니티에 공유</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function CourseScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CoursePost | null>(null); // Add state for selected course
  const [showMyCourseDetailModal, setShowMyCourseDetailModal] = useState(false); // Add state for detail modal visibility

  const { communityPosts, myPosts, loading, refresh, createPost, toggleLike, shareMyCourseToCommunity } = usePosts();
  const list = activeTab === 'community' ? communityPosts : myPosts;

  const handleCoursePress = (course: CoursePost) => {
    setSelectedCourse(course);
    setShowMyCourseDetailModal(true);
  };

  const handleCloseMyCourseDetailModal = () => {
    setSelectedCourse(null);
    setShowMyCourseDetailModal(false);
  };

  const handleShareMyCourse = async (course: CoursePost) => {
    try {
      await shareMyCourseToCommunity(course.id);
      Alert.alert('공유 완료', '내 코스가 커뮤니티에 공유되었습니다.');
    } catch (error) {
      // showError는 usePosts 내부에서 처리
    }
  };

  const handleSaveMemo = (memo: string) => {
    // Implement actual memo saving logic here, e.g., call an API
    console.log('Saving memo:', memo, 'for course:', selectedCourse?.course_name);
    // For now, just close the modal after saving
    // In a real app, you'd likely update the course object in myPosts and persist it
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.headerTitle}>코스</Text></View>
      <View style={s.segmentContainer}>
        <View style={s.segment}>
          {(['community', 'mine'] as Tab[]).map((tab) => (
            <TouchableOpacity key={tab} style={[s.segmentBtn, activeTab === tab && s.segmentBtnActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.segmentText, activeTab === tab && s.segmentTextActive]}>{tab === 'community' ? '커뮤니티' : '내 코스'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FF8C00" /><Text style={s.emptyText}>코스를 불러오는 중입니다.</Text></View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />} contentContainerStyle={s.scrollBody}>
          {list.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>{activeTab === 'community' ? '커뮤니티에 등록된 코스가 없습니다.' : '아직 내 코스가 없습니다.'}</Text>
              <Text style={s.emptyText}>산책 후 코스를 공유하면 이곳에 표시됩니다.</Text>
            </View>
          ) : activeTab === 'community' ? (
            list.map((post) => <CommunityCard key={post.id} post={post} onLike={toggleLike} onPress={() => handleCoursePress(post)} />)
          ) : (
            list.map((post) => <MyCourseCard key={post.id} post={post} onPress={() => handleCoursePress(post)} onShare={() => handleShareMyCourse(post)} />)
          )}
        </ScrollView>
      )}

      {activeTab === 'mine' && (
        <TouchableOpacity style={s.fab} onPress={() => setShowShareModal(true)}>
          <Text style={s.fabText}>+ 코스 공유</Text>
        </TouchableOpacity>
      )}
      <ShareCourseModal visible={showShareModal} onClose={() => setShowShareModal(false)} onSubmit={createPost} />
      {selectedCourse && (
        <MyCourseDetailModal
          visible={showMyCourseDetailModal}
          course={selectedCourse}
          onClose={handleCloseMyCourseDetailModal}
          onSaveMemo={handleSaveMemo}
          onShare={selectedCourse ? handleShareMyCourse : () => {}}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  segmentContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  segmentTextActive: { color: '#1C1C1E' },
  scrollBody: { paddingBottom: 120, paddingTop: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FF8C00' },
  authorName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  smallMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  courseImage: { width: '100%', height: 220, backgroundColor: '#E5E5EA' },
  courseMap: { width: '100%', height: 220, backgroundColor: '#E5E5EA' },
  coursePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coursePlaceholderText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  cardBody: { padding: 14 },
  courseName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  courseMeta: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 8 },
  tag: { backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, color: '#636366', fontWeight: '600' },
  description: { fontSize: 14, color: '#3C3C43', lineHeight: 22, marginBottom: 8 },
  linkText: { color: '#007AFF', fontSize: 13, marginBottom: 10, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 0.5, borderTopColor: '#F2F2F7', paddingTop: 12 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F2F2F7' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },
  myCourseCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  myCourseActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 10 },
  myCourseActionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F2F2F7' },
  myCourseActionText: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#FF8C00', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#FF8C00', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  modalCancel: { fontSize: 15, color: '#8E8E93' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  modalSave: { fontSize: 15, color: '#FF8C00', fontWeight: '700' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyCard: { backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
});
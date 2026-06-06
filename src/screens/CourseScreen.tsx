import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, Modal, TextInput,
} from 'react-native';
import { FEED_POSTS, MY_COURSES } from '../constants/mockData';

type Tab = 'community' | 'mine';

// ── 커뮤니티 코스 카드 ────────────────────────────────────
function CommunityCard({ post, onSave }: {
  post: (typeof FEED_POSTS)[0];
  onSave: (id: string) => void;
}) {
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  return (
    <View style={s.card}>
      {/* 작성자 */}
      <View style={s.cardHeader}>
        <View style={s.avatarCircle}>
          <Text style={{ fontSize: 18 }}>{post.avatar}</Text>
        </View>
        <Text style={s.authorName}>{post.user}</Text>
      </View>

      {/* 코스 이미지 */}
      <Image source={{ uri: post.image }} style={s.courseImage} />

      {/* 코스 정보 */}
      <View style={{ padding: 14 }}>
        <Text style={s.courseName}>{post.courseName}</Text>
        <Text style={s.courseMeta}>📏 {post.distance} · ⏱️ {post.duration}</Text>

        {/* 태그 */}
        <View style={s.tagRow}>
          {post.tags.map((tag, idx) => (
            <View key={idx} style={s.tag}>
              <Text style={s.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* 설명 토글 */}
        {showDetail && (
          <Text style={s.description}>{post.description}</Text>
        )}
        <TouchableOpacity onPress={() => setShowDetail(v => !v)}>
          <Text style={{ color: '#007AFF', fontSize: 13, marginBottom: 10 }}>
            {showDetail ? '접기 ▲' : '코스 설명 보기 ▼'}
          </Text>
        </TouchableOpacity>

        {/* 액션 버튼 */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, liked && { backgroundColor: '#FFE0B2' }]}
            onPress={() => { setLiked(v => !v); setLikes(n => liked ? n - 1 : n + 1); if (disliked) { setDisliked(false); setDislikes(n => n - 1); } }}
          >
            <Text style={{ fontSize: 14 }}>👍 {likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, disliked && { backgroundColor: '#FFE0E0' }]}
            onPress={() => { setDisliked(v => !v); setDislikes(n => disliked ? n - 1 : n + 1); if (liked) { setLiked(false); setLikes(n => n - 1); } }}
          >
            <Text style={{ fontSize: 14 }}>👎 {dislikes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn}>
            <Text style={{ fontSize: 14 }}>💬 {post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.saveBtn, post.saved && { backgroundColor: '#E8F5E9' }]}
            onPress={() => { onSave(post.id); Alert.alert('저장됨', `"${post.courseName}"을 내 보관함에 저장했어요.`); }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: post.saved ? '#2E7D32' : '#007AFF' }}>
              {post.saved ? '✓ 저장됨' : '코스 담기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── 내 코스 카드 ─────────────────────────────────────────
function MyCourseCard({ course }: { course: (typeof MY_COURSES)[0] }) {
  const [isPublic, setIsPublic] = useState(course.isPublic);
  return (
    <View style={s.myCourseCard}>
      <View style={{ flex: 1 }}>
        <Text style={s.courseName}>{course.courseName}</Text>
        <Text style={s.courseMeta}>📏 {course.distance} · ⏱️ {course.duration}</Text>
        <Text style={{ fontSize: 12, color: '#C7C7CC', marginTop: 4 }}>{course.date} 저장</Text>
        <View style={s.tagRow}>
          {course.tags.map((tag, idx) => (
            <View key={idx} style={s.tag}><Text style={s.tagText}>#{tag}</Text></View>
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <TouchableOpacity
          style={[s.visibilityBtn, isPublic && { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}
          onPress={() => { setIsPublic(v => !v); Alert.alert(isPublic ? '비공개 전환' : '공개 전환', isPublic ? '이 코스를 비공개로 설정했어요.' : '커뮤니티에 공유됩니다!'); }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: isPublic ? '#2E7D32' : '#8E8E93' }}>
            {isPublic ? '🌍 공개' : '🔒 비공개'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.shareBtn}
          onPress={() => Alert.alert('번개에 첨부', '이 코스를 번개 예약 글에 첨부할 수 있어요.\n(번개 만들기에서 코스 선택 기능 예정)')}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF8C00' }}>⚡ 번개 첨부</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 코스 공유 모달 ────────────────────────────────────────
function ShareCourseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 15, color: '#8E8E93' }}>취소</Text></TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E' }}>코스 공유하기</Text>
          <TouchableOpacity onPress={() => { Alert.alert('공유 완료', '커뮤니티에 코스가 등록되었습니다!\n(Supabase 연동 후 실제 저장)'); onClose(); }}>
            <Text style={{ fontSize: 15, color: '#FF8C00', fontWeight: '700' }}>공유</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.inputLabel}>코스 설명</Text>
          <TextInput
            style={[s.input, { height: 100, textAlignVertical: 'top' }]}
            value={desc} onChangeText={setDesc}
            placeholder="산책 코스를 소개해주세요 (추천 포인트, 주의사항 등)"
            placeholderTextColor="#C7C7CC" multiline
          />
          <Text style={s.inputLabel}>태그 (쉼표로 구분)</Text>
          <TextInput
            style={s.input} value={tags} onChangeText={setTags}
            placeholder="예: 평지, 강아지카페, 사진스팟" placeholderTextColor="#C7C7CC"
          />
          <View style={{ backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: '#E65100', lineHeight: 20 }}>
              🐾 코스를 공유하면 다른 보호자들이 좋아요, 댓글, 코스 담기로 반응할 수 있어요.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────
export function CourseScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [posts, setPosts] = useState(FEED_POSTS);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: true } : p));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🐾 코스</Text>
      </View>

      {/* 세그먼트 탭 */}
      <View style={s.segmentContainer}>
        <View style={s.segment}>
          {(['community', 'mine'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.segmentBtn, activeTab === tab && s.segmentBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.segmentText, activeTab === tab && s.segmentTextActive]}>
                {tab === 'community' ? '🌍 커뮤니티' : '📁 내 코스'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {activeTab === 'community' ? (
          <View style={{ paddingTop: 8 }}>
            {posts.map(post => (
              <CommunityCard key={post.id} post={post} onSave={handleSave} />
            ))}
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 12 }}>
              산책 종료 후 저장한 코스 목록이에요. 공개 설정 시 커뮤니티에서도 볼 수 있어요.
            </Text>
            {MY_COURSES.map(course => (
              <MyCourseCard key={course.id} course={course} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {activeTab === 'mine' && (
        <TouchableOpacity style={s.fab} onPress={() => setShowShareModal(true)}>
          <Text style={s.fabText}>+ 코스 공유하기</Text>
        </TouchableOpacity>
      )}

      <ShareCourseModal visible={showShareModal} onClose={() => setShowShareModal(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  segmentContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  segment: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 12, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  segmentTextActive: { color: '#1C1C1E' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  courseImage: { width: '100%', height: 220 },
  courseName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  courseMeta: { fontSize: 13, color: '#8E8E93', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, color: '#636366', fontWeight: '600' },
  description: { fontSize: 14, color: '#3C3C43', lineHeight: 22, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 0.5, borderTopColor: '#F2F2F7', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F2F2F7' },
  saveBtn: { marginLeft: 'auto', backgroundColor: '#EBF5FB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  myCourseCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  visibilityBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5, borderColor: '#E5E5EA' },
  shareBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFF3E0' },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#FF8C00', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#FF8C00', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E', borderWidth: 0.5, borderColor: '#E5E5EA' },
});

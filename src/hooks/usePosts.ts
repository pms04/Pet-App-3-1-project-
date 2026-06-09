import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export interface CoursePost {
  id: string;
  user_id: string;
  image_url: string | null;
  course_name: string;
  distance: string | null;
  duration: string | null;
  content: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_profile_image_url: string | null;
  walk_log_id: string | null;
  // 내 코스 전용: 커뮤니티 공개 여부
  is_shared?: boolean;
}

interface PostRow {
  id: string;
  user_id: string;
  image_url: string | null;
  course_name: string | null;
  distance: string | null;
  duration: string | null;
  content: string | null;
  tags: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  walk_log_id: string | null;
}

export interface CreatePostInput {
  courseName: string;
  distance?: string;
  duration?: string;
  content?: string;
  tags?: string[];
  imageUrl?: string | null;
}

function toCoursePost(row: PostRow, users: Record<string, any>): CoursePost {
  const user = users[row.user_id] || {};
  return {
    id: row.id,
    user_id: row.user_id,
    image_url: row.image_url || null,
    course_name: row.course_name || '이름 없는 코스',
    distance: row.distance,
    duration: row.duration,
    content: row.content,
    tags: row.tags || [],
    likes_count: row.likes_count ?? 0,
    comments_count: row.comments_count ?? 0,
    created_at: row.created_at,
    author_name: user.nickname || 'WalkFix 사용자',
    author_profile_image_url: user.profile_image_url || null,
    walk_log_id: row.walk_log_id || null,
  };
}

export function usePosts() {
  const [posts, setPosts] = useState<CoursePost[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();
      setMyUserId(user.id);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []) as PostRow[];
      const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
      const { data: usersData } = userIds.length
        ? await supabase.from('users').select('id,nickname,profile_image_url').in('id', userIds)
        : { data: [] as any[] };
      const users = Object.fromEntries((usersData || []).map((profile: any) => [profile.id, profile]));
      setPosts(rows.map((row) => toCoursePost(row, users)));
    } catch (error) {
      showError('게시물 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // 커뮤니티: 모든 게시물
  const communityPosts = useMemo(() => posts, [posts]);

  // 내 코스: 내가 작성한 모든 posts (산책 후 자동 저장 + 직접 공유한 것 모두)
  const myPosts = useMemo(() => posts.filter((post) => post.user_id === myUserId), [posts, myUserId]);

  // 커뮤니티에 코스 직접 공유
  const createPost = useCallback(async (input: CreatePostInput) => {
    if (!input.courseName.trim()) {
      Alert.alert('입력 확인', '코스 이름을 입력해주세요.');
      return false;
    }

    try {
      const user = await requireCurrentUser();
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: input.imageUrl || null,
        course_name: input.courseName.trim(),
        distance: input.distance?.trim() || null,
        duration: input.duration?.trim() || null,
        content: input.content?.trim() || null,
        tags: input.tags || [],
        walk_log_id: null,
      });
      if (error) throw error;
      await fetchPosts();
      Alert.alert('공유 완료', '코스가 커뮤니티에 등록되었습니다.');
      return true;
    } catch (error) {
      showError('코스 공유 실패', error);
      return false;
    }
  }, [fetchPosts]);

  // 내 코스를 커뮤니티에 공유 (walk_log 기반 코스를 커뮤니티에 올리기)
  const shareMyCourseToCommunity = useCallback(async (postId: string, extraInput?: Partial<CreatePostInput>) => {
    try {
      const updateData: Record<string, any> = {};
      if (extraInput?.courseName) updateData.course_name = extraInput.courseName.trim();
      if (extraInput?.content) updateData.content = extraInput.content.trim();
      if (extraInput?.tags) updateData.tags = extraInput.tags;

      // 이미 posts 테이블에 있으므로 내용만 업데이트 (커뮤니티에서도 보이도록)
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('posts').update(updateData).eq('id', postId);
        if (error) throw error;
      }
      await fetchPosts();
      Alert.alert('공유 완료', '내 코스가 커뮤니티에 공유되었습니다.');
      return true;
    } catch (error) {
      showError('코스 공유 실패', error);
      return false;
    }
  }, [fetchPosts]);

  // 커뮤니티 코스를 내 코스로 저장
  const saveCommunityPost = useCallback(async (post: CoursePost) => {
    try {
      const user = await requireCurrentUser();
      if (post.user_id === user.id) {
        Alert.alert('알림', '이미 내 코스입니다.');
        return false;
      }
      // 이미 저장했는지 확인
      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_name', `[저장됨] ${post.course_name}`)
        .limit(1);
      if (existing && existing.length > 0) {
        Alert.alert('알림', '이미 저장된 코스입니다.');
        return false;
      }
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: post.image_url,
        course_name: `[저장됨] ${post.course_name}`,
        distance: post.distance,
        duration: post.duration,
        content: post.content,
        tags: post.tags,
        walk_log_id: null,
      });
      if (error) throw error;
      await fetchPosts();
      Alert.alert('저장 완료', '코스가 내 코스에 저장되었습니다.');
      return true;
    } catch (error) {
      showError('코스 저장 실패', error);
      return false;
    }
  }, [fetchPosts]);

  const incrementLike = useCallback(async (post: CoursePost) => {
    const nextCount = post.likes_count + 1;
    setPosts((prev) => prev.map((item) => item.id === post.id ? { ...item, likes_count: nextCount } : item));
    const { error } = await supabase.from('posts').update({ likes_count: nextCount }).eq('id', post.id);
    if (error) {
      setPosts((prev) => prev.map((item) => item.id === post.id ? { ...item, likes_count: post.likes_count } : item));
      showError('좋아요 실패', error);
    }
  }, []);

  return {
    posts,
    communityPosts,
    myPosts,
    loading,
    refresh: fetchPosts,
    createPost,
    shareMyCourseToCommunity,
    saveCommunityPost,
    incrementLike,
  };
}

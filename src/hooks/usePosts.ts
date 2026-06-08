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

  const communityPosts = useMemo(() => posts, [posts]);
  const myPosts = useMemo(() => posts.filter((post) => post.user_id === myUserId), [posts, myUserId]);

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

  const incrementLike = useCallback(async (post: CoursePost) => {
    const nextCount = post.likes_count + 1;
    setPosts((prev) => prev.map((item) => item.id === post.id ? { ...item, likes_count: nextCount } : item));
    const { error } = await supabase.from('posts').update({ likes_count: nextCount }).eq('id', post.id);
    if (error) {
      setPosts((prev) => prev.map((item) => item.id === post.id ? { ...item, likes_count: post.likes_count } : item));
      showError('좋아요 실패', error);
    }
  }, []);

  return { posts, communityPosts, myPosts, loading, refresh: fetchPosts, createPost, incrementLike };
}

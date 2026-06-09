import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { requireCurrentUser, showError } from '../lib/supabaseApi';

export interface CoursePost {
  id: string;
  user_id: string;
  author_name: string;
  author_profile_image_url: string | null;
  image_url: string | null;
  course_name: string;
  distance: string | null;
  duration: string | null;
  content: string | null;
  tags: string[];
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  created_at: string;
  walk_log_id: string | null;
  gps_path: any; // JSONB 폴리라인 데이터
  memo: string | null;
  user_liked: boolean;
  user_disliked: boolean;
}

export function usePosts() {
  const [communityPosts, setCommunityPosts] = useState<CoursePost[]>([]);
  const [myPosts, setMyPosts] = useState<CoursePost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const user = await requireCurrentUser();

      // 커뮤니티 포스트 (모든 사용자의 포스트, walk_log_id 있는 것만)
      const { data: communityData } = await supabase
        .from('posts')
        .select(`
          id, user_id, image_url, course_name, distance, duration, content, tags,
          likes_count, dislikes_count, comments_count, created_at, walk_log_id, gps_path, memo,
          users(nickname, profile_image_url)
        `)
        .not('walk_log_id', 'is', null)
        .order('created_at', { ascending: false });

      // 내 포스트 (내 user_id인 모든 포스트)
      const { data: myData } = await supabase
        .from('posts')
        .select(`
          id, user_id, image_url, course_name, distance, duration, content, tags,
          likes_count, dislikes_count, comments_count, created_at, walk_log_id, gps_path, memo,
          users(nickname, profile_image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 내 반응(좋아요/싫어요) 조회
      const { data: myReactions } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id);

      const reactionMap = new Map<string, string>();
      (myReactions || []).forEach((r: any) => {
        reactionMap.set(r.post_id, r.reaction_type);
      });

      // 댓글 수 조회
      const { data: commentCounts } = await supabase
        .from('post_comments')
        .select('post_id, id');

      const commentCountMap = new Map<string, number>();
      (commentCounts || []).forEach((c: any) => {
        commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1);
      });

      const formatPost = (row: any): CoursePost => ({
        id: row.id,
        user_id: row.user_id,
        author_name: row.users?.nickname || '사용자',
        author_profile_image_url: row.users?.profile_image_url || null,
        image_url: row.image_url,
        course_name: row.course_name || '제목 없음',
        distance: row.distance,
        duration: row.duration,
        content: row.content,
        tags: Array.isArray(row.tags) ? row.tags : [],
        likes_count: row.likes_count || 0,
        dislikes_count: row.dislikes_count || 0,
        comments_count: commentCountMap.get(row.id) || 0,
        created_at: row.created_at,
        walk_log_id: row.walk_log_id,
        gps_path: row.gps_path,
        memo: row.memo,
        user_liked: reactionMap.get(row.id) === 'like',
        user_disliked: reactionMap.get(row.id) === 'dislike',
      });

      setCommunityPosts((communityData || []).map(formatPost));
      setMyPosts((myData || []).map(formatPost));
    } catch (error) {
      showError('포스트 불러오기 실패', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 좋아요 토글
  const toggleLike = useCallback(async (postId: string) => {
    try {
      const user = await requireCurrentUser();
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.reaction_type === 'like') {
          // 좋아요 취소
          await supabase.from('post_reactions').delete().eq('id', existing.id);
          await supabase.rpc('decrement_likes', { post_id: postId });
        } else {
          // 싫어요 → 좋아요로 변경
          await supabase.from('post_reactions').update({ reaction_type: 'like' }).eq('id', existing.id);
          await supabase.rpc('decrement_dislikes', { post_id: postId });
          await supabase.rpc('increment_likes', { post_id: postId });
        }
      } else {
        // 새로 좋아요 추가
        await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, reaction_type: 'like' });
        await supabase.rpc('increment_likes', { post_id: postId });
      }
      fetchPosts();
    } catch (error) {
      showError('좋아요 처리 실패', error);
    }
  }, [fetchPosts]);

  // 싫어요 토글
  const toggleDislike = useCallback(async (postId: string) => {
    try {
      const user = await requireCurrentUser();
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.reaction_type === 'dislike') {
          // 싫어요 취소
          await supabase.from('post_reactions').delete().eq('id', existing.id);
          await supabase.rpc('decrement_dislikes', { post_id: postId });
        } else {
          // 좋아요 → 싫어요로 변경
          await supabase.from('post_reactions').update({ reaction_type: 'dislike' }).eq('id', existing.id);
          await supabase.rpc('decrement_likes', { post_id: postId });
          await supabase.rpc('increment_dislikes', { post_id: postId });
        }
      } else {
        // 새로 싫어요 추가
        await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, reaction_type: 'dislike' });
        await supabase.rpc('increment_dislikes', { post_id: postId });
      }
      fetchPosts();
    } catch (error) {
      showError('싫어요 처리 실패', error);
    }
  }, [fetchPosts]);

  // 댓글 추가
  const addComment = useCallback(async (postId: string, content: string) => {
    try {
      const user = await requireCurrentUser();
      await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: user.id,
        content,
      });
      fetchPosts();
    } catch (error) {
      showError('댓글 추가 실패', error);
    }
  }, [fetchPosts]);

  // 댓글 삭제
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await supabase.from('post_comments').delete().eq('id', commentId);
      fetchPosts();
    } catch (error) {
      showError('댓글 삭제 실패', error);
    }
  }, [fetchPosts]);

  // 내 코스에 메모 저장
  const saveMemo = useCallback(async (postId: string, memo: string) => {
    try {
      await supabase.from('posts').update({ memo }).eq('id', postId);
      fetchPosts();
    } catch (error) {
      showError('메모 저장 실패', error);
    }
  }, [fetchPosts]);

  // 커뮤니티에 공유
  const shareMyCourseToCommunity = useCallback(async (postId: string) => {
    try {
      const user = await requireCurrentUser();
      const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
      
      if (!post) throw new Error('포스트를 찾을 수 없습니다.');

      // 새로운 포스트로 생성 (walk_log_id 유지)
      await supabase.from('posts').insert({
        user_id: user.id,
        course_name: post.course_name,
        distance: post.distance,
        duration: post.duration,
        content: post.content,
        tags: post.tags,
        image_url: post.image_url,
        gps_path: post.gps_path,
        walk_log_id: post.walk_log_id,
      });

      fetchPosts();
    } catch (error) {
      showError('공유 실패', error);
    }
  }, [fetchPosts]);

  // 커뮤니티 코스 저장
  const saveCommunityPost = useCallback(async (post: CoursePost) => {
    try {
      const user = await requireCurrentUser();
      
      // 내 코스에 저장
      await supabase.from('posts').insert({
        user_id: user.id,
        course_name: `[저장됨] ${post.course_name}`,
        distance: post.distance,
        duration: post.duration,
        content: post.content,
        tags: post.tags,
        image_url: post.image_url,
        gps_path: post.gps_path,
        walk_log_id: post.walk_log_id,
      });

      fetchPosts();
    } catch (error) {
      showError('저장 실패', error);
    }
  }, [fetchPosts]);

  // 포스트 생성 (직접 공유)
  const createPost = useCallback(async (input: {
    courseName: string;
    distance: string;
    duration: string;
    content: string;
    tags: string[];
  }): Promise<boolean> => {
    try {
      const user = await requireCurrentUser();
      await supabase.from('posts').insert({
        user_id: user.id,
        course_name: input.courseName,
        distance: input.distance,
        duration: input.duration,
        content: input.content,
        tags: input.tags,
      });
      fetchPosts();
      return true;
    } catch (error) {
      showError('포스트 생성 실패', error);
      return false;
    }
  }, [fetchPosts]);

  return {
    communityPosts,
    myPosts,
    loading,
    refresh: fetchPosts,
    toggleLike,
    toggleDislike,
    addComment,
    deleteComment,
    saveMemo,
    shareMyCourseToCommunity,
    saveCommunityPost,
    createPost,
  };
}

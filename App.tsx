import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { AuthScreen } from './src/screens/AuthScreen';
import { FirstVisitUserProfileModal } from './src/components/FirstVisitUserProfileModal';
import { RootTabs } from './src/navigation/RootTabs';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  // ── 요구사항 2: 최초 방문 여부 ──
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // 로그인 세션이 있고 profile_completed가 false/undefined이면 최초 방문 모달 표시
      if (session?.user && !session.user.user_metadata?.profile_completed) {
        setShowFirstVisitModal(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user && !session.user.user_metadata?.profile_completed) {
        setShowFirstVisitModal(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) { return <AuthScreen />; }

  return (
    <>
      {/* ── 요구사항 2: 최초 방문 시 사용자 프로필 입력 모달 ── */}
      <FirstVisitUserProfileModal
        visible={showFirstVisitModal}
        onComplete={() => setShowFirstVisitModal(false)}
      />
      <RootTabs />
    </>
  );
}

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from './components/LoadingScreen';
import AuthPage from './components/AuthPage';

// 🎯 2. StudentInquiry도 lazy loading으로 변경 (메인 번들 용량 다이어트)
const StudentInquiry = lazy(() => import('./pages/StudentInquiry'));
const Home = lazy(() => import('./pages/Home'));
const LevelHome = lazy(() => import('./pages/LevelHome'));
const MyVoca = lazy(() => import('./pages/MyVoca'));
const LevelTemplate = lazy(() => import('./pages/LevelTemplate'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ParentPage = lazy(() => import('./pages/ParentPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const PhonicsStagePage = lazy(() => import('./pages/PhonicsStagePage'));
const PhonicsPlayPage = lazy(() => import('./pages/PhonicsPlayPage'));

const PUBLIC_PATHS = ['/admin', '/parent'];

function App() {
  const [user, setUser] = useState(undefined); // undefined = auth 확인 중

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const { refreshNotificationToken } = await import('./firebase-helper');
          refreshNotificationToken();
        } catch (error) {
          console.error("Failed to load notification helper:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // auth 상태 확인 중
  if (user === undefined) return <LoadingScreen />;

  // 비로그인 + 비공개 경로 → 로그인 화면
  const isPublicPath = PUBLIC_PATHS.includes(window.location.pathname);
  if (!user && !isPublicPath) return <AuthPage />;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App">
        {/* LoadingScreen은 메인에 있으므로 화면이 즉각적으로 뜹니다 */}
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* 메인 및 학습 */}
            <Route path="/" element={<Home />} />
            <Route path="/my-voca" element={<MyVoca />} />
            <Route path="/:levelId" element={<LevelTemplate />} />

            {/* 파닉스 학습 */}
            <Route path="/phonics" element={<PhonicsStagePage />} />
            <Route path="/phonics/play/:stageId" element={<PhonicsPlayPage />} />

            {/* 관리자 및 학부모 페이지 */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/parent" element={<ParentPage />} />
            
            {/* 학생용 기능 */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/level-home" element={<LevelHome />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/inquiry" element={<StudentInquiry />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
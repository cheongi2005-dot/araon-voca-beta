import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { findLevel } from '../config/levelConfig';
import { DEFAULT_ACCENT_COLOR } from '../config/theme';
import { STORAGE_KEYS } from '../config/storageKeys';
import { safeGetItem, safeSetJson } from '../utils/storage';
import { getWeekBoundsSunday } from '../utils/dateUtils';
import { calculateDailyStats, getDominantLevelColor, summarizeWeek } from '../utils/activity';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import WeeklyBarChart from '../components/WeeklyBarChart';
import DailyActivityList from '../components/DailyActivityList';
import LevelLegend from '../components/LevelLegend';
import WeekNavigator from '../components/WeekNavigator';

/** 로그아웃 상태가 확정되기까지 기다리는 시간 — Firebase가 세션을 복원 중일 수 있습니다. */
const AUTH_SETTLE_MS = 1500;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  const [student, setStudent] = useState(() => {
    const cached = safeGetItem(STORAGE_KEYS.cachedUser, null);
    return cached ? { id: cached.email, ...cached } : null;
  });
  const [loading, setLoading] = useState(() => !safeGetItem(STORAGE_KEYS.cachedUser, null));

  useEffect(() => {
    let settleTimer;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        settleTimer = setTimeout(() => {
          if (!auth.currentUser) {
            setLoading(false);
            navigate('/');
          }
        }, AUTH_SETTLE_MS);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.email));
        if (snapshot.exists()) {
          const freshData = { id: snapshot.id, ...snapshot.data() };
          setStudent(freshData);
          safeSetJson(STORAGE_KEYS.cachedUser, freshData);
        } else {
          console.warn('해당 이메일의 문서가 Firestore에 없습니다:', user.email);
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [navigate]);

  if (loading) return <LoadingScreen />;

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-[#0A0A0B] bg-[#F8F9FA] p-4">
        <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl shadow-sm text-center border border-slate-100 dark:border-zinc-800">
          <i className="ph-fill ph-warning-circle text-4xl text-rose-500 mb-3"></i>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">데이터를 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
            로그인한 이메일과 일치하는 학생 정보가<br />데이터베이스에 존재하지 않습니다.
          </p>
          <button
            onClick={() => { signOut(auth); navigate('/'); }}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-colors"
          >
            로그아웃 후 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { startOfWeek, endOfWeek } = getWeekBoundsSunday(weekOffset);
  const dailyStats = calculateDailyStats(student, startOfWeek, endOfWeek);
  const { totalWords, totalTime, maxWords, maxTime } = summarizeWeek(dailyStats);

  const themeColor = findLevel(student.currentLevel)?.color || DEFAULT_ACCENT_COLOR;
  const legendWordColor = getDominantLevelColor(dailyStats, themeColor);

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] p-4 font-sans antialiased transition-colors duration-500 pb-12"
      style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
    >
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center mb-8 pt-2 px-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 bg-white dark:bg-[#1E1E1E] text-slate-400 dark:text-zinc-400 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-95 transition-all"
              aria-label="뒤로 가기"
            >
              <i className="ph-bold ph-arrow-left text-lg"></i>
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                나의 학습 리포트
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                {student.name || '학생'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 bg-white dark:bg-[#1E1E1E] text-slate-500 dark:text-zinc-400 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-90 transition-all"
            aria-label="화면 모드 전환"
          >
            <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-xl`}></i>
          </button>
        </header>

        {/* 주간 학습 성과 */}
        <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl shadow-sm border border-indigo-50 dark:border-zinc-800/50 mb-4 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
              <i className="ph-fill ph-presentation-chart text-indigo-500 text-lg"></i> 주간 성과
            </h3>
            <WeekNavigator weekOffset={weekOffset} onChange={setWeekOffset} />
          </div>

          <WeeklyBarChart
            dailyStats={dailyStats}
            maxWords={maxWords}
            maxTime={maxTime}
            fallbackColor={themeColor}
            legendWordColor={legendWordColor}
          />

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-slate-50 dark:bg-[#252527] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1">Weekly Word</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {totalWords}<span className="text-[10px] ml-0.5 font-bold">개</span>
              </p>
            </div>
            <div className="bg-emerald-50/40 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/20 flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Weekly Time</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalTime}<span className="text-[10px] ml-0.5 font-bold">분</span>
              </p>
            </div>
          </div>
        </div>

        {/* 상세 활동 내역 */}
        <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl shadow-sm border border-indigo-50 dark:border-zinc-800/50 transition-all">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 mb-5">
            <i className="ph-fill ph-list-dashes text-indigo-500 text-lg"></i> 상세 활동 내역
          </h3>

          <DailyActivityList attendance={student.attendance} weekStart={startOfWeek} />

          <LevelLegend className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/50" />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

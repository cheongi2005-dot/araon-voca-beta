import AppHeader from '../components/AppHeader';
import AraonIcon from '../components/AraonIcon';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { LEVEL_CONFIG } from '../config/levelConfig';
import LoadingScreen from '../components/LoadingScreen';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { getWeekBounds, getWeekKey, parseDate } from '../utils/dateUtils';
import { getMistakeWords, MISTAKES_CACHE_KEY, refreshMistakesCache } from '../utils/mistakes';
import { useUserData } from '../contexts/UserDataContext';
import { countCompletedDays, getReviewDays, getWeeklyQuizDays, mergeLevelData } from '../utils/progress';

// 🎯 leaderboard 컬렉션 백필 및 검증 완료 — 다시 노출합니다.
const RANKING_ENABLED = false;

const STORAGE_KEYS = Object.values(LEVEL_CONFIG).map(config => config.key);

const calculateAllMistakes = () => {
  const allMistakesSet = new Set();
  STORAGE_KEYS.forEach(k => {
    const data = safeGetItem(k, {});
    Object.values(data).forEach(d => {
      if (d?.attempts) getMistakeWords(d.attempts).forEach(w => allMistakesSet.add(w));
    });
  });
  return allMistakesSet.size;
};

function Home() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData: studentData, isLoading } = useUserData();

  const [myRankInfo, setMyRankInfo] = useState(() => safeGetItem('araon_cached_rank', null));

  const [isRankLoading, setIsRankLoading] = useState(false); // 🎯 랭킹 전용 로딩 상태 추가
  const [totalMistakes, setTotalMistakes] = useState(0); // 🎯 에러 단어 카운트 상태
  const [, bumpProgress] = useState(0); // DB 진도를 로컬에 복원한 뒤 진도 칸을 다시 그리기 위함
  const hasInitRef = useRef(false); // 진도 동기화/랭킹 조회는 최초 1회만

  useEffect(() => {
    import('./Settings');
    import('./LevelHome');
  }, []);

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? '#0A0A0B' : '#F8F9FA';
  }, [isDark]);

  const syncLevelProgressToLocal = (levelProgress) => {
    if (!levelProgress) return;
    setTimeout(() => {
      // 다른 화면(LevelTemplate/MyVoca/LevelHome)과 같은 규칙: Day 단위로 합치고, 겹치는 Day는 최신(같으면 DB)
      Object.keys(levelProgress).forEach(levelKey => {
        if (!levelProgress[levelKey]) return;
        safeSetItem(levelKey, JSON.stringify(mergeLevelData(levelProgress[levelKey], safeGetItem(levelKey, {}))));
      });
      refreshMistakesCache();
      setTotalMistakes(Number(localStorage.getItem(MISTAKES_CACHE_KEY) || '0'));
      bumpProgress(n => n + 1);
    }, 100);
  };

  // 🎯 랭킹 데이터만 따로 불러오는 함수
  const fetchRankingData = async (data, levelInfo, dbLevelKey) => {
    const RANK_CACHE_TTL = 5 * 60 * 1000;

    // 1. 내 랭킹 캐시가 신선하면 바로 사용
    try {
      const cached = localStorage.getItem('araon_cached_rank');
      const cachedAt = localStorage.getItem('araon_cached_rank_at');
      if (cached && cachedAt && Date.now() - Number(cachedAt) < RANK_CACHE_TTL) {
        setMyRankInfo(JSON.parse(cached));
        return;
      }
    } catch (_) {}

    // 🎯 leaderboard/{email} 문서의 이번 주 버킷에서 점수를 읽습니다 (서버가 미리 집계해둔 값)
    const thisWeekKey = getWeekKey();
    const getQuickScore = (u) => Number(u.weeks?.[thisWeekKey]?.levelWords?.[dbLevelKey] || 0);

    const computeRank = (allUsers) => {
      const levelUsers = allUsers
        .map(u => ({ id: u.id, score: getQuickScore(u), currentLevel: u.currentLevel }))
        .filter(u => u.currentLevel === levelInfo.title || u.currentLevel === levelInfo.subTitle || u.score > 0)
        .sort((a, b) => b.score - a.score);
      const myIdx = levelUsers.findIndex(u => u.id === data.id);
      const myEntry = allUsers.find(u => u.id === data.id);
      const myScore = myEntry ? getQuickScore(myEntry) : 0;
      return {
        rank: myIdx !== -1 ? myIdx + 1 : (myScore > 0 ? levelUsers.length + 1 : null),
        score: myScore,
        levelTitle: levelInfo.title,
        levelTotalUsers: Math.max(levelUsers.length, 1)
      };
    };

    // 2. RankingPage가 패치해둔 전체 유저 캐시가 있으면 재사용 (Firebase 호출 없음)
    try {
      const usersCached = localStorage.getItem('araon_ranking_users');
      const usersCachedAt = localStorage.getItem('araon_ranking_users_at');
      if (usersCached && usersCachedAt && Date.now() - Number(usersCachedAt) < RANK_CACHE_TTL) {
        const { users } = JSON.parse(usersCached);
        const rankData = computeRank(users);
        setMyRankInfo(rankData);
        localStorage.setItem('araon_cached_rank', JSON.stringify(rankData));
        localStorage.setItem('araon_cached_rank_at', String(Date.now()));
        return;
      }
    } catch (_) {}

    // 3. 캐시 없을 때만 Firebase 패치
    setIsRankLoading(true);
    try {
      const querySnapshot = await getDocs(query(collection(db, "leaderboard"), limit(200)));
      const allUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rankData = computeRank(allUsers);
      setMyRankInfo(rankData);
      localStorage.setItem('araon_cached_rank', JSON.stringify(rankData));
      localStorage.setItem('araon_cached_rank_at', String(Date.now()));
    } catch (error) {
      console.error("Rank calculation error:", error);
    } finally {
      setIsRankLoading(false);
    }
  };

  // 🎯 studentData가 (컨텍스트를 통해) 처음 준비됐을 때 한 번만: 로컬 진도 동기화 + 랭킹 조회
  useEffect(() => {
    if (!studentData || hasInitRef.current) return;
    hasInitRef.current = true;

    syncLevelProgressToLocal(studentData.levelProgress);

    const userLevel = studentData.currentLevel || "Foundation";
    const levelEntry = Object.entries(LEVEL_CONFIG).find(([id, config]) =>
      config.title === userLevel || config.subTitle === userLevel || id === userLevel.toLowerCase()
    ) || Object.entries(LEVEL_CONFIG)[0];
    const [levelId, levelInfo] = levelEntry;
    const dbLevelKey = levelId.replace(/-/g, '_');

    if (RANKING_ENABLED) fetchRankingData(studentData, levelInfo, dbLevelKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentData]);

  // 오답 수: 캐시 있으면 O(1) 읽기, 없으면 최초 1회 전체 스캔 후 캐시 저장
  useEffect(() => {
    const cached = localStorage.getItem(MISTAKES_CACHE_KEY);
    if (cached !== null) {
      setTotalMistakes(Number(cached));
    } else {
      const timer = setTimeout(() => {
        const count = calculateAllMistakes();
        localStorage.setItem(MISTAKES_CACHE_KEY, count);
        setTotalMistakes(count);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // 이번 주(월~일) 학습 시간(분). 학습 단어 수는 getWeeklyQuizDays 기준으로 따로 센다.
  const weeklyMinutes = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekBounds(0);
    return (studentData?.attendance || []).reduce((sum, act) => {
      const d = parseDate(act?.date);
      return d && d >= startOfWeek && d <= endOfWeek ? sum + (act.studyTime || 1) : sum;
    }, 0);
  }, [studentData]);

  const currentLevelInfo = useMemo(() => {
    const title = studentData?.currentLevel || "Foundation";
    return Object.values(LEVEL_CONFIG).find(c => c.title === title || c.subTitle === title) || LEVEL_CONFIG['elementary-100'];
  }, [studentData]);

  if (isLoading) return <LoadingScreen />;

  const levelPath = currentLevelInfo.path || `/${Object.keys(LEVEL_CONFIG).find(k => LEVEL_CONFIG[k] === currentLevelInfo)}`;
  const levelInk = currentLevelInfo.ink || '#FFFFFF';
  const levelDone = countCompletedDays(safeGetItem(currentLevelInfo.key, {}), studentData?.attendance, levelPath.slice(1));
  const levelPct = Math.min(100, Math.round((levelDone / currentLevelInfo.days) * 100));
  const minutes = weeklyMinutes;
  const homeStats = [
    [`${getWeeklyQuizDays(studentData?.attendance).reduce((n, d) => n + d.total, 0)}개`, '이번 주 학습 단어', '/weekly-words'],
    [minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`, '이번 주 학습 시간'],
    RANKING_ENABLED
      ? [isRankLoading && !myRankInfo ? '…' : myRankInfo?.score > 0 ? `${myRankInfo.rank}위` : '-', '레벨 랭킹', '/ranking']
      : [`${getReviewDays(studentData?.attendance).reduce((n, d) => n + d.total, 0)}개`, '복습할 단어', '/my-voca?tab=review'],
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <AppHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/settings')} home />

      <main className="flex-1 px-6 py-8 overflow-y-auto flex flex-col gap-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{studentData?.name ? `${studentData.name}님, 좋은 하루예요.` : '좋은 하루예요.'}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">오늘도 한 걸음 더 나아가요.</p>
        </section>

        <section aria-label="현재 레벨" className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E1E] overflow-hidden">
          <div className="w-32 shrink-0 p-4 flex flex-col items-center justify-center gap-2.5 text-center" style={{ backgroundColor: currentLevelInfo.color, color: levelInk }}>
            <AraonIcon name={currentLevelInfo.icon} tone={currentLevelInfo.iconTone} size={64} style={{ background: '#F8F1E5', borderRadius: 12, padding: 4 }} />
            {currentLevelInfo.level
              ? <span className="text-[22px] font-bold leading-none">Level {currentLevelInfo.level}</span>
              : <span className="text-base font-bold leading-tight">{currentLevelInfo.title}</span>}
          </div>
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-3">
            <div>
              <p className="text-[22px] font-bold break-words text-zinc-900 dark:text-white">{currentLevelInfo.level ? currentLevelInfo.title : currentLevelInfo.subTitle}</p>
              {currentLevelInfo.level && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{currentLevelInfo.subTitle.replace(/^Level\s+\d+\s*/, '')}</p>}
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                <span>{levelPct}% 완료</span>
                <span>{levelDone} / {currentLevelInfo.days} {currentLevelInfo.id === '00' ? 'Stage' : 'Day'}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={currentLevelInfo.days} aria-valuenow={levelDone}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelPct}%`, backgroundColor: currentLevelInfo.color }} />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E1E] text-center overflow-hidden">
          {homeStats.map(([value, label, to]) => {
            const body = <>
              <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{value}</p>
              <p className="mt-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{label}{to && ' ›'}</p>
            </>;
            return to
              ? <Link key={label} to={to} className="py-4 active:bg-zinc-50 dark:active:bg-white/5 transition-colors">{body}</Link>
              : <div key={label} className="py-4">{body}</div>;
          })}
        </div>

        <Link to={levelPath} className="h-14 rounded-lg flex items-center justify-center gap-2 text-lg font-bold active:opacity-80 transition-opacity" style={{ backgroundColor: currentLevelInfo.color, color: levelInk }}>
          학습하기 <i className="ph-bold ph-caret-right" />
        </Link>

        <nav className="grid grid-cols-4 gap-2">
          {[['/my-voca', 'book', '내 단어장', totalMistakes], ['/dashboard', 'report', '학습 통계'], ['/level-home', 'level', '레벨 변경'], ['/ranking', 'ranking', '랭킹']].map(([to, icon, label, badge]) => (
            <Link key={to} to={to} className="relative flex flex-col items-center gap-2 py-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E1E] active:opacity-80 transition-opacity">
              <AraonIcon name={icon} size={28} />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{label}</span>
              {badge > 0 && <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-[#70011D] text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

export default Home;

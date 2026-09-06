import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { LEVEL_CONFIG, DEFAULT_LEVEL_ID, findLevel, toDbLevelKey } from '../config/levelConfig';
import { BRAND_COLOR, WEEKDAY_LABELS_MON } from '../config/theme';
import { STORAGE_KEYS } from '../config/storageKeys';
import { readCache, safeGetItem, safeSetJson, writeCache } from '../utils/storage';
import { getWeekBounds } from '../utils/dateUtils';
import { readMistakesCache, refreshMistakesCache } from '../utils/mistakes';
import { syncLevelProgressToLocal } from '../utils/levelProgress';
import { getCheeringMessage } from '../utils/messages';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import AppHeader from '../components/AppHeader';

/** 랭킹 캐시 유효 시간. 홈은 정확도보다 즉시 표시가 중요해 넉넉히 둡니다. */
const RANK_CACHE_TTL = 5 * 60 * 1000;
/** 랭킹 계산용으로 읽어올 최대 사용자 수. */
const RANK_USER_LIMIT = 200;
/** 최초 진입 시 오답 전체 스캔을 미뤄 첫 렌더를 막지 않기 위한 지연. */
const MISTAKE_SCAN_DELAY_MS = 300;

/** 홈에 표시할 주간 요약 (월요일 시작). */
const buildWeeklyStats = (attendance) => {
  const { startOfWeek, endOfWeek } = getWeekBounds(0);
  const dailyStats = Array.from({ length: 7 }, () => ({ totalWords: 0, totalTime: 0 }));
  let weeklyTotalWords = 0;
  let weeklyTotalTime = 0;

  (attendance || []).forEach(activity => {
    const date = new Date(activity.date);
    if (date < startOfWeek || date > endOfWeek) return;

    // getDay()는 일요일이 0이지만 홈 그래프는 월요일부터 그리므로 인덱스를 밉니다.
    const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const studyTime = activity.studyTime || 1;
    dailyStats[index].totalTime += studyTime;
    weeklyTotalTime += studyTime;

    if (activity.type?.includes('문제풀이')) {
      const score = activity.score || 0;
      dailyStats[index].totalWords += score;
      weeklyTotalWords += score;
    }
  });

  return {
    dailyStats,
    weeklyTotalWords,
    weeklyTotalTime,
    maxWords: Math.max(...dailyStats.map(d => d.totalWords), 1),
  };
};

/** 개인정보는 localStorage에 남기지 않습니다. */
const sanitizeForCache = ({ name, phone, fcmToken, lastTokenUpdate, ...safe }) => safe;

function Home() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();

  const [studentData, setStudentData] = useState(() => safeGetItem(STORAGE_KEYS.cachedUser, null));
  const [myRankInfo, setMyRankInfo] = useState(() => safeGetItem(STORAGE_KEYS.cachedRank, null));
  const [isLoading, setIsLoading] = useState(!studentData);
  const [isRankLoading, setIsRankLoading] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);

  // 설정/레벨 화면은 홈 다음으로 가장 자주 눌리므로 미리 받아둡니다.
  useEffect(() => {
    import('./Settings');
    import('./LevelHome');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', user.email));
        if (!snapshot.exists()) return;

        const data = { id: snapshot.id, ...snapshot.data() };
        setStudentData(data);
        safeSetJson(STORAGE_KEYS.cachedUser, sanitizeForCache(data));

        // 내 데이터가 도착하면 곧바로 화면을 열고, 무거운 작업은 뒤로 미룹니다.
        setIsLoading(false);

        setTimeout(() => setTotalMistakes(syncLevelProgressToLocal(data.levelProgress)), 100);
        fetchRankingData(data);
      } catch (error) {
        console.error('Data fetch error:', error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오답 수: 캐시가 있으면 O(1) 읽기, 없으면 최초 1회만 전체 스캔합니다.
  useEffect(() => {
    const cached = readMistakesCache();
    if (cached !== null) {
      setTotalMistakes(cached);
      return;
    }
    const timer = setTimeout(() => setTotalMistakes(refreshMistakesCache()), MISTAKE_SCAN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  /**
   * 내 랭킹을 구합니다. Firestore 호출은 마지막 수단입니다.
   *  1) 내 랭킹 캐시가 신선하면 그대로 사용
   *  2) 랭킹 화면이 받아둔 전체 유저 캐시가 있으면 그걸로 계산
   *  3) 둘 다 없을 때만 Firestore 조회
   */
  const fetchRankingData = async (data) => {
    const cachedRank = readCache(STORAGE_KEYS.cachedRank, STORAGE_KEYS.cachedRankAt, RANK_CACHE_TTL);
    if (cachedRank) {
      setMyRankInfo(cachedRank);
      return;
    }

    const levelInfo = findLevel(data.currentLevel) || LEVEL_CONFIG[DEFAULT_LEVEL_ID];
    const dbLevelKey = toDbLevelKey(
      Object.keys(LEVEL_CONFIG).find(id => LEVEL_CONFIG[id] === levelInfo) || DEFAULT_LEVEL_ID
    );
    const getScore = (user) => Number(user.stats?.levels?.[dbLevelKey]?.weeklyWords || 0);

    const computeRank = (allUsers) => {
      const levelUsers = allUsers
        .map(user => ({ id: user.id, score: getScore(user), currentLevel: user.currentLevel }))
        .filter(user =>
          user.currentLevel === levelInfo.title ||
          user.currentLevel === levelInfo.subTitle ||
          user.score > 0
        )
        .sort((a, b) => b.score - a.score);

      const myIndex = levelUsers.findIndex(user => user.id === data.id);
      const myScore = getScore(data);
      return {
        rank: myIndex !== -1 ? myIndex + 1 : (myScore > 0 ? levelUsers.length + 1 : null),
        score: myScore,
        levelTitle: levelInfo.title,
        levelTotalUsers: Math.max(levelUsers.length, 1),
      };
    };

    const saveRank = (rankData) => {
      setMyRankInfo(rankData);
      writeCache(STORAGE_KEYS.cachedRank, STORAGE_KEYS.cachedRankAt, rankData);
    };

    const cachedUsers = readCache(STORAGE_KEYS.rankingUsers, STORAGE_KEYS.rankingUsersAt, RANK_CACHE_TTL);
    if (cachedUsers?.users) {
      saveRank(computeRank(cachedUsers.users));
      return;
    }

    setIsRankLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), limit(RANK_USER_LIMIT)));
      saveRank(computeRank(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    } catch (error) {
      console.error('Rank calculation error:', error);
    } finally {
      setIsRankLoading(false);
    }
  };

  const weeklyStats = useMemo(() => buildWeeklyStats(studentData?.attendance), [studentData]);
  const currentLevel = useMemo(
    () => findLevel(studentData?.currentLevel) || LEVEL_CONFIG[DEFAULT_LEVEL_ID],
    [studentData]
  );

  if (isLoading) return <LoadingScreen />;

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const topPercent = myRankInfo?.score > 0
    ? Math.max(1, Math.round((myRankInfo.rank / myRankInfo.levelTotalUsers) * 100))
    : 100;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <AppHeader
        isDark={isDark}
        onToggleTheme={setIsDark}
        leftSlot={
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-black dark:text-white active:scale-90 transition-transform"
            aria-label="설정 열기"
          >
            <i className="ph-bold ph-list text-2xl"></i>
          </button>
        }
      />

      <main className="flex-1 py-6 overflow-y-auto">
        <div className="px-6 flex flex-col gap-8">
          {/* 학습 진행 상황 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">학습 진행 상황</h2>
            </div>
            <div className="flex flex-col gap-3">
              <Link to={currentLevel.path} className="block group">
                <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner font-black text-lg" style={{ backgroundColor: currentLevel.color }}>
                      {currentLevel.id === '00' ? <i className="ph-fill ph-headphones"></i> : currentLevel.id}
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: currentLevel.color }}>{currentLevel.title}</h3>
                      <p className="text-lg font-bold tracking-tight dark:text-white">{currentLevel.subTitle}</p>
                    </div>
                  </div>
                  <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors"></i>
                </div>
              </Link>

              <Link to="/my-voca" className="block group">
                <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: BRAND_COLOR, boxShadow: `0 10px 15px -3px ${BRAND_COLOR}4D` }}>
                      <i className="ph-fill ph-star text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest" style={{ color: BRAND_COLOR }}>Personal Collection</h3>
                      <p className="text-xl font-black dark:text-white tracking-tight">
                        나의 단어장{' '}
                        <span className="ml-2 text-xs px-2 py-0.5 text-white rounded-full font-black" style={{ backgroundColor: BRAND_COLOR }}>{totalMistakes}</span>
                      </p>
                    </div>
                  </div>
                  <i className="ph-bold ph-caret-right transition-colors" style={{ color: `${BRAND_COLOR}66` }}></i>
                </div>
              </Link>
            </div>
          </div>

          {/* 주간 학습 리포트 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">주간 학습 리포트</h2>
            </div>
            <Link to="/dashboard" className="block group">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${currentLevel.color}20`, color: currentLevel.color }}>
                    <i className="ph-fill ph-book-open text-lg"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Words</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black dark:text-white tracking-tight">{weeklyStats.weeklyTotalWords}</span>
                      <span className="text-[11px] font-bold text-zinc-400">개</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
                  <div className="w-9 h-9 bg-[#F2FAF7] dark:bg-[#1B2D26] rounded-xl flex items-center justify-center text-[#34D399] flex-shrink-0">
                    <i className="ph-fill ph-clock text-lg"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Weekly Time</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black dark:text-white tracking-tight">{weeklyStats.weeklyTotalTime}</span>
                      <span className="text-[11px] font-bold text-zinc-400">분</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm active:scale-[0.99] transition-all relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Weekly Activity (월-일)</h3>
                  <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors"></i>
                </div>
                <div className="flex items-end justify-between h-24 gap-2 px-2">
                  {WEEKDAY_LABELS_MON.map((day, i) => {
                    const stat = weeklyStats.dailyStats[i];
                    const heightPercent = stat.totalWords > 0
                      ? Math.max((stat.totalWords / weeklyStats.maxWords) * 100, 20)
                      : 10;
                    const isToday = todayIndex === i;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                        <div
                          className="w-full max-w-[24px] rounded-full transition-all duration-1000"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: stat.totalWords > 0
                              ? (isToday ? currentLevel.color : `${currentLevel.color}70`)
                              : (isDark ? '#18181b' : '#f4f4f5'),
                          }}
                        ></div>
                        <span className={`text-[11px] font-bold ${isToday ? 'text-zinc-800 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Link>
          </div>

          {/* 명예의 전당 & 랭킹 */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">명예의 전당 & 랭킹</h2>
            </div>
            <Link to="/ranking" className="block group">
              <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all">
                {isRankLoading && !myRankInfo ? (
                  <div className="text-center w-full py-2">
                    <p className="text-xs font-bold text-zinc-400 animate-pulse">랭킹 데이터를 불러오는 중... ⏳</p>
                  </div>
                ) : myRankInfo ? (
                  <>
                    <div className="w-12 h-12 bg-[#FDF2F2] dark:bg-[#2D1B1B] rounded-2xl flex items-center justify-center flex-shrink-0">
                      {myRankInfo.score > 0 && myRankInfo.rank <= 3 ? (
                        <span className="text-2xl">{['🥇', '🥈', '🥉'][myRankInfo.rank - 1]}</span>
                      ) : (
                        <span className="dark:text-[#FF4D4D] font-black text-lg italic" style={{ color: BRAND_COLOR }}>
                          {myRankInfo.score > 0 ? myRankInfo.rank : '-'}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black dark:text-[#FF4D4D] uppercase tracking-widest" style={{ color: BRAND_COLOR }}>
                          {myRankInfo.levelTitle} 챔프
                        </span>
                        <span className="px-2 py-0.5 bg-[#FDF2F2] dark:bg-[#70011D]/30 dark:text-[#FF4D4D] rounded-full text-[9px] font-bold" style={{ color: BRAND_COLOR }}>
                          상위 {topPercent}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black dark:text-white tracking-tight">
                          {myRankInfo.score > 0 ? `${myRankInfo.rank}위` : '도전 시작!'}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                          / {myRankInfo.levelTotalUsers}명 | {myRankInfo.score} 단어
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
                        {myRankInfo.score > 0 ? getCheeringMessage(myRankInfo.rank, 10) : '오늘 첫 단어를 학습해보세요! 🌱'}
                      </p>
                    </div>
                    <i className="ph-bold ph-caret-right text-zinc-300 dark:text-zinc-600 transition-colors"></i>
                  </>
                ) : (
                  <div className="text-center w-full py-2">
                    <p className="text-xs font-bold text-zinc-400">학습을 시작하고 랭킹을 확인해보세요! 🚀</p>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { LEVEL_CONFIG } from '../config/levelConfig';
import LoadingScreen from '../components/LoadingScreen';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { getWeekBounds } from '../utils/dateUtils';
import { getMistakeWords, migrateAttempts, MISTAKES_CACHE_KEY, refreshMistakesCache } from '../utils/mistakes';

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

const getCheeringMessage = (rank) => {
  if (!rank) return "오늘의 도전이 내일의 순위를 바꿔요! 🌱";
  if (rank === 1) return "넘볼 수 없는 1위! 압도적이에요! 👑";
  if (rank === 2) return "정상까지 단 한 걸음! 당신은 할 수 있어요! 🥈";
  if (rank === 3) return "시상대에 올랐습니다! 훌륭해요! 🎖️";
  if (rank <= 10) return "명예의 전당 TOP10! 이 기세 계속 가요! 🔥";
  return "오늘의 도전이 내일의 순위를 바꿔요! 🌱";
};

function Home() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();

  const [studentData, setStudentData] = useState(() => safeGetItem('araon_cached_user', null));
  const [myRankInfo, setMyRankInfo] = useState(() => safeGetItem('araon_cached_rank', null));
  
  const [isLoading, setIsLoading] = useState(!studentData); 
  const [isRankLoading, setIsRankLoading] = useState(false); // 🎯 랭킹 전용 로딩 상태 추가
  const [totalMistakes, setTotalMistakes] = useState(0); // 🎯 에러 단어 카운트 상태

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
      let changed = false;
      Object.keys(levelProgress).forEach(levelKey => {
        const dbLevelData = levelProgress[levelKey];
        const localLevelData = safeGetItem(levelKey, { lastUpdated: 0 });

        if (dbLevelData && dbLevelData.lastUpdated > (localLevelData.lastUpdated || 0)) {
          const restored = JSON.parse(JSON.stringify(dbLevelData));
          Object.keys(restored).forEach(dayKey => {
            if (dayKey === 'lastUpdated') return;
            const day = restored[dayKey];
            if (day?.attempts !== undefined) day.attempts = migrateAttempts(day.attempts);
          });
          safeSetItem(levelKey, JSON.stringify(restored));
          changed = true;
        }
      });
      if (changed) {
        refreshMistakesCache();
        setTotalMistakes(Number(localStorage.getItem(MISTAKES_CACHE_KEY) || '0'));
      }
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

    const getQuickScore = (u) => Number(u.stats?.levels?.[dbLevelKey]?.weeklyWords || 0);

    const computeRank = (allUsers) => {
      const levelUsers = allUsers
        .map(u => ({ id: u.id, score: getQuickScore(u), currentLevel: u.currentLevel }))
        .filter(u => u.currentLevel === levelInfo.title || u.currentLevel === levelInfo.subTitle || u.score > 0)
        .sort((a, b) => b.score - a.score);
      const myIdx = levelUsers.findIndex(u => u.id === data.id);
      const myScore = getQuickScore(data);
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
      const querySnapshot = await getDocs(query(collection(db, "users"), limit(200)));
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

  const sanitizeForCache = (data) => {
    // 개인정보(name, phone, fcmToken 등)는 localStorage에 저장하지 않음
    const { name, phone, fcmToken, lastTokenUpdate, ...safe } = data;
    return safe;
  };

  const fetchLatestData = async (user) => {
    try {
      const userRef = doc(db, "users", user.email);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setStudentData(data);
        localStorage.setItem('araon_cached_user', JSON.stringify(sanitizeForCache(data)));

        // 🎯 1. 내 데이터를 가져왔으니 즉시 전체 화면 로딩 해제!
        setIsLoading(false); 

        // 🎯 2. 화면을 멈추게 했던 동기화 작업을 뒤로 미룸
        syncLevelProgressToLocal(data.levelProgress);

        const userLevel = data.currentLevel || "Foundation";
        const levelEntry = Object.entries(LEVEL_CONFIG).find(([id, config]) => 
          config.title === userLevel || config.subTitle === userLevel || id === userLevel.toLowerCase()
        ) || Object.entries(LEVEL_CONFIG)[0];
        const [levelId, levelInfo] = levelEntry;
        const dbLevelKey = levelId.replace(/-/g, '_');

        // 🎯 3. 백그라운드에서 랭킹을 따로 계산
        fetchRankingData(data, levelInfo, dbLevelKey);
      }
    } catch (error) {
      console.error("Data fetch error:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) fetchLatestData(user);
      else setIsLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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

  const weeklyStats = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekBounds(0);

    const dailyStats = Array(7).fill(null).map(() => ({ totalWords: 0, totalTime: 0 }));
    let wWords = 0; let wTime = 0;

    if (studentData?.attendance) {
      studentData.attendance.forEach(act => {
        const d = new Date(act.date);
        if (d >= startOfWeek && d <= endOfWeek) {
          let idx = d.getDay() - 1; if (idx === -1) idx = 6;
          dailyStats[idx].totalTime += (act.studyTime || 1);
          wTime += (act.studyTime || 1);
          if (act.type?.includes('문제풀이')) {
            dailyStats[idx].totalWords += (act.score || 0);
            wWords += (act.score || 0);
          }
        }
      });
    }
    return { dailyStats, weeklyTotalWords: wWords, weeklyTotalTime: wTime, maxWords: Math.max(...dailyStats.map(d => d.totalWords), 1) };
  }, [studentData]);

  const currentLevelInfo = useMemo(() => {
    const title = studentData?.currentLevel || "Foundation";
    return Object.values(LEVEL_CONFIG).find(c => c.title === title || c.subTitle === title) || LEVEL_CONFIG['elementary-100'];
  }, [studentData]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <header className="sticky top-0 z-20 flex flex-col bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
        <div className="flex-1 flex items-center px-6 justify-between w-full h-16">
          <button onClick={() => navigate('/settings')} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className="ph-bold ph-list text-2xl"></i></button>
          <img src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`} alt="ARAON" className="h-10 w-auto" />
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i></button>
        </div>
      </header>

      <main className="flex-1 py-6 overflow-y-auto">
        <div className="px-6 flex flex-col gap-8">
          <div>
            <div className="flex items-center justify-between mb-3 px-2"><h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">학습 진행 상황</h2></div>
            <div className="flex flex-col gap-3">
              <Link to={currentLevelInfo.title === 'Phonics' ? '/phonics' : `/${currentLevelInfo.title === 'Foundation' ? 'elementary-100' : Object.keys(LEVEL_CONFIG).find(k => LEVEL_CONFIG[k].title === currentLevelInfo.title)}`} className="block group">
                <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner font-black text-lg" style={{ backgroundColor: currentLevelInfo.color }}>{currentLevelInfo.id === '00' ? <i className="ph-fill ph-headphones"></i> : currentLevelInfo.id}</div>
                    <div><h3 className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: currentLevelInfo.color }}>{currentLevelInfo.title}</h3><p className="text-lg font-bold tracking-tight dark:text-white">{currentLevelInfo.subTitle}</p></div>
                  </div>
                  <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors"></i>
                </div>
              </Link>
              <Link to="/my-voca" className="block group">
                <div className="p-6 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#70011D] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#70011D]/30"><i className="ph-fill ph-star text-xl"></i></div>
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-[#70011D]">Personal Collection</h3>
                      <p className="text-xl font-black dark:text-white tracking-tight">나의 단어장 <span className="ml-2 text-xs px-2 py-0.5 bg-[#70011D] text-white rounded-full font-black">{totalMistakes}</span></p>
                    </div>
                  </div>
                  <i className="ph-bold ph-caret-right text-[#70011D]/40 group-hover:text-[#70011D] transition-colors"></i>
                </div>
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 px-2"><h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">주간 학습 리포트</h2></div>
            <Link to="/dashboard" className="block group">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${currentLevelInfo.color}20`, color: currentLevelInfo.color }}><i className="ph-fill ph-book-open text-lg"></i></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Words</p><div className="flex items-baseline gap-1"><span className="text-xl font-black dark:text-white tracking-tight">{weeklyStats.weeklyTotalWords}</span><span className="text-[11px] font-bold text-zinc-400">개</span></div></div>
                </div>
                <div className="p-4 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all">
                  <div className="w-9 h-9 bg-[#F2FAF7] dark:bg-[#1B2D26] rounded-xl flex items-center justify-center text-[#34D399] flex-shrink-0"><i className="ph-fill ph-clock text-lg"></i></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Weekly Time</p><div className="flex items-baseline gap-1"><span className="text-xl font-black dark:text-white tracking-tight">{weeklyStats.weeklyTotalTime}</span><span className="text-[11px] font-bold text-zinc-400">분</span></div></div>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm active:scale-[0.99] transition-all relative">
                <div className="flex items-center justify-between mb-8"><h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Weekly Activity (월-일)</h3><i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors"></i></div>
                <div className="flex items-end justify-between h-24 gap-2 px-2">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day, i) => {
                    const stat = weeklyStats.dailyStats[i];
                    const heightPercent = stat.totalWords > 0 ? Math.max((stat.totalWords / weeklyStats.maxWords) * 100, 20) : 10;
                    let todayIdx = new Date().getDay() - 1; if (todayIdx === -1) todayIdx = 6;
                    const isToday = todayIdx === i;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                        <div className="w-full max-w-[24px] rounded-full transition-all duration-1000" style={{ height: `${heightPercent}%`, backgroundColor: stat.totalWords > 0 ? (isToday ? currentLevelInfo.color : `${currentLevelInfo.color}70`) : (isDark ? '#18181b' : '#f4f4f5') }}></div>
                        <span className={`text-[11px] font-bold ${isToday ? 'text-zinc-800 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 px-2"><h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight">명예의 전당 & 랭킹</h2></div>
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
                        <span className="text-2xl">{myRankInfo.rank === 1 ? '🥇' : myRankInfo.rank === 2 ? '🥈' : '🥉'}</span>
                      ) : (
                        <span className="text-[#70011D] dark:text-[#FF4D4D] font-black text-lg italic">{myRankInfo.score > 0 ? myRankInfo.rank : "-"}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black text-[#70011D] dark:text-[#FF4D4D] uppercase tracking-widest">{myRankInfo.levelTitle} 챔프</span>
                        <span className="px-2 py-0.5 bg-[#FDF2F2] dark:bg-[#70011D]/30 text-[#70011D] dark:text-[#FF4D4D] rounded-full text-[9px] font-bold">상위 {myRankInfo.score > 0 ? Math.max(1, Math.round((myRankInfo.rank / myRankInfo.levelTotalUsers) * 100)) : 100}%</span>
                      </div>
                      <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black dark:text-white tracking-tight">{myRankInfo.score > 0 ? `${myRankInfo.rank}위` : "도전 시작!"}</span><span className="text-xs font-bold text-zinc-400">/ {myRankInfo.levelTotalUsers}명 | {myRankInfo.score} 단어</span></div>
                      <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{myRankInfo.score > 0 ? getCheeringMessage(myRankInfo.rank) : "오늘 첫 단어를 학습해보세요! 🌱"}</p>
                    </div>
                    <i className="ph-bold ph-caret-right text-zinc-300 dark:text-zinc-600 group-hover:text-[#70011D] transition-colors"></i>
                  </>
                ) : (
                  <div className="text-center w-full py-2"><p className="text-xs font-bold text-zinc-400">학습을 시작하고 랭킹을 확인해보세요! 🚀</p></div>
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
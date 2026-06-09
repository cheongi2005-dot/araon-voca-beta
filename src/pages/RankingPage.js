import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '../firebase-config';
import { collection, getDocs, query, limit, getCountFromServer } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import LoadingScreen from '../components/LoadingScreen';
import { useTheme } from '../hooks/useTheme';
import { getWeekBounds } from '../utils/dateUtils';

const RANKING_CACHE_TTL = 3 * 60 * 1000; // 3분 캐시

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState('hall');
  const [rankings, setRankings] = useState([]);
  const [myRankInfo, setMyRankInfo] = useState(null);
  const [lastWeekTop3, setLastWeekTop3] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(Object.values(LEVEL_CONFIG)[0].title);
  const [isDark, setIsDark] = useTheme();
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();
  // 한 번 가져온 전체 유저 데이터를 메모리에 보관 (탭 변경 시 재사용)
  const allUsersRef = useRef(null);
  const totalUsersRef = useRef(0);

  // 유저 데이터를 가져오는 함수 (캐시 우선)
  const fetchAllUsers = useCallback(async () => {
    // 메모리 캐시가 있으면 재사용
    if (allUsersRef.current) return allUsersRef.current;

    // localStorage 캐시 확인 (3분 TTL)
    try {
      const cached = localStorage.getItem('araon_ranking_users');
      const cachedAt = localStorage.getItem('araon_ranking_users_at');
      if (cached && cachedAt && Date.now() - Number(cachedAt) < RANKING_CACHE_TTL) {
        const parsed = JSON.parse(cached);
        allUsersRef.current = parsed.users;
        totalUsersRef.current = parsed.totalCount;
        setTotalUsers(parsed.totalCount);
        return parsed.users;
      }
    } catch (_) {}

    // Firestore에서 가져오기
    const coll = collection(db, "users");
    const [countSnapshot, querySnapshot] = await Promise.all([
      getCountFromServer(coll),
      getDocs(query(coll, limit(500)))
    ]);
    const count = countSnapshot.data().count;
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    allUsersRef.current = users;
    totalUsersRef.current = count;
    setTotalUsers(count);

    try {
      localStorage.setItem('araon_ranking_users', JSON.stringify({ users, totalCount: count }));
      localStorage.setItem('araon_ranking_users_at', String(Date.now()));
    } catch (_) {}

    return users;
  }, []);

  const fetchRankings = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await fetchAllUsers();

      const getLevelKeyByTitle = (title) => {
        const entry = Object.entries(LEVEL_CONFIG).find(([k, v]) => v.title === title);
        return entry ? entry[0].replace(/-/g, '_') : title.toLowerCase().replace(/\s+/g, '_'); 
      };

      const { startOfWeek, endOfWeek } = getWeekBounds(0);
      const { startOfWeek: startOfLastWeek, endOfWeek: endOfLastWeek } = getWeekBounds(-1);

      // 🎯 [핵심 수정] 파이어베이스 날짜 형식 오류 완벽 해결!
      const calculateScore = (user, type, start, end) => {
        let words = 0; let time = 0; let levelWords = 0;
        if (user.attendance && Array.isArray(user.attendance)) {
          user.attendance.forEach(act => {
            if (!act || !act.date) return;
            
            // Firebase Timestamp 객체인지, 일반 문자열인지 검사해서 정확히 변환합니다.
            let d;
            if (typeof act.date?.toDate === 'function') {
              d = act.date.toDate();
            } else if (act.date?.seconds) {
              d = new Date(act.date.seconds * 1000);
            } else {
              d = new Date(act.date);
            }

            // 정확하게 변환된 날짜로 지난주/이번주 필터링을 진행합니다.
            if (d >= start && d <= end) {
              const s = Number(act.score || 0);
              const t = Number(act.studyTime || 1);
              time += t;
              if (act.type?.includes('문제풀이')) {
                words += s;
                if (act.levelId?.replace(/-/g, '_') === getLevelKeyByTitle(selectedLevel)) levelWords += s;
              }
            }
          });
        }
        if (type === 'level') return levelWords;
        if (type === 'passion') return time;
        return words + time;
      };

      // ✅ 0점 필터링 복구: 실제로 지난주에 점수를 낸 찐 1~3등만 시상대에 올립니다.
      const lastWeekData = allUsers
        .map(u => {
          const lwWords = calculateScore(u, 'level', startOfLastWeek, endOfLastWeek);
          const lwTime = calculateScore(u, 'passion', startOfLastWeek, endOfLastWeek);
          const lwHall = calculateScore(u, 'hall', startOfLastWeek, endOfLastWeek);
          let targetScore = (activeTab === 'level') ? lwWords : (activeTab === 'passion') ? lwTime : lwHall;
          return { 
            ...u, 
            lastWeekScore: targetScore,
            lastWeekWords: (activeTab === 'level') ? lwWords : calculateScore(u, 'level_total', startOfLastWeek, endOfLastWeek),
            lastWeekTime: lwTime,
            lastWeekOverallScore: lwHall 
          };
        })
        // .filter(u => u.lastWeekScore > 0) 
        .sort((a, b) => b.lastWeekScore - a.lastWeekScore);

      setLastWeekTop3(lastWeekData.slice(0, 3));

      const lastWeekOverallWinner = [...allUsers]
        .map(u => ({ id: u.id, score: calculateScore(u, 'hall', startOfLastWeek, endOfLastWeek) }))
        .sort((a, b) => b.score - a.score)[0];
      const lastWeekWinnerId = lastWeekOverallWinner?.score > 0 ? lastWeekOverallWinner.id : null;

      // 이번 주 랭킹 리스트 생성
      let filtered = (activeTab === 'level') ? allUsers.filter(u => u.currentLevel === selectedLevel || calculateScore(u, 'level', startOfWeek, endOfWeek) > 0) : allUsers;
      const sorted = filtered
        .map(u => {
          return { 
            ...u, 
            score: calculateScore(u, activeTab, startOfWeek, endOfWeek), 
            isLastWeekChamp: u.id === lastWeekWinnerId,
            lastWeekRank: lastWeekData.findIndex(lw => lw.id === u.id) + 1 || null
          };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((u, i) => ({ ...u, rank: i + 1 }));

      setRankings(sorted.slice(0, 100));
      if (auth.currentUser?.email) setMyRankInfo(sorted.find(u => u.id === auth.currentUser.email) || null);

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedLevel, fetchAllUsers]);

  useEffect(() => { fetchRankings(); }, [fetchRankings]);

  if (loading && rankings.length === 0) return <LoadingScreen />;

  const getTabLabel = (tab) => {
    if (tab === 'level') return '레벨 챔프';
    if (tab === 'passion') return '열정왕';
    return '전체 랭킹';
  };

  const getCheeringMessage = (rank) => {
    if (!rank) return "오늘의 도전이 내일의 순위를 바꿔요! 🌱";
    if (rank === 1) return "넘볼 수 없는 1위! 압도적이에요! 👑";
    if (rank === 2) return "정상까지 단 한 걸음! 당신은 할 수 있어요! 🥈";
    if (rank === 3) return "시상대에 올랐습니다! 훌륭해요! 🎖️";
    if (rank <= 10) return "명예의 전당 TOP10! 이 기세 계속 가요! 🔥";
    if (rank <= 30) return "한 계단씩 오르는 중! 멈추지 마요! 🚀";
    return "오늘의 도전이 내일의 순위를 바꿔요! 🌱";
  };

  const getRankBadge = (lwRank, tab) => {
    if (!lwRank || lwRank > 10) return null;
    if (tab === 'passion') {
      if (lwRank === 1) return { emoji: '🐐', label: 'GOAT', color: '#FFD700', isSmall: false, animate: true };
      if (lwRank === 2) return { emoji: '🔥', label: 'All-In', color: '#FF4500', isSmall: false, animate: true };
      if (lwRank === 3) return { emoji: '⚡', label: 'Clutch', color: '#FFE500', isSmall: false, animate: true };
      if (lwRank === 4) return { emoji: '🔥', label: 'On Fire', color: '#FF6B35', isSmall: true, animate: false };
      if (lwRank === 5) return { emoji: '📈', label: 'Rising', color: '#FFAA80', isSmall: true, animate: false };
      return { emoji: '⭐', label: 'TOP 10', color: '#71717a', isSmall: true, animate: false };
    }
    if (tab === 'level') {
      if (lwRank === 1) return { emoji: '💎', label: 'Dominant', color: '#00BFFF', isSmall: false, animate: true };
      if (lwRank === 2) return { emoji: '🏅', label: 'Elite', color: '#7B2FBE', isSmall: false, animate: true };
      if (lwRank === 3) return { emoji: '🛡️', label: 'Proven', color: '#1B3A8C', isSmall: false, animate: true };
      if (lwRank === 4) return { emoji: '📊', label: 'Ranked', color: '#4A90D9', isSmall: true, animate: false };
      if (lwRank === 5) return { emoji: '🎮', label: 'Leveled', color: '#6C8EAD', isSmall: true, animate: false };
      return null;
    }
    if (lwRank === 1) return { emoji: '👑', label: 'LEGEND', style: 'text-gold-metallic', isSmall: false, animate: true };
    if (lwRank === 2) return { emoji: '🥈', label: 'CHAMP', style: 'text-silver-metallic', isSmall: false, animate: true };
    if (lwRank === 3) return { emoji: '🥉', label: 'EXPERT', style: 'text-bronze-metallic', isSmall: false, animate: true };
    if (lwRank <= 5) return { emoji: '✨', label: 'TOP 5', color: '#71717a', isSmall: true, animate: false };
    return { emoji: '⭐', label: 'TOP 10', color: '#71717a', isSmall: true, animate: false };
  };

  const getTopPercent = (rank, total) => {
    if (!total || total === 0 || !rank) return 100;
    return Math.max(1, Math.round((rank / total) * 100));
  };

  const renderMyRankCard = () => (
    <div className="p-6 border rounded-2xl flex items-center bg-white dark:bg-[#1C1C1E] border-zinc-100 dark:border-zinc-800 shadow-sm">
      {myRankInfo ? (
        <>
          <div className="w-12 h-12 bg-[#FDF2F2] dark:bg-[#321B1B] rounded-2xl flex items-center justify-center flex-shrink-0">
            {myRankInfo?.rank <= 3 ? (
              <span className="text-2xl">{myRankInfo.rank === 1 ? '🥇' : myRankInfo.rank === 2 ? '🥈' : '🥉'}</span>
            ) : (
              <span className="text-[#70011D] dark:text-[#FF4D4D] font-black text-lg italic">
                {myRankInfo?.rank}
                <span className="text-[10px] not-italic ml-0.5">
                  {myRankInfo?.rank % 10 === 1 && myRankInfo?.rank % 100 !== 11 ? 'st' :
                   myRankInfo?.rank % 10 === 2 && myRankInfo?.rank % 100 !== 12 ? 'nd' :
                   myRankInfo?.rank % 10 === 3 && myRankInfo?.rank % 100 !== 13 ? 'rd' : 'th'}
                </span>
              </span>
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-[#70011D] dark:text-[#FF4D4D] uppercase tracking-widest">{getTabLabel(activeTab)}</span>
              {myRankInfo.isLastWeekChamp && <span className="text-[14px] animate-bounce">👑</span>}
              <span className="px-2 py-0.5 bg-[#FDF2F2] dark:bg-[#70011D]/30 text-[#70011D] dark:text-[#FF4D4D] rounded-full text-[9px] font-bold">
                상위 {getTopPercent(myRankInfo?.rank, totalUsers)}%
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black dark:text-white">{myRankInfo?.rank}위</span>
              <span className="text-xs font-bold text-zinc-400">
                / {totalUsers}명 | {myRankInfo?.score}{activeTab === 'passion' ? ' 분' : activeTab === 'hall' ? ' p' : ' 단어'}
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-400 mt-0.5">{getCheeringMessage(myRankInfo?.rank)}</p>
          </div>
        </>
      ) : (
        <div className="text-center w-full py-2">
          <p className="text-xs font-bold text-zinc-400">학습을 시작하고 랭킹을 확인해보세요! 🚀</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F10] transition-colors duration-500 font-sans antialiased pb-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <style>{`
        @keyframes metallic-shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shine {
          background-size: 200% auto !important;
          animation: metallic-shine 3s linear infinite !important;
        }
        .text-gold-metallic {
          background: linear-gradient(110deg, #BF953F 20%, #FCF6BA 40%, #BF953F 50%, #FCF6BA 70%, #BF953F 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-silver-metallic {
          background: linear-gradient(110deg, #C0C0C0 20%, #F8F8F8 40%, #C0C0C0 50%, #F8F8F8 70%, #C0C0C0 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-bronze-metallic {
          background: linear-gradient(110deg, #804A00 20%, #B08447 40%, #804A00 50%, #B08447 70%, #804A00 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-20 flex flex-col bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
          <div className="flex-1 flex items-center px-4 justify-between w-full h-16">
            <button onClick={() => navigate('/')} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className="ph-bold ph-caret-left text-2xl"></i></button>
            <img src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`} alt="ARAON" className="h-10 w-auto" />
            <button onClick={() => setIsDark(!isDark)} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i></button>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              {[ { id: 'level', l: '레벨 챔프', i: 'ph-medal' }, { id: 'passion', l: '열정왕', i: 'ph-fire' }, { id: 'hall', l: '전체 랭킹', i: 'ph-trophy' } ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3.5 rounded-2xl text-[11px] font-black transition-all flex flex-col items-center gap-1 border ${activeTab === t.id ? 'bg-[#70011D] text-white border-[#70011D] shadow-lg shadow-[#70011D]/20' : 'bg-white dark:bg-[#1C1C1E] text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                  <i className={`ph-bold ${t.i} text-xl`}></i>{t.l}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'level' && (
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(LEVEL_CONFIG).map((lvl) => (
                  <button 
                    key={lvl.title} 
                    onClick={() => setSelectedLevel(lvl.title)} 
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border leading-tight flex flex-col items-center justify-center gap-0.5 h-12 ${selectedLevel === lvl.title ? 'bg-[#70011D] text-white border-[#70011D] shadow-md' : 'bg-white dark:bg-[#1C1C1E] text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}
                  >
                    <span className="truncate w-full text-center">{lvl.subTitle.split(' (')[0]}</span>
                    {lvl.subTitle.includes('(') && (
                      <span className={`text-[7px] font-medium opacity-70 truncate w-full text-center ${selectedLevel === lvl.title ? 'text-white/80' : 'text-zinc-400'}`}>
                        ({lvl.subTitle.split(' (')[1]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {lastWeekTop3.length > 0 && (
            <div className="mb-8 p-5 rounded-3xl bg-gradient-to-br from-[#70011D]/5 to-transparent border border-[#70011D]/10 dark:border-[#70011D]/20">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-[11px] font-black text-[#70011D] flex items-center gap-2 uppercase tracking-tight">
                  <i className="ph-fill ph-crown text-lg"></i> 지난주 {getTabLabel(activeTab)} Top 3
                </h2>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 items-end opacity-80">
                  {[1, 2, 3, 4, 5, 10].map(r => {
                    const b = getRankBadge(r, activeTab);
                    if (!b) return null;
                    const label = r === 10 ? 'TOP 10' : r === 5 ? 'TOP 5' : `${r}${r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'}`;
                    return (
                      <div key={r} className="flex items-center gap-1.5 text-[7px] font-black text-[#70011D]">
                        <span className="opacity-40">{label}</span>
                        <span>{b.emoji}</span>
                        <span className="tracking-tighter">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center items-end gap-3 px-2 min-h-[140px]">
                {[lastWeekTop3[1], lastWeekTop3[0], lastWeekTop3[2]].map((user, idx) => {
                  if (!user) return <div key={`empty-${idx}`} className="flex-1"></div>;
                  const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                  const isFirst = rank === 1;
                  const isThird = rank === 3;
                  const getTabEmoji = (r) => {
                    if (activeTab === 'passion') return r === 1 ? '🐐' : r === 2 ? '🔥' : '⚡';
                    if (activeTab === 'level') return r === 1 ? '💎' : r === 2 ? '🏅' : '🛡️';
                    return r === 1 ? '👑' : r === 2 ? '🥈' : '🥉';
                  };

                  return (
                    <div key={user.id} className="flex-1 flex flex-col items-center">
                      <div className="flex flex-col items-center mb-2">
                        <span className={`${isFirst ? 'text-3xl' : 'text-2xl'} mb-1 ${isFirst ? 'animate-bounce' : ''}`}>{getTabEmoji(rank)}</span>
                        <span className={`text-[11px] font-bold truncate w-full text-center px-1 mb-2 ${isFirst ? 'text-[#70011D]' : 'text-zinc-500 dark:text-zinc-400'}`}>{user.name}</span>
                      </div>
                      <div className={`w-full flex flex-col items-center justify-center bg-white dark:bg-[#252528] rounded-t-2xl border border-b-0 shadow-sm gap-0.5 ${
                        activeTab === 'hall' 
                          ? (isFirst ? 'h-32 border-[#70011D]' : isThird ? 'h-16 border-zinc-200 dark:border-zinc-700' : 'h-24 border-zinc-200 dark:border-zinc-700')
                          : (isFirst ? 'h-20 border-[#70011D]' : isThird ? 'h-8 border-zinc-200 dark:border-zinc-700' : 'h-14 border-zinc-200 dark:border-zinc-700')
                      }`}>
                        {activeTab === 'hall' && (
                          <div className="flex flex-col items-center opacity-70">
                            <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">{user.lastWeekTime} 분</span>
                            <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">{user.lastWeekWords} 단어</span>
                            <div className="w-4 h-[1px] bg-[#70011D]/10 my-1"></div>
                          </div>
                        )}
                        <span className={`text-[11px] font-black ${rank === 1 ? 'text-gold-metallic animate-shine' : rank === 2 ? 'text-silver-metallic animate-shine' : 'text-bronze-metallic animate-shine'}`}>
                          {user.lastWeekScore}{activeTab === 'passion' ? ' 분' : activeTab === 'hall' ? ' p' : ' 단어'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-6">{renderMyRankCard()}</div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center text-zinc-300 dark:text-zinc-700 font-black text-[10px] tracking-[0.4em] uppercase animate-pulse">Syncing...</div>
            ) : rankings.length > 0 ? (
              rankings.map((user) => {
                const badge = getRankBadge(user.lastWeekRank, activeTab);
                return (
                  <div key={user.id} className={`p-4 border rounded-2xl flex items-center justify-between bg-white dark:bg-[#1C1C1E] border-zinc-100 dark:border-zinc-800 shadow-sm transition-all ${auth.currentUser?.email === user.id ? 'ring-4 ring-amber-400/10' : ''}`}>
                    <div className="flex items-center gap-5">
                      <div className="w-8 h-8 flex items-center justify-center font-black italic">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : <span className="text-[#70011D] opacity-50 text-sm not-italic">{user.rank < 10 ? `0${user.rank}` : user.rank}</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold dark:text-white">{user.name}</span>
                          
                          {activeTab === 'hall' && (
                            <>
                              {user.lastWeekRank === 1 && <span className="text-[14px] animate-bounce">👑</span>}
                              {user.lastWeekRank === 2 && <span className="text-[14px]">🥈</span>}
                              {user.lastWeekRank === 3 && <span className="text-[14px]">🥉</span>}
                            </>
                          )}
                          
                          {badge && (
                            <div className={`flex items-center gap-1 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 ${badge.isSmall ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
                              {badge.emoji && <span className={`${badge.isSmall ? 'text-[10px]' : 'text-[12px]'}`}>{badge.emoji}</span>}
                              <span 
                                className={`${badge.isSmall ? 'text-[8.5px]' : 'text-[10px]'} font-black tracking-tighter ${badge.style || ''} ${badge.animate ? 'animate-shine' : ''}`}
                                style={!badge.style && badge.color ? { 
                                  color: badge.animate ? 'transparent' : badge.color,
                                  background: badge.animate ? `linear-gradient(110deg, ${badge.color} 20%, #FFFFFF 40%, ${badge.color} 50%, #FFFFFF 70%, ${badge.color} 80%)` : 'none',
                                  WebkitBackgroundClip: badge.animate ? 'text' : 'none'
                                } : {}}
                              >
                                {badge.label}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter mt-0.5">
                          {user.score}{activeTab === 'passion' ? ' 분' : activeTab === 'hall' ? ' p' : ' 단어'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : <div className="py-24 text-center bg-white dark:bg-[#1C1C1E] rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800"><p className="text-zinc-300 dark:text-zinc-700 font-bold text-xs uppercase tracking-widest">No Active Records</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;
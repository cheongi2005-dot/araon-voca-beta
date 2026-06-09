import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import LoadingScreen from '../components/LoadingScreen';

const StudentDashboardMobile = () => {
  // --- STATE MANAGEMENT ---
  const [student, setStudent] = useState(() => {
    try {
      const cached = localStorage.getItem('araon_cached_user');
      return cached ? { id: JSON.parse(cached).email, ...JSON.parse(cached) } : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('araon_cached_user'));
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const navigate = useNavigate();

  const MISTAKE_NOTE_COLOR = '#70011D'; 

  // --- DARK MODE ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.email);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const freshData = { id: docSnap.id, ...docSnap.data() };
            setStudent(freshData);
            localStorage.setItem('araon_cached_user', JSON.stringify(freshData));
          } else {
            console.warn("해당 이메일의 문서가 Firestore에 없습니다:", user.email);
          }
        } catch (error) {
          console.error("데이터 로드 오류:", error);
        } finally {
          setLoading(false);
        }
      } else {
        const timer = setTimeout(() => {
          if (!auth.currentUser) {
            setLoading(false);
            navigate('/');
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // --- EARLY RETURNS ---
  if (loading) {
    return <LoadingScreen />;
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-[#0A0A0B] bg-[#F8F9FA] p-4">
        <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl shadow-sm text-center border border-slate-100 dark:border-zinc-800">
          <i className="ph-fill ph-warning-circle text-4xl text-rose-500 mb-3"></i>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">데이터를 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
            로그인한 이메일과 일치하는 학생 정보가<br/>데이터베이스에 존재하지 않습니다.
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

  // --- HELPERS ---
  const getMethodInKorean = (method) => {
    if (method === 'choice') return '4지선다';
    if (method === 'letter') return '철자 채우기';
    if (method === 'full') return '전체 받아쓰기';
    if (method === 'subjective') return '주관식';
    return method || '';
  };

  const getLevelNameInKorean = (lvlId) => {
    if (!lvlId || lvlId.toLowerCase() === 'all') return '전체 레벨';
    const id = lvlId.toLowerCase().replace(/_/g, '-');
    
    if (id.includes('elementary-100')) return '초등 기초 100';
    if (id.includes('level-1')) return '초등 필수';
    if (id.includes('level-2')) return '중등 기초';
    if (id.includes('level-3')) return '중등 심화';
    if (id.includes('level-4')) return '고등 기초';
    if (id.includes('level-5')) return '고등 심화';
    
    return lvlId; 
  };

  const getDotColor = (activityData) => {
    if (activityData?.type?.includes('오답노트')) return MISTAKE_NOTE_COLOR;
    let levelKey = activityData?.levelId;
    if (levelKey && LEVEL_CONFIG[levelKey.toLowerCase()]) {
      return LEVEL_CONFIG[levelKey.toLowerCase()].color;
    }
    return '#cbd5e1';
  };

  // --- HELPERS ---
  // Firebase Timestamp, ISO 문자열, seconds 객체 등 모든 날짜 형식을 안전하게 파싱
  const parseDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
    if (value.seconds != null) return new Date(value.seconds * 1000); // { seconds, nanoseconds }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  // --- STATS LOGIC ---
  const getWeekBoundaries = (offset) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (offset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  const calculateDailyStats = (studentData, weekStart, weekEnd) => {
    const dailyStats = Array(7).fill(null).map((_, i) => ({
      dayIndex: i, totalWords: 0, totalTime: 0, levelCounts: {} 
    }));
    
    if (!studentData?.attendance) return dailyStats;

    // 🎯 날짜 비교를 위해 시각 정보가 없는 Date 객체 생성
    const wStart = new Date(weekStart); wStart.setHours(0,0,0,0);
    const wEnd = new Date(weekEnd); wEnd.setHours(23,59,59,999);
    
    console.log(`[Dashboard Debug] ${wStart.toLocaleDateString()} ~ ${wEnd.toLocaleDateString()} 사이의 데이터를 검색합니다.`);

    const normalizedAttendance = studentData.attendance.map(record => {
      if (typeof record === 'string') {
        const parts = record.split(' (');
        return { 
          date: parts[0], 
          type: parts[1]?.replace(')', '') || '', 
          isLegacy: true 
        };
      }
      return record;
    });

    let matchedCount = 0;

    normalizedAttendance.forEach(activity => {
      if (!activity || !activity.date) return;
      const activityDate = parseDate(activity.date);
      if (!activityDate) return;
      
      // 🎯 시각에 상관없이 해당 주의 범위 안에 있는지 확인
      if (activityDate >= wStart && activityDate <= wEnd) {
        matchedCount++;
        const dayIndex = activityDate.getDay();
        
        // 🎯 '문제풀이'라는 단어가 포함된 모든 활동을 문제풀이로 인식 (오답노트 문제풀이 포함)
        const isProblemSolving = activity.type && String(activity.type).includes('문제풀이');

        if (isProblemSolving && typeof activity.score === 'number') {
          dailyStats[dayIndex].totalWords += activity.score;
          
          // 🎯 레벨별 카운트 (lvlId 추출 로직 개선)
          let lvlId = activity.levelId ? String(activity.levelId).toLowerCase() : 'unknown';
          if (String(activity.type).includes('오답노트')) lvlId = 'mistake';
          
          dailyStats[dayIndex].levelCounts[lvlId] = (dailyStats[dayIndex].levelCounts[lvlId] || 0) + activity.score;
        }

        // 학습 시간 기록 (단어학습 및 모든 문제풀이 포함)
        if (activity.type && (String(activity.type).includes('단어학습') || isProblemSolving)) {
          dailyStats[dayIndex].totalTime += (activity.studyTime || 1);
        }
      }
    });

    console.log(`[Dashboard Debug] 총 ${normalizedAttendance.length}개 중 ${matchedCount}개의 활동이 이번 주에 해당됩니다.`);
    return dailyStats;
  };

  const getActivitiesForDay = (activityKey, dayIndex, weekStart) => {
    if (!student?.attendance) return [];
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + dayIndex);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const rawActivities = student.attendance
      .map(record => {
        if (typeof record === 'string') {
          const parts = record.split(' (');
          return { 
            date: parts[0], 
            type: parts[1]?.replace(')', '') || '', 
            isLegacy: true,
            score: undefined 
          };
        }
        return record;
      })
      .filter(record => {
        if (!record || !record.type) return false;

        // 🎯 1. 날짜 필터링 (해당 요일의 시작과 끝 범위 내에 있는지 확인)
        const recordDate = parseDate(record.date);
        if (!recordDate || !(recordDate >= dayStart && recordDate <= dayEnd)) return false;

        // 🎯 2. 활동 유형 필터링
        if (activityKey === '문제풀이') {
          return record.type.includes('문제풀이');
        }
        
        if (activityKey === '오답노트') {
          return record.type.includes('오답노트');
        }
        
        if (activityKey === '단어학습') {
          return record.type === '단어학습';
        }

        return record.type.includes(activityKey);
      });

    const seen = new Map();
    
    rawActivities.forEach(activity => {
      const uniqueKey = `${activity.type}-${activity.day || ''}-${activity.method || ''}-${activity.levelId || ''}`;
      
      if (!seen.has(uniqueKey)) {
        seen.set(uniqueKey, { ...activity, count: 1 });
      } else {
        const existing = seen.get(uniqueKey);
        const newCount = existing.count + 1;
        
        if (activity.score !== undefined && existing.score === undefined) {
          seen.set(uniqueKey, { ...activity, count: newCount });
        } else {
          seen.set(uniqueKey, { ...existing, count: newCount });
        }
      }
    });

    return Array.from(seen.values()).reverse();
  };

  // --- CALCULATION PREPARATION ---
  const { startOfWeek, endOfWeek } = getWeekBoundaries(weekOffset);
  const dailyStats = calculateDailyStats(student, startOfWeek, endOfWeek);
  
  const weeklyTotalWords = dailyStats.reduce((acc, cur) => acc + (cur?.totalWords || 0), 0);
  const weeklyTotalTime = dailyStats.reduce((acc, cur) => acc + (cur?.totalTime || 0), 0);
  
  const maxWordsInWeek = Math.max(...dailyStats.map(d => d?.totalWords || 0), 1);
  const maxTimeInWeek = Math.max(...dailyStats.map(d => d?.totalTime || 0), 1);

  const currentLevelConfig = student?.currentLevel ? LEVEL_CONFIG[student.currentLevel.toLowerCase()] : null;
  const themeColor = currentLevelConfig ? currentLevelConfig.color : '#4F46E5';
  const timeBarColor = '#34D399';

  const getDominantLevelColor = () => {
    const weeklyLevelCounts = {};
    dailyStats.forEach(stat => {
      if(stat?.levelCounts) {
        Object.entries(stat.levelCounts).forEach(([lvlId, count]) => {
          if (!weeklyLevelCounts[lvlId]) weeklyLevelCounts[lvlId] = 0;
          weeklyLevelCounts[lvlId] += count;
        });
      }
    });
    let maxCount = -1;
    let dominantLvl = null;
    Object.entries(weeklyLevelCounts).forEach(([lvlId, count]) => {
      if (count > maxCount) { maxCount = count; dominantLvl = lvlId; }
    });
    if (dominantLvl && LEVEL_CONFIG[dominantLvl]) {
      return LEVEL_CONFIG[dominantLvl].color;
    }
    return themeColor;
  };

  const legendWordColor = getDominantLevelColor();
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] p-4 font-sans antialiased transition-colors duration-500 pb-12" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
      <div className="max-w-md mx-auto">
        
          <header className="flex justify-between items-center mb-8 pt-2 px-1">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')} 
                className="p-2.5 bg-white dark:bg-[#1E1E1E] text-slate-400 dark:text-zinc-400 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-95 transition-all"
              >
                <i className="ph-bold ph-arrow-left text-lg"></i>
              </button>
              
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                  나의 학습 리포트
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                  {student?.name || '학생'} 
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-3 bg-white dark:bg-[#1E1E1E] text-slate-500 dark:text-zinc-400 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 active:scale-90 transition-all"
            >
              <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-xl`}></i>
            </button>
          </header>

        {/* SECTION 1: 주간 학습 성과 */}
        <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl shadow-sm border border-indigo-50 dark:border-zinc-800/50 mb-4 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
              <i className="ph-fill ph-presentation-chart text-indigo-500 text-lg"></i> 주간 성과
            </h3>
            <div className="flex gap-1.5">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg dark:text-zinc-400 active:scale-90 transition-all"><i className="ph-bold ph-arrow-left text-sm"></i></button>
              <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg dark:text-zinc-400 disabled:opacity-20 active:scale-90 transition-all"><i className="ph-bold ph-arrow-right text-sm"></i></button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mb-3 px-1">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: legendWordColor }}></div>
              <span className="text-[10px] font-bold text-slate-500">단어</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: timeBarColor }}></div>
              <span className="text-[10px] font-bold text-slate-500">시간</span>
            </div>
          </div>

          <div className="flex justify-between items-end h-32 mb-3 px-1">
            {dailyStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-end h-full w-[12%]">
                <div className="flex items-end gap-0.5 h-full pb-1 w-full justify-center">
                  <div
                    className="w-2.5 rounded-t-sm flex flex-col-reverse overflow-hidden transition-all duration-700 bg-slate-100/50 dark:bg-zinc-800"
                    style={{ height: `${(stat?.totalWords / maxWordsInWeek) * 100 || 0}%` }}
                  >
                    {stat?.levelCounts && Object.entries(stat.levelCounts).map(([lvlId, score]) => (
                      <div
                        key={lvlId}
                        style={{
                          height: `${stat.totalWords > 0 ? (score / stat.totalWords) * 100 : 0}%`,
                          backgroundColor: lvlId === 'mistake' ? MISTAKE_NOTE_COLOR : (LEVEL_CONFIG[lvlId]?.color || themeColor),
                          width: '100%'
                        }}
                      />
                    ))}
                  </div>
                  <div
                    className="w-2.5 rounded-t-sm transition-all duration-700"
                    style={{
                      height: `${(stat?.totalTime / maxTimeInWeek) * 100 || 0}%`,
                      backgroundColor: timeBarColor
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between border-t border-slate-100 dark:border-zinc-800/50 pt-2 px-1">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="text-[10px] font-black text-slate-400 dark:text-zinc-500 w-[12%] text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-slate-50 dark:bg-[#252527] p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1">Weekly Word</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{weeklyTotalWords}<span className="text-[10px] ml-0.5 font-bold">개</span></p>
            </div>
            <div className="bg-emerald-50/40 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/20 flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Weekly Time</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{weeklyTotalTime}<span className="text-[10px] ml-0.5 font-bold">분</span></p>
            </div>
          </div>
        </div>

        {/* SECTION 2: 주간 활동 현황 */}
        <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-3xl shadow-sm border border-indigo-50 dark:border-zinc-800/50 transition-all">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 mb-5">
            <i className="ph-fill ph-list-dashes text-indigo-500 text-lg"></i> 상세 활동 내역
          </h3>
          
          <div className="flex flex-col gap-3">
            {daysOfWeek.map((dayName, dayIndex) => {
              const wordActivities = getActivitiesForDay('단어학습', dayIndex, startOfWeek);
              const solveActivities = getActivitiesForDay('문제풀이', dayIndex, startOfWeek);
              const mistakeActivities = getActivitiesForDay('오답노트', dayIndex, startOfWeek);
              
              const hasActivity = wordActivities.length > 0 || solveActivities.length > 0 || mistakeActivities.length > 0;

              return (
                <div key={dayIndex} className="bg-slate-50 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{dayName}요일</span>
                    {!hasActivity && <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold">활동 없음</span>}
                  </div>
                  
                    {hasActivity && (
                      <div className="flex flex-col gap-2">
                        {/* 1. 단어학습 */}
                        {wordActivities.map((act, i) => (
                          <div key={`word-${i}`} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getDotColor(act) }}></div>
                            <span className="text-[11px] font-bold text-slate-500 w-12">단어학습</span>
                            <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                              {act.day ? `Day ${act.day}` : '학습완료'} 
                              {act.count > 1 && <span className="ml-1 text-indigo-500 font-black">({act.count})</span>}
                            </span>
                          </div>
                        ))}
                        {/* 2. 문제풀이 */}
                        {solveActivities.map((act, i) => {
                          if (act.type?.includes('오답')) return null;
                          return (
                            <div key={`solve-${i}`} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getDotColor(act) }}></div>
                              <span className="text-[11px] font-bold text-slate-500 w-12">문제풀이</span>
                              <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                                {/* 🎯 Day 표시 추가! */}
                                {act.day && <span className="mr-1 font-bold text-slate-500 dark:text-zinc-500">Day {act.day}</span>}
                                {act.method ? `${getMethodInKorean(act.method)} ` : ''}
                                {act.score !== undefined ? `${act.score}/${act.total || '?'}` : (act.isLegacy ? '완료' : '')}
                                {act.count > 1 && <span className="ml-1 text-indigo-500 font-black">({act.count})</span>}
                              </span>
                            </div>
                          )
                        })}

                        {/* 3. 오답노트 */}
                        {mistakeActivities.map((act, i) => {
                          const levelDisplayName = getLevelNameInKorean(act.levelId);

                          return (
                            <div key={`mistake-${i}`} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getDotColor(act) }}></div>
                              <span className="text-[11px] font-bold text-slate-500 w-12">오답노트</span>
                              
                              <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                                {levelDisplayName && <span className="mr-1 font-bold text-slate-500 dark:text-zinc-500">[{levelDisplayName}]</span>}
                                {act.method ? `${getMethodInKorean(act.method)} ` : ''}
                                {act.score !== undefined ? `${act.score}/${act.total || '?'}` : '학습완료'}
                                {act.count > 1 && <span className="ml-1 text-indigo-500 dark:text-indigo-400 font-black">({act.count})</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[9px] font-bold text-slate-400 dark:text-zinc-600 pt-4 border-t border-slate-100 dark:border-zinc-800/50">
             {Object.values(LEVEL_CONFIG).map(l => (
               <div key={l.id} className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }}></div>
                 <span>{l.subTitle}</span>
               </div>
             ))}
             <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MISTAKE_NOTE_COLOR }}></div>
               <span>오답노트</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboardMobile;
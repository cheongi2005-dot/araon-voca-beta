import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp, increment, arrayUnion } from "firebase/firestore";
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useStorage } from '../hooks/useStorage';
import { useSpeech } from '../hooks/useSpeech';
import QuizEngine from '../components/QuizEngine';
import LoadingScreen from '../components/LoadingScreen';
import { useTheme } from '../hooks/useTheme';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { migrateAttempts, getMistakeWords } from '../utils/mistakes';

const LevelTemplate = () => {
  const { levelId: rawLevelId } = useParams();
  const levelId = useMemo(() => rawLevelId?.toLowerCase() || '', [rawLevelId]);
  const navigate = useNavigate();
  const { speak } = useSpeech();

  const config = useMemo(() => LEVEL_CONFIG[levelId] || null, [levelId]);
  const [loadedData, setLoadedData] = useState({ data: null, titles: null });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSyncLoading, setIsSyncLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useTheme();
  const [view, setView] = useState('home');
  const [selectedDay, setSelectedDay] = useState(null);
  const [quizMode, setQuizMode] = useState('choice');
  const [finalScore, setFinalScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const [dayHistory, setDayHistory] = useState({});
  const [quizSettings, setQuizSettings] = useState({ sound: true, emoji: true });

  const { addMistake, saveProgress } = useStorage(config?.key || 'default');

  useEffect(() => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribeSnapshot = onSnapshot(doc(db, "users", user.email), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setStudentData(userData);
            
            if (userData.settings) {
              setQuizSettings({
                sound: userData.settings.quizSound ?? true,
                emoji: userData.settings.quizEmoji ?? true
              });
            }

            setIsSyncLoading(false);

            if (config?.key) {
              const dbLevelData = userData.levelProgress?.[config.key] || {};
              const localLevelData = safeGetItem(config.key, {});

              const dbTime = dbLevelData.lastUpdated || 0;
              const localTime = localLevelData.lastUpdated || 0;
              const rawData = Object.keys(dbLevelData).length > 0
                ? (dbTime >= localTime ? dbLevelData : localLevelData)
                : localLevelData;

              const finalData = JSON.parse(JSON.stringify(rawData));
              Object.keys(finalData).forEach(dayKey => {
                if (dayKey === 'lastUpdated') return;
                const day = finalData[dayKey];
                if (day?.attempts !== undefined) day.attempts = migrateAttempts(day.attempts);
              });

              const hasCompletedDays = Object.keys(finalData).some(k => k !== 'lastUpdated' && finalData[k]?.completed);
              if (!hasCompletedDays && Array.isArray(userData.attendance)) {
                userData.attendance.forEach(record => {
                  if (typeof record === 'string' || !record.day) return;
                  if (!String(record.type || '').includes('문제풀이')) return;
                  if (String(record.levelId || '').toLowerCase() !== levelId.toLowerCase()) return;
                  const day = String(record.day);
                  if (!finalData[day]) finalData[day] = {};
                  finalData[day].completed = true;
                  const s = Number(record.score || 0);
                  finalData[day].bestScore = Math.max(finalData[day].bestScore || 0, s);
                  if (record.method) {
                    if (!finalData[day].scores) finalData[day].scores = {};
                    finalData[day].scores[record.method] = Math.max(finalData[day].scores[record.method] || 0, s);
                  }
                });
              }

              safeSetItem(config.key, JSON.stringify(finalData));
              setDayHistory(finalData);
            }
          } else {
            setIsSyncLoading(false);
          }
        });
      } else {
        setIsSyncLoading(false);
        navigate('/');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.key, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!config) return;
      setIsDataLoading(true);
      try {
        const module = await config.loadData();
        if (isMounted) {
          setLoadedData({ data: module.DATA_BY_DAY, titles: module.DAY_TITLES });
          setIsDataLoading(false);
          setStartTime(Date.now()); 
        }
      } catch (error) {
        console.error("Data load error:", error);
        if (isMounted) setIsDataLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [config]);

  const dayKeys = useMemo(() => {
    if (!loadedData.titles) return [];
    return Object.keys(loadedData.titles).sort((a, b) => Number(a) - Number(b));
  }, [loadedData.titles]);

  const todayLevelRecord = useMemo(() => {
    if (!studentData?.attendance) return null;
    const todayStr = new Date().toLocaleDateString();
    return [...studentData.attendance].reverse().find(record => {
      const recordDate = new Date(record.date).toLocaleDateString();
      return recordDate === todayStr && String(record.levelId) === String(levelId) && record.type === "문제풀이";
    });
  }, [studentData, levelId]);

  const topDay = useMemo(() => {
    if (dayKeys.length === 0) return null;
    if (todayLevelRecord && todayLevelRecord.day) return String(todayLevelRecord.day);
    
    const firstIncomplete = dayKeys.find(d => {
      const record = dayHistory[String(d)] || dayHistory[Number(d)];
      return !record?.completed;
    });
    return String(firstIncomplete || dayKeys[dayKeys.length - 1]);
  }, [dayKeys, todayLevelRecord, dayHistory]);

  const isFinishedToday = !!todayLevelRecord;
  const remainingDays = useMemo(() => dayKeys.filter(d => String(d) !== String(topDay)), [dayKeys, topDay]);
  
  const completedDaysCount = useMemo(() => {
    return Object.keys(dayHistory).filter(key => {
      return !isNaN(Number(key)) && (dayHistory[key]?.completed);
    }).length;
  }, [dayHistory]);

  const recordActivity = async (type, score = null, total = null, method = null, localSyncData = null, improvement = 0) => {
    if (!auth.currentUser) return;
    
    const effectiveStartTime = startTime || (Date.now() - 60000); 
    const duration = Math.max(1, Math.round((Date.now() - effectiveStartTime) / 60000));
    const user = auth.currentUser;
    const activityLabel = type === 'quiz' ? "문제풀이" : "단어학습";
    const numericScore = Number(score || 0);
    const numericImprovement = Number(improvement || 0);
    const levelKey = levelId.replace(/-/g, '_');

    try {
      const userRef = doc(db, "users", user.email);
      
      const updateData = {
        "lastActive": serverTimestamp(),
        "lastActivityType": activityLabel,
        "stats.weeklyStudyTime": increment(duration),
        "stats.totalStudyTime": increment(duration),
        [`stats.levels.${levelKey}.weeklyStudyTime`]: increment(duration),
        "attendance": arrayUnion({
          date: new Date().toISOString(),
          type: activityLabel,
          levelId: String(levelId),
          day: String(selectedDay),
          studyTime: duration,
          ...(type === 'quiz' && { score: numericScore, total: Number(total || 0), method })
        })
      };

      if (type === 'quiz') {
        updateData["currentLevel"] = config.title;
        updateData["currentDay"] = `Day ${selectedDay}`;
        updateData["lastScore"] = numericScore;
        updateData["stats.weeklyWords"] = increment(numericImprovement);
        updateData["stats.totalWords"] = increment(numericImprovement);
        updateData[`stats.levels.${levelKey}.weeklyWords`] = increment(numericImprovement);
      }

      if (localSyncData && config?.key && selectedDay) {
        const dayData = localSyncData[selectedDay]
          ? JSON.parse(JSON.stringify(localSyncData[selectedDay]))
          : {};
        updateData[`levelProgress.${config.key}.${selectedDay}`] = dayData;
        updateData[`levelProgress.${config.key}.lastUpdated`] = Date.now();
      }
      
      await setDoc(userRef, updateData, { merge: true });
      setStartTime(Date.now());
      
    } catch (err) { 
      console.error("❌ 데이터 기록 실패:", err); 
    }
  };

  if (!config) return <div className="p-10 text-center dark:text-white">레벨 정보를 찾을 수 없습니다.</div>;
  if (isDataLoading || isSyncLoading) return <LoadingScreen />;

  const currentDayData = selectedDay ? (loadedData.data?.[selectedDay] || []) : [];
  const dayMistakes = selectedDay ? getMistakeWords(dayHistory[selectedDay]?.attempts) : [];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <header className="sticky top-0 z-20 flex flex-col border-b border-black/10 shadow-sm transition-colors" style={{ backgroundColor: config.color, paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
        <div className="flex-1 flex items-center px-4 justify-between w-full h-16">
          <button onClick={() => view === 'home' ? navigate('/') : setView(view === 'quiz' ? 'modeSelect' : 'home')} className="p-2 text-white"><i className="ph-bold ph-caret-left text-2xl"></i></button>
          <img src={`${process.env.PUBLIC_URL}/Araon_logo_b.png`} alt="ARAON" className="h-7 mx-auto invert brightness-200" />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-white"><i className={`ph-bold ${isDarkMode ? 'ph-sun' : 'ph-moon'} text-2xl`}></i></button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {view === 'home' && (
          <div className="animate__animated animate__fadeIn">
            <div className="p-8 rounded-2xl text-white shadow-md mb-8" style={{ backgroundColor: config.color }}>
              <div className="flex justify-between items-center mb-3"><p className="text-white/70 text-[10px] font-bold uppercase">{config.title} Mastery</p><span className="text-xs font-black">{completedDaysCount} / {dayKeys.length} 완료</span></div>
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${(completedDaysCount / dayKeys.length) * 100}%` }}></div></div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 px-2">
                {(() => {
                  const isCompleted = dayHistory[String(topDay)]?.completed || dayHistory[Number(topDay)]?.completed;
                  return (
                    <>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isCompleted ? config.color : '#cbd5e1' }}></div>
                      <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200">{isFinishedToday ? "오늘의 학습 완료! ✨" : "오늘의 학습"}</h2>
                    </>
                  );
                })()}
              </div>
              {(() => {
                const isCompleted = dayHistory[String(topDay)]?.completed || dayHistory[Number(topDay)]?.completed;
                return (
                  <button onClick={() => { setSelectedDay(topDay); setView('dayHome'); setStartTime(Date.now()); }} className="w-full p-6 border-2 rounded-[1.8rem] flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-sm active:scale-[0.98] transition-all relative overflow-hidden" style={{ borderColor: isCompleted ? `${config.color}40` : '#e2e8f0' }}>
                    <div className="flex items-center text-left relative z-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mr-5 text-white font-black text-xl shadow-inner" style={{ backgroundColor: isCompleted ? config.color : '#cbd5e1' }}>D{topDay}</div>
                      <div><h3 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: isCompleted ? config.color : '#94a3b8' }}>{isCompleted ? "Completed" : "Up Next"}</h3><p className="text-lg font-bold tracking-tight dark:text-white">{loadedData.titles[topDay]}</p></div>
                    </div>
                    <i className={`ph-bold ${isCompleted ? 'ph-check-circle' : 'ph-caret-right'} text-2xl`} style={{ color: isCompleted ? config.color : '#cbd5e1' }}></i>
                  </button>
                );
              })()}
            </div>

            <div className="grid gap-4 pb-12">
              {remainingDays.map(d => {
                const isCompleted = dayHistory[String(d)]?.completed || dayHistory[Number(d)]?.completed;
                
                const currentIndex = dayKeys.indexOf(String(d));
                const prevDayKey = currentIndex > 0 ? dayKeys[currentIndex - 1] : null;
                const isPrevCompleted = prevDayKey ? (dayHistory[String(prevDayKey)]?.completed || dayHistory[Number(prevDayKey)]?.completed) : true;
                const isLocked = !isCompleted && !isPrevCompleted;

                return (
                  <button 
                    key={d} 
                    onClick={() => { 
                      if (isLocked) { alert('🔒 이전 Day를 먼저 완료해야 다음 단계로 넘어갈 수 있어요!'); return; }
                      setSelectedDay(d); setView('dayHome'); setStartTime(Date.now()); 
                    }} 
                    className={`w-full p-6 border rounded-2xl flex items-center justify-between shadow-sm transition-all duration-300
                      ${isLocked 
                        ? 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent opacity-60 grayscale' 
                        : 'bg-white dark:bg-[#1E1E1E] border-zinc-100 dark:border-zinc-800 hover:scale-[0.98] active:scale-95'}`}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 text-white font-black 
                          ${isLocked ? 'bg-zinc-300 dark:bg-zinc-700' : ''}`} 
                        style={!isLocked ? { backgroundColor: isCompleted ? config.color : '#cbd5e1' } : {}}
                      >
                        {isLocked ? <i className="ph-fill ph-lock-key text-xl"></i> : `D${d}`}
                      </div>
                      <div className={`font-bold text-[15px] ${isLocked ? 'text-zinc-400 dark:text-zinc-600' : 'dark:text-white/90'}`}>
                        {loadedData.titles[d]}
                      </div>
                    </div>
                    {isCompleted ? (
                      <i className="ph-fill ph-check-circle text-xl" style={{ color: config.color }}></i>
                    ) : isLocked ? (
                      <i className="ph-fill ph-lock text-zinc-300 dark:text-zinc-700 text-xl"></i>
                    ) : (
                      <i className="ph-bold ph-caret-right text-slate-300 text-xl"></i>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'dayHome' && (
          <div className="animate__animated animate__fadeInUp pt-10 text-center">
            <div className="w-20 h-20 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md font-black text-2xl" style={{ backgroundColor: config.color }}>D{selectedDay}</div>
            <h2 className="text-2xl font-bold dark:text-white uppercase mb-10">{loadedData.titles[selectedDay]}</h2>
            <div className="space-y-4">
              <button onClick={() => setView('study')} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-2xl flex items-center shadow-sm" style={{ borderColor: config.color }}><div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${config.color}20`, color: config.color }}><i className="ph-fill ph-book-open text-2xl"></i></div><div className="text-left font-bold dark:text-slate-100">단어 학습</div></button>
              <button onClick={() => setView('modeSelect')} className="w-full p-6 text-white rounded-2xl flex items-center shadow-md" style={{ backgroundColor: config.color }}><div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4"><i className="ph-fill ph-lightning text-2xl"></i></div><div className="text-left font-bold">퀴즈 도전</div></button>
              <button onClick={() => setView('dayMistakes')} disabled={dayMistakes.length === 0} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-2xl flex items-center shadow-sm border-[#70011D]/30 disabled:opacity-50"><div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: '#70011D20', color: '#70011D' }}><i className="ph-fill ph-warning-circle text-2xl"></i></div><div className="text-left font-bold text-[#70011D] flex-1">오답 복습 <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#70011D] text-white rounded-full font-bold">{dayMistakes.length}</span></div></button>
            </div>
          </div>
        )}

        {view === 'modeSelect' && (
          <div className="animate__animated animate__fadeInUp pt-6 space-y-6">
            <div className="text-center"><h2 className="text-xl font-black dark:text-white">퀴즈 모드 선택</h2><p className="text-zinc-400 text-sm mt-1">원하는 스타일로 복습하세요</p></div>
            <div className="space-y-3">
              {[ { id: 'choice', title: '4지선다형', icon: 'ph-list-numbers', color: 'bg-amber-100 text-amber-600' }, { id: 'letter', title: '철자 채우기', icon: 'ph-textbox', color: 'bg-blue-100 text-blue-600' }, { id: 'full', title: '전체 받아쓰기', icon: 'ph-keyboard', color: 'bg-purple-100 text-purple-600' } ].map(m => (
                <button key={m.id} onClick={() => { setShuffledQuestions([...currentDayData].sort(() => Math.random() - 0.5)); setQuizMode(m.id); setView('quiz'); }} className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-2xl`}><i className={`ph-fill ${m.icon}`}></i></div><p className="font-bold dark:text-white">{m.title}</p></div>
                  <div className="text-right"><p className="text-[8px] font-black text-zinc-300 uppercase">Best</p><span className="text-xs font-black text-zinc-400">{dayHistory[selectedDay]?.scores?.[m.id] || 0}/{currentDayData.length}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {(view === 'study' || view === 'dayMistakes') && (
          <div className="animate__animated animate__fadeIn">
            <div className="mb-6 text-center font-bold dark:text-white">{view === 'study' ? `${loadedData.titles[selectedDay]} 단어 학습` : "내 오답 리스트"}</div>
            <div className="space-y-3">
              {(view === 'study' ? currentDayData : currentDayData.filter(i => dayMistakes.includes(i.word))).map((item, i) => (
                <div key={i} className="p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 text-left">{item.emoji && <span className="text-2xl">{item.emoji}</span>}<div><p className="text-xl font-bold dark:text-white">{item.word}</p><p className="text-sm text-zinc-400">{item.meaning}</p></div></div>
                  <button onClick={() => speak(item.word)} className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15`, color: config.color }}><i className="ph-bold ph-speaker-high text-xl"></i></button>
                </div>
              ))}
            </div>
            <button onClick={() => { if(view === 'study') recordActivity('study'); setView('modeSelect'); }} className="w-full p-6 mt-8 rounded-[2rem] font-black text-white shadow-lg" style={{ backgroundColor: config.color }}>학습 완료! 퀴즈 도전하기</button>
          </div>
        )}

        {view === 'quiz' && (
          <QuizEngine 
            questions={shuffledQuestions} 
            mode={quizMode} 
            themeColor={config.color} 
            showEmoji={quizSettings.emoji} 
            useSound={quizSettings.sound}
            onMistake={(q) => addMistake(selectedDay, q.word)} 
            onFinish={(res) => {
              const score = typeof res === 'object' ? res.score : res;
              const prevBest = dayHistory[selectedDay]?.bestScore || 0;
              const improvement = Math.max(0, score - prevBest);

              setFinalScore(score);
              saveProgress(selectedDay, score, currentDayData.length, quizMode);

              const newHistory = { ...dayHistory };
              if (!newHistory[selectedDay]) newHistory[selectedDay] = {};
              newHistory[selectedDay].completed = true;
              newHistory[selectedDay].bestScore = Math.max(prevBest, score);
              setDayHistory(newHistory);

              // 결과 화면 즉시 전환 후 서버 저장 (Firebase 지연이 화면을 막지 않도록)
              setView('result');
              recordActivity('quiz', score, currentDayData.length, quizMode, newHistory, improvement);
          }} />
        )}

        {view === 'result' && (
          <div className="animate__animated animate__fadeIn flex flex-col items-center py-6 text-center">
            {(() => {
              const perf = finalScore / currentDayData.length;
              let msg = perf >= 0.8 ? { t: "WOW!", e: "🥳", c: "완벽하게 마스터했어요!" } : perf >= 0.5 ? { t: "GREAT!", e: "👍", c: "참 잘했어요!" } : { t: "CHEER UP!", e: "💪", c: "조금 더 연습해볼까요?" };
              const currentIndex = dayKeys.indexOf(selectedDay);
              const nextDay = (currentIndex !== -1 && currentIndex + 1 < dayKeys.length) ? dayKeys[currentIndex + 1] : null;
              return (
                <>
                  <div className="w-32 h-32 bg-white dark:bg-[#1E1E1E] rounded-3xl flex items-center justify-center shadow-xl border-2 mb-10" style={{ borderColor: config.color }}><span className="text-7xl">{msg.e}</span></div>
                  <h2 className="text-4xl font-black mb-2 dark:text-white tracking-tighter">{msg.t}</h2><p className="text-zinc-400 font-bold mb-10">{msg.c}</p>
                  <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-sm border mb-10 text-left relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: config.color }}></div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Total Score</p><span className="text-6xl font-black" style={{ color: config.color }}>{finalScore}</span><span className="text-xl font-bold text-zinc-300"> / {currentDayData.length}</span>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-6"><div className="h-full" style={{ width: `${perf * 100}%`, backgroundColor: config.color }}></div></div>
                  </div>
                  <div className="w-full space-y-3">
                    {perf >= 0.8 ? (
                      nextDay ? <button onClick={() => { setSelectedDay(nextDay); setView('dayHome'); setStartTime(Date.now()); }} className="w-full p-6 text-white rounded-[2rem] font-black text-xl shadow-lg" style={{ backgroundColor: config.color }}>다음 Day 도전하기 🚀</button> : <button onClick={() => setView('home')} className="w-full p-6 text-white rounded-[2rem] font-black text-xl shadow-lg" style={{ backgroundColor: config.color }}>레벨 마스터! 목록으로</button>
                    ) : <button onClick={() => navigate('/my-voca')} className="w-full p-6 text-white rounded-[2rem] font-black text-xl shadow-lg" style={{ backgroundColor: '#70011D' }}>나의 단어장에서 복습하기 ✍️</button>}
                    <button onClick={() => setView('home')} className="w-full py-4 text-zinc-400 font-bold text-sm">전체 목록으로 가기</button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

export default LevelTemplate;
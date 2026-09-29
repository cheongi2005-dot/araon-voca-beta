import QuizModeIcon from '../components/QuizModeIcon';
import SpeakerIcon from '../components/SpeakerIcon';
import WordCard, { FavoriteButton, SentenceText, fillSentence } from '../components/WordCard';
import PageTurn from '../components/PageTurn';
import { useFavorites } from '../hooks/useFavorites';
import { useSwipe } from '../hooks/useSwipe';
import AppHeader from '../components/AppHeader';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, updateDoc, serverTimestamp, increment, arrayUnion } from "firebase/firestore";
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useStorage } from '../hooks/useStorage';
import { useSpeech } from '../hooks/useSpeech';
import QuizEngine from '../components/QuizEngine';
import LoadingScreen from '../components/LoadingScreen';
import { useTheme } from '../hooks/useTheme';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { getMistakeWords } from '../utils/mistakes';
import { mergeLevelData } from '../utils/progress';
import { useUserData } from '../contexts/UserDataContext';

const LevelTemplate = () => {
  const { levelId: rawLevelId } = useParams();
  const levelId = useMemo(() => rawLevelId?.toLowerCase() || '', [rawLevelId]);
  const navigate = useNavigate();
  const { speak, prefetchWords } = useSpeech();
  const { isFavorite, toggleFavorite } = useFavorites();

  const config = useMemo(() => LEVEL_CONFIG[levelId] || null, [levelId]);
  const [loadedData, setLoadedData] = useState({ data: null, titles: null });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSyncLoading, setIsSyncLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useTheme();
  const [view, setView] = useState('home');
  const [selectedDay, setSelectedDay] = useState(null);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyDir, setStudyDir] = useState(null); // 'next' | 'prev' — 카드가 들어오는 방향
  const [quizMode, setQuizMode] = useState('choice');
  const [finalScore, setFinalScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData: studentData, isLoading: isUserLoading } = useUserData();
  const [startTime, setStartTime] = useState(null);

  const [dayHistory, setDayHistory] = useState({});
  const [quizSettings, setQuizSettings] = useState({ sound: true, emoji: true });

  const { addMistake, saveProgress } = useStorage(config?.key || 'default');

  const selectDay = useCallback((day) => {
    setSelectedDay(day);
    setView('dayHome');
    setStartTime(Date.now());
    // 단어와 예문의 AI 음성을 미리 받아 둔다 (예문은 speak와 같은 문장이어야 캐시가 맞는다). 단어→예문 순서라 앞 카드부터 준비된다.
    const texts = (loadedData.data?.[day] || []).flatMap(item => item.sentence ? [item.word, fillSentence(item.sentence, item.word)] : [item.word]);
    if (texts.length > 0) prefetchWords(texts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedData.data, prefetchWords]);

  useEffect(() => {
    if (!studentData) {
      if (!isUserLoading) { setIsSyncLoading(false); navigate('/'); }
      return;
    }

    setIsSyncLoading(false); // 로딩 화면 즉시 해제

    if (studentData.settings) {
      setQuizSettings({
        sound: studentData.settings.quizSound ?? true,
        emoji: studentData.settings.quizEmoji ?? true
      });
    }

    if (!config?.key) return;

    const timer = setTimeout(() => { // 데이터 병합은 화면 렌더 후에 처리
      const finalData = mergeLevelData(studentData.levelProgress?.[config.key], safeGetItem(config.key, {}));

      const hasCompletedDays = Object.keys(finalData).some(k => k !== 'lastUpdated' && finalData[k]?.completed);
      if (!hasCompletedDays && Array.isArray(studentData.attendance)) {
        studentData.attendance.forEach(record => {
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
    }, 0);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentData, config?.key, navigate]);

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
        updateData["wrongCount"] = Math.max(0, Number(total || 0) - numericScore);
        updateData["stats.weeklyWords"] = increment(numericImprovement);
        updateData["stats.totalWords"] = increment(numericImprovement);
        updateData[`stats.levels.${levelKey}.weeklyWords`] = increment(numericImprovement);
      }

      // 레벨 전체를 올린다: 로컬은 진입 시 DB와 Day 단위로 합쳐 둔 값이라 DB의 상위 집합이고,
      // 이 기기에만 있던 Day 오답도 같이 올라간다. lastUpdated는 로컬과 같은 값.
      if (localSyncData && config?.key) {
        updateData[`levelProgress.${config.key}`] = localSyncData;
      }

      // ⚠️ setDoc(merge)은 "a.b" 키를 중첩 경로가 아니라 이름에 점이 든 최상위 필드로 저장한다.
      // 점 표기 경로는 updateDoc만 해석한다.
      await updateDoc(userRef, updateData);
      setStartTime(Date.now());
      
    } catch (err) { 
      console.error("❌ 데이터 기록 실패:", err); 
    }
  };

  // 단어 학습 카드: 좌우 스와이프·버튼으로 넘기고, 위로 밀면 단어 리스트(내 단어장과 같은 두 페이지). 마지막 카드에서 '다음'은 퀴즈 버튼만.
  const dayLen = (selectedDay && loadedData.data?.[selectedDay]?.length) || 0;
  const goStudy = (dir) => { setStudyDir(dir); setStudyIndex(i => Math.max(0, Math.min(i + (dir === 'next' ? 1 : -1), dayLen - 1))); };
  const [studyPanel, setStudyPanel] = useState('card'); // 'card' | 'list' — 위아래 스와이프로 오가는 두 페이지
  // '위로 밀면 단어 리스트' 안내: 학습에 들어오면 3초만 보이고 사라짐 (위로 밀기는 계속 됨)
  const [studyHint, setStudyHint] = useState(false);
  useEffect(() => {
    if (view !== 'study') return;
    setStudyHint(true);
    const t = setTimeout(() => setStudyHint(false), 3000);
    return () => clearTimeout(t);
  }, [view, selectedDay]);
  const studySwipe = useSwipe({ onLeft: () => goStudy('next'), onRight: () => goStudy('prev'), onUp: () => setStudyPanel('list') });
  const listSwipe = useSwipe({ onDown: () => setStudyPanel('card') });

  if (!config) return <div className="p-10 text-center dark:text-white">레벨 정보를 찾을 수 없습니다.</div>;
  if (isDataLoading || isSyncLoading) return <LoadingScreen />;

  const currentDayData = selectedDay ? (loadedData.data?.[selectedDay] || []) : [];
  const dayMistakes = selectedDay ? getMistakeWords(dayHistory[selectedDay]?.attempts) : [];
  const cardStudy = currentDayData.length > 0; // 단어 학습은 모든 레벨에서 카드 한 장씩
  const studyPager = view === 'study' && cardStudy; // 스크롤 없는 한 화면: 카드 / 단어 리스트 두 페이지

  return (
    <div className={`${studyPager ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden`}>
      <AppHeader whiteContent={config.id === '05' || config.id === '06'} themeColor={config.color} isDark={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} onBack={() => view === 'home' ? navigate('/') : setView(view === 'quiz' ? 'modeSelect' : 'home')} />

      <main className={`flex-1 p-6 ${studyPager ? 'min-h-0 overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`} style={studyPager ? { paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' } : undefined}>
        {view === 'home' && (
          <div className="animate__animated animate__fadeIn">
            <div className="p-8 rounded-lg text-white shadow-none mb-8" style={{ backgroundColor: config.color }}>
              <div className="flex justify-between items-center mb-3"><p className="text-white/70 text-[10px] font-bold uppercase">{config.title} Mastery</p><span className="text-xs font-bold">{completedDaysCount} / {dayKeys.length} 완료</span></div>
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-1000" style={{ width: `${(completedDaysCount / dayKeys.length) * 100}%` }}></div></div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 px-2">
                {(() => {
                  const isCompleted = dayHistory[String(topDay)]?.completed || dayHistory[Number(topDay)]?.completed;
                  return (
                    <>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isCompleted ? config.color : '#cbd5e1' }}></div>
                      <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{isFinishedToday ? "오늘의 학습 완료! ✨" : "오늘의 학습"}</h2>
                    </>
                  );
                })()}
              </div>
              {(() => {
                const isCompleted = dayHistory[String(topDay)]?.completed || dayHistory[Number(topDay)]?.completed;
                return (
                  <button onClick={() => selectDay(topDay)} className="w-full p-6 border-2 rounded-lg flex items-center justify-between bg-white dark:bg-[#1E1E1E] shadow-none active:opacity-80 transition-all relative overflow-hidden" style={{ borderColor: isCompleted ? `${config.color}40` : '#e2e8f0' }}>
                    <div className="flex items-center text-left relative z-10">
                      <div className="w-14 h-14 rounded-lg flex items-center justify-center mr-5 text-white font-bold text-xl shadow-inner" style={{ backgroundColor: isCompleted ? config.color : '#cbd5e1' }}>D{topDay}</div>
                      <div><h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: isCompleted ? config.color : '#94a3b8' }}>{isCompleted ? "Completed" : "Up Next"}</h3><p className="text-lg font-bold tracking-tight dark:text-white">{loadedData.titles[topDay]}</p></div>
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
                      selectDay(d);
                    }} 
                    className={`w-full p-6 border rounded-lg flex items-center justify-between shadow-none transition-all duration-300
                      ${isLocked 
                        ? 'bg-zinc-50 dark:bg-zinc-900/50 border-transparent opacity-60 grayscale' 
                        : 'bg-white dark:bg-[#1E1E1E] border-zinc-100 dark:border-zinc-800 hover:scale-[0.98] active:scale-95'}`}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 text-white font-bold 
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
            <div className="w-20 h-20 text-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-none font-bold text-2xl" style={{ backgroundColor: config.color }}>D{selectedDay}</div>
            <h2 className="text-2xl font-bold dark:text-white uppercase mb-10">{loadedData.titles[selectedDay]}</h2>
            <div className="space-y-4">
              <button onClick={() => { setStudyIndex(0); setStudyDir(null); setStudyPanel('card'); setView('study'); }} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-lg flex items-center shadow-none" style={{ borderColor: config.color }}><div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${config.color}20`, color: config.color }}><i className="ph-fill ph-book-open text-2xl"></i></div><div className="text-left font-bold dark:text-slate-100">단어 학습</div></button>
              <button onClick={() => setView('modeSelect')} className="w-full p-6 text-white rounded-lg flex items-center shadow-none" style={{ backgroundColor: config.color }}><div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4"><i className="ph-fill ph-lightning text-2xl"></i></div><div className="text-left font-bold">퀴즈 도전</div></button>
              <button onClick={() => setView('dayMistakes')} disabled={dayMistakes.length === 0} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-lg flex items-center shadow-none border-[#70011D]/30 disabled:opacity-50"><div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: '#70011D20', color: '#70011D' }}><i className="ph-fill ph-warning-circle text-2xl"></i></div><div className="text-left font-bold text-[#70011D] flex-1">오답 복습 <span className="ml-2 text-[10px] px-2 py-0.5 bg-[#70011D] text-white rounded-full font-bold">{dayMistakes.length}</span></div></button>
            </div>
          </div>
        )}

        {view === 'modeSelect' && (
          <div className="animate__animated animate__fadeInUp pt-6 space-y-6">
            <div className="text-center"><h2 className="text-xl font-bold dark:text-white">퀴즈 모드 선택</h2><p className="text-zinc-400 text-sm mt-1">원하는 스타일로 복습하세요</p></div>
            <div className="space-y-3">
              {[ { id: 'choice', title: '4지선다형', icon: 'ph-list-numbers', color: 'bg-amber-100 text-amber-600' }, { id: 'letter', title: '철자 채우기', icon: 'ph-textbox', color: 'bg-blue-100 text-blue-600' }, { id: 'full', title: '전체 받아쓰기', icon: 'ph-keyboard', color: 'bg-purple-100 text-purple-600' } ].map(m => (
                <button key={m.id} onClick={() => { if (currentDayData.length === 0) { alert('⚠️ 문제 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'); return; } setShuffledQuestions([...currentDayData].sort(() => Math.random() - 0.5)); setQuizMode(m.id); setView('quiz'); }} className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-lg border flex items-center justify-between shadow-none">
                  <div className="flex items-center gap-5"><div className={`w-12 h-12 rounded-lg ${m.color} flex items-center justify-center text-2xl`}><QuizModeIcon mode={m.id} /></div><p className="font-bold dark:text-white">{m.title}</p></div>
                  <div className="text-right"><p className="text-[8px] font-bold text-zinc-300 uppercase">Best</p><span className="text-xs font-bold text-zinc-400">{dayHistory[selectedDay]?.scores?.[m.id] || 0}/{currentDayData.length}</span></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {studyPager && (() => {
          const last = currentDayData.length - 1;
          const i = Math.min(studyIndex, last);
          const hidden = (p) => (studyPanel === p ? {} : { 'aria-hidden': true, inert: '' }); // 안 보이는 쪽은 포커스·스크린리더에서 제외
          return (
            <div className="h-full flex flex-col gap-4">
              <div className="shrink-0 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${((i + 1) / currentDayData.length) * 100}%`, backgroundColor: config.color }} /></div>
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">{i + 1} / {currentDayData.length}</span>
              </div>
              {/* 카드 / 단어 리스트 두 페이지(내 단어장과 같음): 카드에서 위로 밀면 리스트, 리스트 맨 위에서 아래로 당기면 카드 */}
              <div className="relative flex-1 min-h-0 overflow-hidden">
                <div className="h-full transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none"
                  style={{ transform: studyPanel === 'list' ? 'translateY(-100%)' : 'none' }}>
                  <section {...studySwipe} {...hidden('card')} aria-label="단어 카드"
                    className="h-full overflow-y-auto overscroll-contain touch-pan-y select-none flex flex-col gap-5">
                    <div className="relative shrink-0">
                      <PageTurn pageKey={i} dir={studyDir}><WordCard item={currentDayData[i]} color={config.color} speak={speak} centered uniform={{ emoji: currentDayData.some(w => w.emoji), sentence: currentDayData.some(w => w.sentence) }} favorite={isFavorite(levelId, currentDayData[i].word)} onToggleFavorite={() => toggleFavorite(levelId, currentDayData[i].word)} /></PageTurn>
                      {/* 안내: 카드 왼쪽 위(별과 같은 줄, 원래 비어 있는 자리)에 들어올 때만 잠깐 */}
                      <button type="button" onClick={() => setStudyPanel('list')}
                        className={`absolute top-2 left-2 z-10 h-11 px-3 inline-flex items-center gap-1.5 rounded-full text-sm font-bold text-zinc-500 dark:text-zinc-400 active:opacity-70 transition-[opacity,visibility] duration-[1500ms] ease-out ${studyHint ? '' : 'opacity-0 invisible'}`}>
                        <i className="ph-bold ph-caret-up" aria-hidden="true" />위로 밀면 단어 리스트
                      </button>
                    </div>
                    <div className="shrink-0 grid grid-cols-2 gap-3">
                      <button type="button" disabled={i === 0} onClick={() => goStudy('prev')} className="h-14 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1E1E1E] font-bold text-zinc-700 dark:text-zinc-200 disabled:opacity-40">‹ 이전 단어</button>
                      <button type="button" onClick={() => { if (i < last) { goStudy('next'); return; } recordActivity('study'); setView('modeSelect'); }} className="h-14 rounded-lg font-bold" style={{ backgroundColor: config.color, color: config.ink || '#fff' }}>{i < last ? '다음 단어 ›' : '학습 완료 · 퀴즈 ›'}</button>
                    </div>
                  </section>

                  <section {...hidden('list')} aria-label="단어 리스트" className="h-full flex flex-col">
                    <button type="button" {...listSwipe} onClick={() => setStudyPanel('card')}
                      className="shrink-0 w-full touch-none select-none pb-2 border-b-2 border-zinc-300 dark:border-zinc-700 text-left">
                      <span className="flex justify-center text-zinc-400 text-lg" aria-hidden="true"><i className="ph-bold ph-caret-down" /></span>
                      <span className="flex items-baseline justify-between px-1">
                        <span className="text-base font-bold text-zinc-900 dark:text-white">단어 리스트</span>
                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">{currentDayData.length}개 · 카드로 돌아가기</span>
                      </span>
                    </button>
                    <ul {...listSwipe} className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-zinc-200 dark:divide-zinc-800">
                      {currentDayData.map((w, idx) => (
                        <li key={idx}>
                          <button type="button" aria-current={idx === i || undefined} onClick={() => { setStudyDir(idx < i ? 'prev' : 'next'); setStudyIndex(idx); setStudyPanel('card'); }}
                            className={`w-full min-h-[56px] px-2 py-3 flex items-center gap-3 text-left active:opacity-70 ${idx === i ? 'bg-zinc-100 dark:bg-white/5' : ''}`}>
                            {w.emoji && <span className="text-xl" aria-hidden="true">{w.emoji}</span>}
                            <span className="min-w-0 truncate text-lg font-semibold text-zinc-900 dark:text-white" lang="en">{w.word}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          );
        })()}

        {((view === 'study' && !cardStudy) || view === 'dayMistakes') && (
          <div className="animate__animated animate__fadeIn">
            <div className="mb-6 text-center font-bold dark:text-white">{view === 'study' ? `${loadedData.titles[selectedDay]} 단어 학습` : "내 오답 리스트"}</div>
            <div className="space-y-3">
              {(view === 'study' ? currentDayData : currentDayData.filter(i => dayMistakes.includes(i.word))).map((item, i) => (
                <div key={i} className="p-5 bg-white dark:bg-[#1E1E1E] rounded-lg border flex items-center justify-between shadow-none">
                  <div className="flex items-center gap-3 text-left">{item.emoji && <span className="text-2xl">{item.emoji}</span>}<div><p className="text-xl font-bold dark:text-white">{item.word}</p><p className="text-sm text-zinc-400">{item.meaning}</p>
                    {item.sentence && <button type="button" onClick={() => speak(fillSentence(item.sentence, item.word))} aria-label={`예문 듣기: ${fillSentence(item.sentence, item.word)}`} className="mt-2 text-left text-base leading-snug text-zinc-700 dark:text-zinc-200 active:opacity-70" lang="en"><SentenceText sentence={item.sentence} word={item.word} color={config.color} /><SpeakerIcon size={16} className="ml-1.5 opacity-60" /></button>}
                    {item.sentenceKo && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.sentenceKo}</p>}</div></div>
                  <div className="flex items-center gap-1 shrink-0"><FavoriteButton on={isFavorite(levelId, item.word)} onClick={() => toggleFavorite(levelId, item.word)} /><button onClick={() => speak(item.word)} className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15`, color: config.color }}><SpeakerIcon size={24} /></button></div>
                </div>
              ))}
            </div>
            <button onClick={() => { if(view === 'study') recordActivity('study'); setView('modeSelect'); }} className="w-full p-6 mt-8 rounded-lg font-bold text-white shadow-none" style={{ backgroundColor: config.color }}>학습 완료! 퀴즈 도전하기</button>
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
              // 방금 틀린 단어·모드별 점수까지 들어간 저장 결과를 화면과 서버에 그대로 쓴다
              const saved = saveProgress(selectedDay, score, currentDayData.length, quizMode);
              setDayHistory(saved);

              // 결과 화면 즉시 전환 후 서버 저장 (Firebase 지연이 화면을 막지 않도록)
              setView('result');
              recordActivity('quiz', score, currentDayData.length, quizMode, saved, improvement);
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
                  <div className="w-32 h-32 bg-white dark:bg-[#1E1E1E] rounded-lg flex items-center justify-center shadow-none border-2 mb-10" style={{ borderColor: config.color }}><span className="text-7xl">{msg.e}</span></div>
                  <h2 className="text-4xl font-bold mb-2 dark:text-white tracking-tighter">{msg.t}</h2><p className="text-zinc-400 font-bold mb-10">{msg.c}</p>
                  <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-lg p-8 shadow-none border mb-10 text-left relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: config.color }}></div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Total Score</p><span className="text-6xl font-bold" style={{ color: config.color }}>{finalScore}</span><span className="text-xl font-bold text-zinc-300"> / {currentDayData.length}</span>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-6"><div className="h-full" style={{ width: `${perf * 100}%`, backgroundColor: config.color }}></div></div>
                  </div>
                  <div className="w-full space-y-3">
                    {perf >= 0.8 ? (
                      nextDay ? <button onClick={() => selectDay(nextDay)} className="w-full p-6 text-white rounded-lg font-bold text-xl shadow-none" style={{ backgroundColor: config.color }}>다음 Day 도전하기 🚀</button> : <button onClick={() => setView('home')} className="w-full p-6 text-white rounded-lg font-bold text-xl shadow-none" style={{ backgroundColor: config.color }}>레벨 마스터! 목록으로</button>
                    ) : <button onClick={() => navigate('/my-voca')} className="w-full p-6 text-white rounded-lg font-bold text-xl shadow-none" style={{ backgroundColor: '#70011D' }}>나의 단어장에서 복습하기 ✍️</button>}
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
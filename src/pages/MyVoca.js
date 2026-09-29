import QuizModeIcon from '../components/QuizModeIcon';
import SpeakerIcon from '../components/SpeakerIcon';
import WordCard, { FavoriteButton } from '../components/WordCard';
import PageTurn from '../components/PageTurn';
import AppHeader from '../components/AppHeader';
import AraonIcon from '../components/AraonIcon';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useSpeech } from '../hooks/useSpeech';
import QuizEngine from '../components/QuizEngine';
import { db, auth } from '../firebase-config';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { getMistakeWords, hasAnyMistakes, removeMistakeWord, refreshMistakesCache } from '../utils/mistakes';
import { useUserData } from '../contexts/UserDataContext';
import { useFavorites, parseFavoriteId } from '../hooks/useFavorites';
import { useSwipe } from '../hooks/useSwipe';
import { getReviewDays, mergeLevelData } from '../utils/progress';

const withLevel = (levelId, w) => ({ ...w, levelId, levelKey: LEVEL_CONFIG[levelId].key });
const levelLabel = (levelId) => (LEVEL_CONFIG[levelId].level ? `Level ${LEVEL_CONFIG[levelId].level}` : LEVEL_CONFIG[levelId].title);

const MyVoca = () => {
  const navigate = useNavigate();
  const { speak, muted, setMuted } = useSpeech();
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData } = useUserData();

  // --- 상태 관리 ---
  const [view, setView] = useState('list');
  const [quizMode, setQuizMode] = useState('choice');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isDark, setIsDark] = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0); // 위 카드에 보이는 단어 (지금 탭 목록의 순번)
  const [swipeDir, setSwipeDir] = useState(null); // 'next' | 'prev' — 카드가 들어오는 방향
  const [quizSource, setQuizSource] = useState([]); // 퀴즈로 넘길 단어 (지금 탭의 목록)
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = ['review', 'favorites'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'mistakes';
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const [selectedQuizLevelId, setSelectedQuizLevelId] = useState('all');
  const [quizResults, setQuizResults] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [loadedDataMap, setLoadedDataMap] = useState({});
  const [startTime, setStartTime] = useState(null); // 🎯 시작 시간 추적 추가
  
  const themeColor = "#70011D";

  // --- 모든 레벨 데이터 로드 + Firebase levelProgress 동기화 (userData 준비되면 최초 1회) ---
  const hasSyncedRef = React.useRef(false);
  useEffect(() => {
    if (!userData || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const getLevelsWithMistakes = () =>
      Object.keys(LEVEL_CONFIG).filter(levelId => {
        const data = safeGetItem(LEVEL_CONFIG[levelId].key, {});
        return Object.values(data).some(d => d?.attempts && hasAnyMistakes(d.attempts));
      });

    const loadAllData = async () => {
      const preSyncLevels = new Set(getLevelsWithMistakes());
      const dataMap = {};

      const loadModule = async (levelId) => {
        if (dataMap[levelId]) return;
        try {
          const module = await LEVEL_CONFIG[levelId].loadData();
          dataMap[levelId] = module.DATA_BY_DAY;
        } catch (e) {
          console.error(`Failed to load data for ${levelId}`, e);
        }
      };

      // Firebase sync — UserDataContext가 이미 구독해둔 데이터를 재사용 (별도 fetch 없음)
      try {
        const levelProgress = userData?.levelProgress;
        if (levelProgress) {
          Object.keys(levelProgress).forEach(levelKey => {
            if (!levelProgress[levelKey]) return;
            safeSetItem(levelKey, JSON.stringify(mergeLevelData(levelProgress[levelKey], safeGetItem(levelKey, {}))));
          });
        }
      } catch (e) {
        console.error('[MyVoca] Firebase sync 오류:', e);
      }

      // Preload modules for levels already known to have mistakes
      await Promise.all([...preSyncLevels].map(loadModule));

      // After sync: load modules for any newly synced levels with mistakes
      const postSyncLevels = getLevelsWithMistakes();
      await Promise.all(postSyncLevels.filter(id => !preSyncLevels.has(id)).map(loadModule));

      // 즐겨찾기·오늘 복습할 Day가 속한 레벨도 불러오기
      const extraLevels = new Set([
        ...(userData.favorites || []).map(id => parseFavoriteId(id).levelId),
        ...getReviewDays(userData.attendance).map(d => d.levelId),
      ]);
      await Promise.all([...extraLevels].filter(id => LEVEL_CONFIG[id]?.loadData).map(loadModule));

      refreshMistakesCache();
      setLoadedDataMap(dataMap);
      setAllDataLoaded(true);
    };

    loadAllData();
  }, [userData]);

  // --- 결과 화면 진입 시 자동으로 음소거 해제 ---
  useEffect(() => {
    if (view === 'result' && muted) {
      setMuted(false);
    }
  }, [view, muted, setMuted]);

  // --- 오답 데이터 수집 함수 ---
  const fetchMistakes = useCallback(() => {
    const uniqueMistakeWordsMap = new Map();

    Object.keys(LEVEL_CONFIG).forEach(levelId => {
      const config = LEVEL_CONFIG[levelId];
      const savedData = safeGetItem(config.key, {});
      if (Object.keys(savedData).length === 0) return;

      const levelMistakeWords = new Set();
      Object.values(savedData).forEach(dayData => {
        if (dayData?.attempts) {
          getMistakeWords(dayData.attempts).forEach(word => levelMistakeWords.add(word));
        }
      });

      const currentLevelData = loadedDataMap[levelId];

      levelMistakeWords.forEach(word => {
        if (!uniqueMistakeWordsMap.has(word)) {
          let meaning = "뜻 정보 없음";
          let emoji = "";
          let sentence = "";
          let sentenceKo = "";

          if (currentLevelData) {
            for (const day in currentLevelData) {
              const found = currentLevelData[day].find(item => 
                item?.word?.toString().toLowerCase().trim() === word.toLowerCase()
              );
              if (found) {
                meaning = found.meaning;
                emoji = found.emoji || "";
                sentence = found.sentence || "";
                sentenceKo = found.sentenceKo || "";
                break;
              }
            }
          }

          uniqueMistakeWordsMap.set(word, { 
            word, meaning, emoji, sentence, sentenceKo, levelKey: config.key, levelId
          });
        }
      });
    });

    const allUniqueMistakes = Array.from(uniqueMistakeWordsMap.values());
    return Object.keys(LEVEL_CONFIG).map(levelId => {
      const config = LEVEL_CONFIG[levelId];
      const wordsForThisLevel = allUniqueMistakes.filter(m => m.levelId === levelId);
      return { 
        key: config.key, 
        label: config.subTitle,
        words: wordsForThisLevel, 
        levelId,
        config: config 
      };
    });
  }, [loadedDataMap]);

  const [mistakesGroup, setMistakesGroup] = useState([]);

  useEffect(() => {
    if (allDataLoaded || view === 'list') {
      setMistakesGroup(fetchMistakes());
    }
  }, [view, fetchMistakes, allDataLoaded]);


  // 탭별 단어: 오답노트 / 오늘 복습할 Day의 단어 / 즐겨찾기(최근 저장 순)
  const reviewDays = useMemo(() => getReviewDays(userData?.attendance), [userData?.attendance]);
  const tabWords = useMemo(() => ({
    mistakes: mistakesGroup.flatMap(g => g.words),
    review: reviewDays.flatMap(d => (loadedDataMap[d.levelId]?.[d.day] || []).map(w => withLevel(d.levelId, w))),
    favorites: [...favoriteIds].reverse().map(parseFavoriteId).map(({ levelId, word }) => {
      const days = loadedDataMap[levelId] || {};
      for (const d in days) { const w = days[d].find(x => x.word === word); if (w) return withLevel(levelId, w); }
      return null;
    }).filter(Boolean),
  }), [mistakesGroup, reviewDays, loadedDataMap, favoriteIds]);

  // 위 카드: 좌우 스와이프나 ‹ › 버튼으로 넘기고, 아래 목록을 누르면 그 단어로
  const visibleWords = tabWords[tab];
  const cardIndex = Math.min(selectedIndex, Math.max(visibleWords.length - 1, 0));
  const goCard = (i, dir) => {
    if (i < 0 || i >= visibleWords.length) return;
    setSwipeDir(dir);
    setSelectedIndex(i);
  };
  const [panel, setPanel] = useState('card'); // 'card' | 'list' — 위아래 스와이프로 오가는 두 페이지
  // '위로 밀면 단어 리스트' 안내: 단어가 뜬 뒤 3초만 보이고 사라짐 (위로 밀기는 계속 됨)
  const [listHint, setListHint] = useState(true);
  useEffect(() => {
    if (!allDataLoaded) return;
    const t = setTimeout(() => setListHint(false), 3000);
    return () => clearTimeout(t);
  }, [allDataLoaded]);
  const cardSwipe = useSwipe({ onLeft: () => goCard(cardIndex + 1, 'next'), onRight: () => goCard(cardIndex - 1, 'prev'), onUp: () => setPanel('list') });
  const listSwipe = useSwipe({ onDown: () => setPanel('card') });

  // 지금 탭의 단어(quizSource) 중 선택한 레벨만, 최대 20개
  const startQuiz = (mode) => {
    const pool = selectedQuizLevelId === 'all' ? quizSource : quizSource.filter(w => w.levelKey === selectedQuizLevelId);
    if (pool.length === 0) return;
    setQuizMode(mode);
    setStartTime(Date.now()); // 🎯 퀴즈 시작 시간 기록
    setQuizQuestions([...pool].sort(() => Math.random() - 0.5).slice(0, 20));
    setView('quiz');
  };

  const handleGraduation = (word, levelKey) => {
    const savedData = safeGetItem(levelKey, {});
    if (Object.keys(savedData).length === 0) return;
    let changed = false;
    Object.keys(savedData).forEach(day => {
      if (savedData[day]?.attempts && hasAnyMistakes(savedData[day].attempts)) {
        const prev = getMistakeWords(savedData[day].attempts).length;
        savedData[day].attempts = removeMistakeWord(savedData[day].attempts, word);
        if (getMistakeWords(savedData[day].attempts).length !== prev) changed = true;
      }
    });
    if (changed) {
      // lastUpdated를 올려야 다음 동기화에서 DB의 예전 오답이 졸업한 단어를 되살리지 않는다
      savedData.lastUpdated = Date.now();
      safeSetItem(levelKey, JSON.stringify(savedData));
      refreshMistakesCache();
      const email = auth.currentUser?.email;
      if (email) {
        updateDoc(doc(db, 'users', email), { [`levelProgress.${levelKey}`]: savedData })
          .catch(e => console.error('[MyVoca] 오답 졸업 저장 실패:', e));
      }
    }
  };

  return (
    <div className={`${view === 'list' ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] font-sans transition-colors duration-500 overflow-x-hidden`}>
      
      {/* --- 상단 헤더: 배경이 진한 와인색이므로 b.png 로고를 invert시켜 흰색 유지 --- */}
      <AppHeader themeColor={themeColor} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/')} />

      <main className={`flex-1 min-h-0 p-6 ${view === 'list' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`} style={view === 'list' ? { paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' } : undefined}>
        {view === 'list' && (() => {
          const visible = visibleWords;
          const featured = visible[cardIndex];
          const cardFrame = { emoji: visible.some(w => w.emoji), sentence: visible.some(w => w.sentence) }; // 카드 높이 고정용
          const tabs = [['mistakes', '오답노트'], ['review', '복습할 단어'], ['favorites', '즐겨찾기']];
          const empty = {
            mistakes: '틀린 단어가 없어요!',
            review: '아직 퀴즈를 푼 Day가 없어요. 퀴즈를 풀면 여기서 복습할 수 있어요.',
            favorites: '단어 학습 카드의 ☆를 눌러 저장해 보세요.',
          }[tab];
          const hidden = (p) => (panel === p ? {} : { 'aria-hidden': true, inert: '' }); // 안 보이는 쪽은 포커스·스크린리더에서 제외
          return (
            <div className="h-full flex flex-col gap-4">
              <div className="shrink-0 grid grid-cols-3 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900" role="tablist">
                {tabs.map(([key, label]) => {
                  const on = key === tab;
                  return (
                    <button key={key} type="button" role="tab" aria-selected={on}
                      onClick={() => { setSearchParams(key === 'mistakes' ? {} : { tab: key }, { replace: true }); setSelectedIndex(0); setSwipeDir(null); setPanel('card'); }}
                      className={`h-10 rounded-md text-sm font-bold transition-colors ${on ? 'text-white' : 'text-zinc-600 dark:text-zinc-300'}`}
                      style={on ? { backgroundColor: themeColor } : undefined}>
                      {label} <span className="opacity-70 tabular-nums">{tabWords[key].length}</span>
                    </button>
                  );
                })}
              </div>

              {tab === 'review' && reviewDays.length > 0 && (
                <p className="shrink-0 px-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {reviewDays[0].fallback ? '오늘 복습할 Day가 없어서 가장 최근에 배운 Day를 보여줘요 · ' : '오늘 복습할 Day · '}
                  {reviewDays.map(d => `${levelLabel(d.levelId)} Day ${d.day}${d.fallback ? '' : ` (${d.daysAgo}일 전)`}`).join(', ')}
                </p>
              )}

              {!allDataLoaded ? (
                <p className="py-16 text-center text-sm font-bold text-zinc-400">단어를 불러오는 중…</p>
              ) : visible.length === 0 ? (
                <p className="py-16 px-6 text-center text-sm font-bold text-zinc-400">{empty}</p>
              ) : <>
                {/* 카드 / 단어 리스트 두 페이지: 카드에서 위로 밀면 리스트, 리스트 맨 위에서 아래로 당기면 카드 */}
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <div className="h-full transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none"
                    style={{ transform: panel === 'list' ? 'translateY(-100%)' : 'none' }}>
                    <section {...cardSwipe} {...hidden('card')} aria-label="단어 카드"
                      className="h-full overflow-y-auto overscroll-contain touch-pan-y select-none flex flex-col gap-2">
                      <div className="relative shrink-0">
                        <PageTurn pageKey={`${tab}-${cardIndex}`} dir={swipeDir}>
                          <WordCard item={featured} color={themeColor} speak={speak} uniform={cardFrame}
                            favorite={isFavorite(featured.levelId, featured.word)} onToggleFavorite={() => toggleFavorite(featured.levelId, featured.word)} />
                        </PageTurn>
                        {/* 안내: 카드 왼쪽 위(별과 같은 줄, 원래 비어 있는 자리)에 들어올 때만 잠깐 */}
                        <button type="button" onClick={() => setPanel('list')}
                          className={`absolute top-2 left-2 z-10 h-11 px-3 inline-flex items-center gap-1.5 rounded-full text-sm font-bold text-zinc-500 dark:text-zinc-400 active:opacity-70 transition-[opacity,visibility] duration-[1500ms] ease-out ${listHint ? '' : 'opacity-0 invisible'}`}>
                          <i className="ph-bold ph-caret-up" aria-hidden="true" />위로 밀면 단어 리스트
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" aria-label="이전 단어" disabled={cardIndex === 0} onClick={() => goCard(cardIndex - 1, 'prev')} className="w-11 h-11 rounded-full flex items-center justify-center text-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30"><i className="ph-bold ph-caret-left" aria-hidden="true" /></button>
                        <span className="min-w-[72px] text-center text-sm font-bold text-zinc-500 dark:text-zinc-400 tabular-nums" aria-live="polite">{cardIndex + 1} / {visible.length}</span>
                        <button type="button" aria-label="다음 단어" disabled={cardIndex === visible.length - 1} onClick={() => goCard(cardIndex + 1, 'next')} className="w-11 h-11 rounded-full flex items-center justify-center text-xl text-zinc-600 dark:text-zinc-300 disabled:opacity-30"><i className="ph-bold ph-caret-right" aria-hidden="true" /></button>
                      </div>
                    </section>

                    <section {...hidden('list')} aria-label="단어 리스트" className="h-full flex flex-col">
                      <button type="button" {...listSwipe} onClick={() => setPanel('card')}
                        className="shrink-0 w-full touch-none select-none pb-2 border-b-2 border-zinc-300 dark:border-zinc-700 text-left">
                        <span className="flex justify-center text-zinc-400 text-lg" aria-hidden="true"><i className="ph-bold ph-caret-down" /></span>
                        <span className="flex items-baseline justify-between px-1">
                          <span className="text-base font-bold text-zinc-900 dark:text-white">단어 리스트</span>
                          <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">{visible.length}개 · 카드로 돌아가기</span>
                        </span>
                      </button>
                      <ul {...listSwipe} className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-zinc-200 dark:divide-zinc-800">
                        {visible.map((item, i) => {
                          const on = i === cardIndex;
                          return (
                            <li key={`${item.levelId}-${item.word}-${i}`} className={`flex items-center pr-1 ${on ? 'bg-zinc-100 dark:bg-white/5' : ''}`}>
                              <button type="button" aria-current={on || undefined} onClick={() => { goCard(i, i < cardIndex ? 'prev' : 'next'); setPanel('card'); }}
                                className="flex-1 min-w-0 min-h-[56px] pl-2 py-3 flex items-center gap-3 text-left active:opacity-70">
                                {item.emoji && <span className="text-xl" aria-hidden="true">{item.emoji}</span>}
                                <span className="text-lg font-semibold text-zinc-900 dark:text-white" lang="en">{item.word}</span>
                                <span className="flex-1 min-w-0 truncate text-sm text-zinc-500 dark:text-zinc-400">{item.meaning}</span>
                              </button>
                              <FavoriteButton on={isFavorite(item.levelId, item.word)} onClick={() => toggleFavorite(item.levelId, item.word)} />
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  </div>
                </div>

                <button type="button" onClick={() => { setQuizSource(visible); setSelectedQuizLevelId('all'); setView('modeSelect'); }}
                  className="shrink-0 w-full h-14 rounded-lg font-bold text-white active:opacity-80 transition-opacity" style={{ backgroundColor: themeColor }}>
                  {visible.length}개 단어 퀴즈 풀기 ›
                </button>
              </>}
            </div>
          );
        })()}

        {view === 'modeSelect' && (
          <div className="animate__animated animate__fadeInUp pt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold dark:text-white">도전 유형 선택</h2>
              <p className="text-zinc-400 text-sm mt-1 font-medium">학습한 단어들을 완벽히 마스터하세요</p>
            </div>
            <div className="relative">
                <select value={selectedQuizLevelId} onChange={(e) => setSelectedQuizLevelId(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white appearance-none outline-none text-sm shadow-none focus:border-[#70011D]">
                  <option value="all">전체 레벨 통합</option>
                  {[...new Set(quizSource.map(w => w.levelId))].map(id => <option key={id} value={LEVEL_CONFIG[id].key}>{LEVEL_CONFIG[id].subTitle}</option>)}
                </select>
                <i className="ph-bold ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"></i>
            </div>
            <div className="space-y-3">
              {[
                { id: 'choice', title: '4지선다형', color: 'bg-amber-100 text-amber-600', icon: 'ph-list-numbers' },
                { id: 'letter', title: '철자 채우기', color: 'bg-blue-100 text-blue-600', icon: 'ph-textbox' },
                { id: 'full', title: '전체 받아쓰기', color: 'bg-purple-100 text-purple-600', icon: 'ph-keyboard' }
              ].map(m => (
                <button key={m.id} onClick={() => startQuiz(m.id)} 
                        className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-none active:opacity-80 transition-all text-left group hover:border-[#70011D]/30">
                  <div className={`w-12 h-12 rounded-lg ${m.color} flex items-center justify-center text-2xl shadow-inner`}><QuizModeIcon mode={m.id} /></div>
                  <p className="font-bold dark:text-white text-base">{m.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'quiz' && quizQuestions.length > 0 && (
          <QuizEngine 
            questions={quizQuestions}
            mode={quizMode}
            themeColor={themeColor}
            onCorrect={(word, lKey) => handleGraduation(word, lKey)}
            onFinish={async (results) => { // 🎯 async 추가
              // 1. QuizEngine에서 온 오답(incorrectWords)이 문자열 배열일 경우를 대비해 
              //    전체 실수 목록(mistakesGroup)에서 객체 정보를 다시 찾아옵니다.
              const enrichedIncorrectWords = results.incorrectWords.map(resItem => {
                const wordText = typeof resItem === 'string' ? resItem : resItem.word;
                
                // 퀴즈에 쓴 단어 목록에서 뜻 등 정보를 찾음
                const foundInfo = quizSource.find(w => w.word.toLowerCase() === wordText.toLowerCase());

                return foundInfo || (typeof resItem === 'object' ? resItem : { word: wordText, meaning: "뜻 정보 없음", emoji: "" });
              });

              // 2. 보정된 데이터를 결과값으로 설정
              setQuizResults({
                ...results,
                incorrectWords: enrichedIncorrectWords
              }); 
              setView('result'); 

              // ----------------------------------------------------------------
              // 🎯 3. 여기서부터 추가된 부분! Firebase에 문제풀이 기록 업로드
              // ----------------------------------------------------------------
              const user = auth.currentUser;
              if (user) {
                try {
                  const userRef = doc(db, "users", user.email);
                  const scoreValue = results.correctWords?.length || 0; // 맞춘 개수
                  const totalValue = quizQuestions.length; // 총 문제 수
                  
                  // 🎯 학습 시간 측정: 반올림하여 더 공정하게 기록
                  const duration = Math.max(1, Math.round((Date.now() - (startTime || (Date.now() - 60000))) / 60000));

                  // DB에 저장할 레벨 키 변환 (예: araon_voca_level_1 -> level_1)
                  const rawLevelId = selectedQuizLevelId === 'all' ? 'review' : selectedQuizLevelId;
                  const dbLevelKey = rawLevelId.replace('araon_voca_', '').replace(/-/g, '_');

                  const attendanceRecord = {
                    date: new Date().toISOString(),
                    type: "오답노트 문제풀이", 
                    score: scoreValue,
                    total: totalValue,
                    levelId: dbLevelKey,
                    method: quizMode,
                    studyTime: duration
                  };

                  await updateDoc(userRef, {
                    // [대시보드 리포트용] 출석 배열에 추가
                    attendance: arrayUnion(attendanceRecord),
                    
                    // [랭킹용] 점수와 시간 누적 합산
                    [`stats.levels.${dbLevelKey}.weeklyWords`]: increment(scoreValue),
                    "stats.weeklyWords": increment(scoreValue),
                    "stats.weeklyStudyTime": increment(duration)
                  });
                  
                  console.log(`🔥 오답노트 문제풀이 기록 성공! (${duration}분)`);
                } catch (error) {
                  console.error("기록 저장 중 오류 발생:", error);
                }
              }
            }}
          />
        )}

        {view === 'result' && quizResults && (
          <div className="animate__animated animate__fadeIn text-center py-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-lg flex items-center justify-center mb-6 shadow-none animate-bounce">
              <AraonIcon name="crown" size={48} />
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">결과 리포트</h2>
            <p className="text-zinc-400 mb-8 font-bold text-sm">
              총 {quizQuestions.length}개 중 {typeof quizResults.score === 'object' ? quizResults.score.score : quizResults.score}개 정답!
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-8">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-lg border border-emerald-100 dark:border-transparent font-bold">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">정답</p>
                <p className="text-xl font-bold">{quizResults.correctWords?.length || 0}</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-lg border border-rose-100 dark:border-transparent font-bold">
                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">오답</p>
                <p className="text-xl font-bold">{quizResults.incorrectWords?.length || 0}</p>
              </div>
            </div>

            {quizResults.incorrectWords?.length > 0 && (
              <div className="w-full mb-10 text-left">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 px-2">보충 학습이 필요한 단어</h3>
                <div className="space-y-2">
                  {quizResults.incorrectWords.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-none">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-base font-bold dark:text-white leading-tight">{item.word || item}</p>
                          <p className="text-xs text-rose-500 font-bold">{item.meaning || "보충 학습 필요"}</p>
                        </div>
                      </div>
                      <button onClick={() => speak(item.word || item)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 active:text-[#70011D] transition-all">
                        <SpeakerIcon size={24} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setView('list'); setQuizResults(null); }}
                    className="w-full p-4 text-white rounded-xl font-bold shadow-none active:scale-95 transition-all" 
                    style={{ backgroundColor: themeColor }}>
              목록으로 돌아가기
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyVoca;
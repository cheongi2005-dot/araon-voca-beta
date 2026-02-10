import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useSpeech } from '../hooks/useSpeech';
import QuizEngine from '../components/QuizEngine';

const MyVoca = () => {
  const navigate = useNavigate();
  const { speak, muted, setMuted } = useSpeech();

  // --- 상태 관리 ---
  const [view, setView] = useState('list');
  const [quizMode, setQuizMode] = useState('choice');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [expandedGroups, setExpandedGroups] = useState({}); 
  const [selectedQuizLevelId, setSelectedQuizLevelId] = useState('all');
  const [quizResults, setQuizResults] = useState(null);
  
  const themeColor = "#70011D";

  // --- 다크모드 설정 ---
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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
      const storageData = localStorage.getItem(config.key);
      if (!storageData) return;

      let savedData;
      try {
        savedData = JSON.parse(storageData);
      } catch (e) {
        return;
      }

      const levelMistakeWords = new Set();
      Object.values(savedData).forEach(dayData => {
        if (dayData && dayData.attempts && Array.isArray(dayData.attempts)) {
          dayData.attempts.flat().forEach(word => {
            if (word && typeof word === 'string') levelMistakeWords.add(word.trim());
          });
        }
      });

      levelMistakeWords.forEach(word => {
        if (!uniqueMistakeWordsMap.has(word)) {
          let meaning = "뜻 정보 없음";
          let emoji = "";
          for (const day in config.data) {
            const found = config.data[day].find(item => 
              item?.word?.toString().toLowerCase().trim() === word.toLowerCase()
            );
            if (found) {
              meaning = found.meaning;
              emoji = found.emoji || "";
              break;
            }
          }
          uniqueMistakeWordsMap.set(word, { 
            word, meaning, emoji, levelKey: config.key, levelId 
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
  }, []);

  const [mistakesGroup, setMistakesGroup] = useState(() => fetchMistakes());

  useEffect(() => {
    if (view === 'list') setMistakesGroup(fetchMistakes());
  }, [view, fetchMistakes]);

  const toggleCollapse = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const totalCount = useMemo(() => mistakesGroup.reduce((a, b) => a + b.words.length, 0), [mistakesGroup]);

  const startQuiz = (mode) => {
    if (totalCount === 0) return;
    setQuizMode(mode);
    let pool = [];
    const filteredGroups = selectedQuizLevelId === 'all'
      ? mistakesGroup
      : mistakesGroup.filter(group => group.key === selectedQuizLevelId);

    filteredGroups.forEach(group => {
      group.words.forEach(item => pool.push(item));
    });
    setQuizQuestions(pool.sort(() => Math.random() - 0.5).slice(0, 20)); 
    setView('quiz');
  };

  const handleGraduation = (word, levelKey) => {
    const storageData = localStorage.getItem(levelKey);
    if (!storageData) return;
    const savedData = JSON.parse(storageData);
    let changed = false;
    Object.keys(savedData).forEach(day => {
      if (savedData[day] && savedData[day].attempts) {
        const prevStr = JSON.stringify(savedData[day].attempts);
        savedData[day].attempts = savedData[day].attempts.map(arr => 
          arr.filter(w => typeof w === 'string' && w.toLowerCase().trim() !== word.toLowerCase().trim())
        ).filter(arr => arr.length > 0);
        if (JSON.stringify(savedData[day].attempts) !== prevStr) changed = true;
      }
    });
    if (changed) localStorage.setItem(levelKey, JSON.stringify(savedData));
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* --- 상단 헤더: 배경이 진한 와인색이므로 b.png 로고를 invert시켜 흰색 유지 --- */}
      <header className="sticky top-0 z-20 flex flex-col transition-colors border-b border-black/10 shadow-sm" 
              style={{ backgroundColor: themeColor, paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(70px + env(safe-area-inset-top))' }}>
        <div className="flex-1 flex items-center px-4 justify-between w-full h-16">
          <button onClick={() => view === 'list' ? navigate('/') : setView('list')} className="p-2 text-white active:opacity-70 rounded-full">
            <i className="ph-bold ph-caret-left text-2xl"></i>
          </button>
          
          {/* 로고: Araon_logo_b.png를 사용하고 invert 필터로 흰색 표현 */}
          <img 
            src={`${process.env.PUBLIC_URL}/Araon_logo_b.png`} 
            alt="ARAON" 
            className="h-7 mx-auto invert brightness-200" 
          />
          
          <div className="flex items-center">
            <button onClick={() => setIsDark(!isDark)} className="p-2 text-white active:scale-90 transition-transform">
              <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {view === 'list' && (
          <div className="space-y-6 animate__animated animate__fadeIn">
            <button 
              onClick={() => setView('modeSelect')} 
              disabled={totalCount === 0}
              className="w-full rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all"
              style={{ backgroundColor: themeColor }}
            >
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="relative z-10 flex items-center justify-between text-left">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <i className="ph-fill ph-crown-simple text-2xl text-yellow-400"></i>
                    <h2 className="text-2xl font-black tracking-tight">Insight</h2>
                  </div>
                  <p className="text-sm font-bold opacity-70">{totalCount}개의 단어가 기다려요</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <i className="ph-bold ph-arrow-right text-2xl"></i>
                </div>
              </div>
            </button>

            <div className="space-y-4 pb-10">
              {mistakesGroup.map(group => {
                const config = group.config;
                const isExpanded = !!expandedGroups[group.key];
                
                return group.words.length > 0 && (
                  <section key={group.key} className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all">
                    <button onClick={() => toggleCollapse(group.key)} className="w-full flex items-center justify-between p-5 text-left active:bg-zinc-50 dark:active:bg-zinc-800/50">
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-inner" 
                             style={{ backgroundColor: config.color + '15', color: config.color }}>
                          <i className="ph-bold ph-bookmark text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: config.color }}>
                            {config.title}
                          </h3>
                          <p className="text-lg font-bold tracking-tight dark:text-white">
                            {config.subTitle}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-full">
                          {group.words.length}
                        </span>
                        <i className={`ph-bold ph-caret-right text-zinc-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}></i>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 border-t border-zinc-50 dark:border-zinc-800/50 pt-4 bg-zinc-50/30 dark:bg-black/10 animate__animated animate__fadeIn">
                        {group.words.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <div>
                              <p className="text-base font-bold dark:text-white leading-tight">{item.word} {item.emoji}</p>
                              <p className="text-xs text-zinc-400 font-medium mt-1">{item.meaning}</p>
                            </div>
                            <button onClick={() => speak(item.word)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-300 active:text-[#70011D] active:scale-90 transition-all">
                              <i className="ph-bold ph-speaker-high text-lg"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
              {totalCount === 0 && (
                <div className="text-center py-20 opacity-20">
                  <i className="ph-fill ph-smiley-blank text-6xl mb-4"></i>
                  <p className="font-bold dark:text-white">복습할 단어가 없어요!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'modeSelect' && (
          <div className="animate__animated animate__fadeInUp pt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black dark:text-white">도전 유형 선택</h2>
              <p className="text-zinc-400 text-sm mt-1 font-medium">학습한 단어들을 완벽히 마스터하세요</p>
            </div>
            <div className="relative">
                <select value={selectedQuizLevelId} onChange={(e) => setSelectedQuizLevelId(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold dark:text-white appearance-none outline-none text-sm shadow-sm focus:border-[#70011D]">
                  <option value="all">전체 레벨 통합</option>
                  {mistakesGroup.map(group => group.words.length > 0 && <option key={group.key} value={group.key}>{group.label}</option>)}
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
                        className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-5 shadow-sm active:scale-[0.98] transition-all text-left group hover:border-[#70011D]/30">
                  <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-2xl shadow-inner`}><i className={`ph-fill ${m.icon}`}></i></div>
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
            onFinish={(results) => { setQuizResults(results); setView('result'); }}
          />
        )}

        {view === 'result' && quizResults && (
          <div className="animate__animated animate__fadeIn text-center py-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-lg animate-bounce">
              <i className="ph-fill ph-crown text-5xl"></i>
            </div>
            <h2 className="text-2xl font-black dark:text-white mb-2">결과 리포트</h2>
            <p className="text-zinc-400 mb-8 font-bold text-sm">
              총 {quizQuestions.length}개 중 {typeof quizResults.score === 'object' ? quizResults.score.score : quizResults.score}개 정답!
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-8">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-2xl border border-emerald-100 dark:border-transparent font-bold">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">정답</p>
                <p className="text-xl font-black">{quizResults.correctWords?.length || 0}</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl border border-rose-100 dark:border-transparent font-bold">
                <p className="text-[10px] font-black uppercase opacity-60 mb-1">오답</p>
                <p className="text-xl font-black">{quizResults.incorrectWords?.length || 0}</p>
              </div>
            </div>

            {quizResults.incorrectWords?.length > 0 && (
              <div className="w-full mb-10 text-left">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 px-2">보충 학습이 필요한 단어</h3>
                <div className="space-y-2">
                  {quizResults.incorrectWords.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <p className="text-base font-bold dark:text-white leading-tight">{item.word || item}</p>
                          <p className="text-xs text-rose-500 font-bold">{item.meaning || "보충 학습 필요"}</p>
                        </div>
                      </div>
                      <button onClick={() => speak(item.word || item)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 active:text-[#70011D] transition-all">
                        <i className="ph-bold ph-speaker-high text-lg"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setView('list'); setQuizResults(null); }}
                    className="w-full p-4 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all" 
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
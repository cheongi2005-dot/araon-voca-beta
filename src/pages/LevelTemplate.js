import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useStorage } from '../hooks/useStorage';
import { useSpeech } from '../hooks/useSpeech';
import QuizEngine from '../components/QuizEngine';

const LevelTemplate = () => {
  const { levelId: rawLevelId } = useParams();
  const levelId = useMemo(() => rawLevelId?.toLowerCase() || '', [rawLevelId]);
  const navigate = useNavigate();
  const { speak } = useSpeech();

  // [1] 데이터 로드 및 설정
  const config = useMemo(() => LEVEL_CONFIG[levelId] || null, [levelId]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [view, setView] = useState('home');
  const [selectedDay, setSelectedDay] = useState(null);
  const [quizMode, setQuizMode] = useState('choice');
  const [finalScore, setFinalScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // ✨ 이모지 토글 버튼 표시 대상 레벨
  const isEmojiToggleVisible = useMemo(() => {
    return ['elementary-100', 'level-1'].includes(levelId);
  }, [levelId]);

  // 이모지 표시 상태 (로컬 스토리지 저장)
  const [showEmojiInQuiz, setShowEmojiInQuiz] = useState(() => 
    JSON.parse(localStorage.getItem(`araon_voca_show_emoji_${levelId}`) ?? 'true')
  );

  const { data: history, addMistake, saveProgress } = useStorage(config?.key || 'default');

  // 다크모드 적용 효과
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 이모지 설정 변경 시 저장
  useEffect(() => {
    if (levelId) {
      localStorage.setItem(`araon_voca_show_emoji_${levelId}`, JSON.stringify(showEmojiInQuiz));
    }
  }, [showEmojiInQuiz, levelId]);

  // 예외 처리: 레벨 정보가 없을 때
  if (!config) return <div className="p-10 text-center dark:text-white">레벨 정보를 찾을 수 없습니다.</div>;

  const dayKeys = Object.keys(config.titles || {}).sort((a, b) => Number(a) - Number(b));
  const currentDayData = selectedDay ? (config.data?.[selectedDay] || []) : [];
  const dayMistakes = selectedDay && history?.[selectedDay]?.attempts 
    ? [...new Set(history[selectedDay].attempts.flat())] : [];
  const completedDaysCount = Object.values(history || {}).filter(h => h.completed).length;

  // 🚀 퀴즈 시작 핸들러
  const handleStartQuiz = (mode) => {
    if (!currentDayData || currentDayData.length === 0) {
      alert("데이터를 불러올 수 없습니다.");
      return;
    }
    const shuffled = [...currentDayData].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setQuizMode(mode);
    setView('quiz');
  };

  const handleBack = () => {
    if (view === 'home') navigate('/');
    else if (view === 'quiz') {
      if (window.confirm("퀴즈를 중단하시겠습니까?")) setView('dayHome');
    }
    else setView('home');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans overflow-x-hidden">
      
        {/* --- 공통 헤더 --- */}
        <header 
          className="sticky top-0 z-20 flex flex-col border-b border-black/10 shadow-sm transition-colors" 
          style={{ 
            backgroundColor: config.color,
            paddingTop: 'env(safe-area-inset-top)', 
            minHeight: 'calc(64px + env(safe-area-inset-top))' 
          }}
        >
          <div className="flex-1 flex items-center px-4 justify-between w-full h-16">
            <button onClick={handleBack} className="p-2 text-white active:opacity-70 rounded-full">
              <i className="ph-bold ph-caret-left text-2xl"></i>
            </button>
            <img 
              src={`${process.env.PUBLIC_URL}/Araon_logo_b.png`} 
              alt="ARAON" 
              className="h-7 mx-auto invert brightness-200" 
            />
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-white active:scale-90 transition-transform">
              <i className={`ph-bold ${isDarkMode ? 'ph-sun' : 'ph-moon'} text-2xl`}></i>
            </button>
          </div>
        </header>

      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* 1. 홈 화면 */}
        {view === 'home' && (
          <div className="animate__animated animate__fadeIn">
            <div className="p-8 rounded-2xl text-white shadow-md mb-8" style={{ backgroundColor: config.color }}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-white/70 text-[10px] font-bold uppercase">{config.title} Mastery</p>
                <span className="text-xs font-black">{completedDaysCount} / {dayKeys.length} 완료</span>
              </div>
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${(completedDaysCount / dayKeys.length) * 100}%` }}></div>
              </div>
            </div>
            <div className="grid gap-4 pb-10">
              {dayKeys.map(d => (
                <button key={d} onClick={() => { setSelectedDay(d); setView('dayHome'); }} 
                  className="p-6 border rounded-2xl flex items-center justify-between bg-white dark:bg-[#1E1E1E] border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center text-left">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 text-white font-black" style={{ backgroundColor: history?.[d]?.completed ? config.color : '#cbd5e1' }}>D{d}</div>
                    <div className="font-bold dark:text-white/90">{config.titles[d]}</div>
                  </div>
                  <i className="ph-bold ph-caret-right text-slate-300"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Day 홈 */}
        {view === 'dayHome' && selectedDay && (
          <div className="animate__animated animate__fadeInUp flex flex-col pt-10 text-center">
            <div className="w-20 h-20 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md font-black text-2xl" style={{ backgroundColor: config.color }}>D{selectedDay}</div>
            <h2 className="text-2xl font-bold dark:text-white uppercase mb-10">{config.titles[selectedDay]}</h2>
            
            <div className="space-y-4">
              <button onClick={() => setView('study')} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-2xl flex items-center shadow-sm" style={{ borderColor: config.color }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: `${config.color}20`, color: config.color }}><i className="ph-fill ph-book-open text-2xl"></i></div>
                <div className="text-left font-bold dark:text-slate-100">단어 학습</div>
              </button>
              <button onClick={() => setView('modeSelect')} className="w-full p-6 text-white rounded-2xl flex items-center shadow-md active:scale-95 transition-all" style={{ backgroundColor: config.color }}>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4"><i className="ph-fill ph-lightning text-2xl"></i></div>
                <div className="text-left font-bold">퀴즈 도전</div>
              </button>
              <button onClick={() => setView('dayMistakes')} disabled={dayMistakes.length === 0} className="w-full p-6 bg-white dark:bg-[#1E1E1E] border-2 rounded-2xl flex items-center shadow-sm border-[#70011D]/30 disabled:opacity-50 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: '#70011D20', color: '#70011D' }}><i className="ph-fill ph-warning-circle text-2xl"></i></div>
                <div className="text-left font-bold flex items-center justify-between flex-1" style={{ color: '#70011D' }}>
                  오답 복습 <span className="text-[10px] px-2 py-0.5 bg-[#70011D] text-white rounded-full font-bold">{dayMistakes.length}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 3. 모드 선택 (점수 없을 시 아무것도 안 나오게 수정) */}
        {view === 'modeSelect' && (
          <div className="animate__animated animate__fadeInUp pt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black dark:text-white">퀴즈 모드 선택</h2>
              <p className="text-zinc-400 text-sm mt-1 font-medium">원하는 스타일로 복습하세요</p>
            </div>

            {isEmojiToggleVisible && (
              <div className="p-4 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-xl">
                    {showEmojiInQuiz ? '🎨' : '🚫'}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">퀴즈 이모지 표시</p>
                    <p className="text-[10px] text-zinc-400">그림 힌트를 함께 보여줍니다</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEmojiInQuiz(!showEmojiInQuiz)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${showEmojiInQuiz ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all absolute ${showEmojiInQuiz ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            )}

            <div className="space-y-3">
              {[
                { id: 'choice', title: '4지선다형', icon: 'ph-list-numbers', color: 'bg-amber-100 text-amber-600' },
                { id: 'letter', title: '철자 채우기', icon: 'ph-textbox', color: 'bg-blue-100 text-blue-600' },
                { id: 'full', title: '전체 받아쓰기', icon: 'ph-keyboard', color: 'bg-purple-100 text-purple-600' }
              ].map(m => {
                const dayHistory = history?.[selectedDay] || {};
                // ✅ 개별 모드 점수가 있을 때만 가져오고, 공유되는 bestScore는 무시
                const modeScore = dayHistory.scores?.[m.id]; 
                const total = dayHistory.total || currentDayData?.length || 0;

                return (
                  <button key={m.id} onClick={() => handleStartQuiz(m.id)} 
                          className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all text-left">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center text-2xl shadow-inner`}><i className={`ph-fill ${m.icon}`}></i></div>
                      <p className="font-bold dark:text-white text-base">{m.title}</p>
                    </div>
                    
                    {/* ✅ 점수가 존재하는 경우에만 우측 점수 레이아웃 렌더링 */}
                    {modeScore != null && (
                      <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-300 dark:text-zinc-600 uppercase leading-none mb-1">Best</p>
                        <span className="text-xs font-black text-zinc-400 dark:text-zinc-500">
                          {modeScore}<span className="text-zinc-200 dark:text-zinc-800 mx-0.5">/</span>{total}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setView('dayHome')} className="w-full py-4 text-zinc-400 font-bold text-sm">취소</button>
          </div>
        )}

        {/* 4. 단어 학습 및 오답 리스트 */}
        {(view === 'study' || view === 'dayMistakes') && selectedDay && (
          <div className="animate__animated animate__fadeIn pb-10">
            <div className="mb-6 text-center font-bold dark:text-white">
              {view === 'study' ? `${config.titles[selectedDay]} 단어 학습` : "내 오답 리스트"}
            </div>
            <div className="space-y-3">
              {(view === 'study' ? currentDayData : currentDayData.filter(i => dayMistakes.includes(i.word))).map((item, i) => (
                <div key={i} className="p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 text-left">
                    {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                    <div>
                      <p className="text-xl font-bold dark:text-white">{item.word}</p>
                      <p className="text-sm text-zinc-400">{item.meaning}</p>
                    </div>
                  </div>
                  <button onClick={() => speak(item.word)} className="w-12 h-12 rounded-xl flex items-center justify-center active:scale-90 transition-transform" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                    <i className="ph-bold ph-speaker-high text-xl"></i>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setView('dayHome')} className="w-full p-6 mt-8 rounded-[2rem] font-black text-white shadow-lg" style={{ backgroundColor: config.color }}>메뉴로 돌아가기</button>
          </div>
        )}

        {/* 5. 퀴즈 엔진 */}
        {view === 'quiz' && shuffledQuestions.length > 0 && (
          <QuizEngine 
            questions={shuffledQuestions}
            mode={quizMode} 
            themeColor={config.color} 
            showEmoji={showEmojiInQuiz}
            onMistake={(q) => addMistake(selectedDay, q.word)} 
            onFinish={(res) => {
              const score = typeof res === 'object' ? res.score : res;
              setFinalScore(score);
              saveProgress(selectedDay, score, currentDayData.length, quizMode);
              setView('result'); 
            }} 
          />
        )}

        {/* 6. 결과 화면 */}
        {view === 'result' && (
          <div className="animate__animated animate__fadeIn flex flex-col items-center py-6 text-center">
            {(() => {
              const total = currentDayData.length || 1;
              const perf = finalScore / total;
              let msg = { title: "CHEER UP!", emoji: "💪", text: "조금 더 연습해볼까요?" };
              if (perf >= 0.8) msg = { title: "WOW!", emoji: "🥳", text: "완벽하게 마스터했어요!" };
              else if (perf >= 0.5) msg = { title: "GREAT!", emoji: "👍", text: "참 잘했어요!" };

              return (
                <>
                  <div className="relative mb-10">
                    <div className="w-32 h-32 rounded-full blur-3xl absolute opacity-30 animate-pulse" style={{ backgroundColor: config.color }}></div>
                    <div className="w-32 h-32 bg-white dark:bg-[#1E1E1E] rounded-3xl flex items-center justify-center relative shadow-xl border-2" style={{ borderColor: config.color }}>
                      <span className="text-7xl">{msg.emoji}</span>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black mb-2 dark:text-white tracking-tighter">{msg.title}</h2>
                  <p className="text-zinc-400 font-bold mb-10">{msg.text}</p>
                  
                  <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800 mb-10 text-left relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: config.color }}></div>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Total Score</p>
                        <span className="text-6xl font-black" style={{ color: config.color }}>{finalScore}</span>
                        <span className="text-xl font-bold text-zinc-300"> / {total}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Accuracy</p>
                        <p className="text-2xl font-black dark:text-white">{Math.round(perf * 100)}%</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${perf * 100}%`, backgroundColor: config.color }}></div>
                    </div>
                  </div>
                </>
              );
            })()}
            <button onClick={() => setView('home')} className="w-full p-6 text-white rounded-[2rem] font-black text-xl shadow-lg active:scale-95 transition-all" style={{ backgroundColor: config.color }}>
              홈으로 돌아가기
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LevelTemplate;
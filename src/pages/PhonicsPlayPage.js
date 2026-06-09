import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PHONICS_STAGES } from '../data/phonicsData';

const PhonicsPlayPage = () => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stageData = PHONICS_STAGES.find(s => s.id === stageId);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  const [quizPool, setQuizPool] = useState([]); 
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizDone, setIsQuizDone] = useState(false);

  const initQuizPool = useCallback(() => {
    if (!stageData) return;
    const lessonWords = stageData.steps.filter(s => s.type === 'word');
    const quizStep = stageData.steps.find(s => s.type === 'quiz');
    const extraWords = quizStep?.extraQuizWords || [];
    
    const combined = [...lessonWords, ...extraWords];
    const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 5);
    setQuizPool(shuffled);
  }, [stageData]);

  useEffect(() => {
    initQuizPool();
  }, [initQuizPool]);

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; 
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderHighlightedWord = (word, target) => {
    const parts = word.split(new RegExp(`(${target})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === target.toLowerCase() ? (
        <span key={i} className="text-[#70011D] dark:text-[#FF4D4D]">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  useEffect(() => {
    setIsCardRevealed(false);
  }, [currentStepIndex]);

  if (!stageData) return <div className="p-10 text-center text-zinc-500">스테이지 정보를 찾을 수 없습니다.</div>;

  const currentStep = stageData.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / stageData.steps.length) * 100;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === stageData.steps.length - 1;
  const isNextStepQuiz = !isLast && stageData.steps[currentStepIndex + 1]?.type === 'quiz';

  const handleQuizSelect = (choice, correctAns) => {
    if (quizSelected !== null) return; 
    
    if (choice === correctAns) setQuizScore(s => s + 1);
    setQuizSelected(choice);
    
    setTimeout(() => {
      if (quizIdx < quizPool.length - 1) {
        setQuizIdx(i => i + 1);
        setQuizSelected(null);
      } else {
        setIsQuizDone(true); 
      }
    }, 1000);
  };

  const renderMascot = (emotion, sizeClass = "w-20 h-20") => {
    if (!emotion) return null;
    return (
      <div className={`${sizeClass} flex-shrink-0 flex items-center justify-center overflow-hidden`}>
        <img 
          src={`${process.env.PUBLIC_URL}/raon/${emotion}.webp`} 
          alt={emotion}
          className="w-full h-full object-contain drop-shadow-sm"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'intro':
      case 'dialogue':
        return (
          <div className="flex flex-col items-center justify-center text-center space-y-8 p-6 h-full animate-fade-in">
             {renderMascot(currentStep.emotion || 'waving', 'w-32 h-32 mb-2')}
             <h1 className="text-2xl font-black text-zinc-800 dark:text-white break-keep">{currentStep.title || "오늘의 파닉스!"}</h1>
             <div className="relative p-6 bg-white dark:bg-[#1E1E1E] rounded-3xl text-base font-bold leading-relaxed text-zinc-800 dark:text-zinc-200 shadow-sm border-2 border-indigo-100 dark:border-indigo-900/30 break-keep">
               {currentStep.greeting || currentStep.dialogue || currentStep.text}
               {/* 말풍선 꼬리 */}
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-[#1E1E1E] border-t-2 border-l-2 border-indigo-100 dark:border-indigo-900/30 rotate-45"></div>
             </div>
             {(currentStep.content || currentStep.details) && (
               <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 px-4 leading-relaxed whitespace-pre-line break-keep">
                 {currentStep.content || currentStep.details}
               </p>
             )}
          </div>
        );

      case 'explanation':
        return (
          <div className="flex flex-col justify-center space-y-6 p-6 h-full animate-fade-in">
            {/* 🎯 1. 헤더 영역 가독성 개선 */}
            <div className="flex items-center gap-4">
              {renderMascot(currentStep.emotion || 'explaining', 'w-24 h-24')}
              <div className="flex-1">
                <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full mb-2 inline-block tracking-widest">
                  {currentStep.subtitle}
                </span>
                {/* break-keep 추가로 이상한 줄바꿈 방지 */}
                <h2 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-white leading-snug break-keep">
                  {currentStep.title}
                </h2>
              </div>
            </div>
            
            {/* 🎯 2. 메인 설명 박스를 라온이의 말풍선 형태로 변경 & 글자색을 읽기 편한 어두운 색으로 */}
            <div className="relative text-[15px] font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm leading-relaxed break-keep">
              <div className="absolute -top-3 left-10 w-5 h-5 bg-white dark:bg-[#1E1E1E] border-t-2 border-l-2 border-indigo-100 dark:border-indigo-900/30 rotate-45"></div>
              {currentStep.content || currentStep.dialogue}
            </div>
            
            {/* 🎯 3. 디테일 박스 내용 분리 (제목은 진하게, 설명은 연하게) */}
            <div className="space-y-3 mt-2">
              {currentStep.details?.map((detail, idx) => {
                // \n 기준으로 제목과 본문 분리
                const parts = detail.split('\n');
                const hasTitle = parts.length > 1;

                return (
                  <div key={idx} className="bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    {hasTitle ? (
                      <>
                        <p className="text-[14px] font-black text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                          {parts[0]}
                        </p>
                        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed break-keep">
                          {parts.slice(1).join('\n')}
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed break-keep">
                        {detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'word':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in w-full">
            {renderMascot(currentStep.emotion || 'happy', 'w-24 h-24 mb-2 animate-bounce')}
            
            <div 
              onClick={() => { setIsCardRevealed(true); playAudio(currentStep.word); }}
              className="w-full aspect-square max-h-[380px] bg-white dark:bg-[#1E1E1E] rounded-[3rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center relative p-8 cursor-pointer active:scale-95 transition-transform"
            >
              {isPlaying && <div className="absolute inset-0 rounded-[3rem] border-4 border-indigo-100 dark:border-indigo-900/30 animate-pulse pointer-events-none"></div>}

              <span className="text-6xl mb-2 block">{currentStep.emoji}</span>
              <h2 className="text-6xl sm:text-7xl font-black text-zinc-800 dark:text-white tracking-tight mt-2 font-['Lexend'] relative z-10">
                {renderHighlightedWord(currentStep.word, stageData.targetSound)}
              </h2>
              
              {isCardRevealed ? (
                <div className="mt-6 text-center space-y-2 animate-fade-in relative z-10">
                  <span className="inline-block px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium text-lg mb-1 font-['Lexend'] tracking-wide">
                    [{currentStep.phonetic || currentStep.soundKor}]
                  </span>
                  <p className="text-xl font-bold text-zinc-600 dark:text-zinc-300">{currentStep.meaning}</p>
                </div>
              ) : (
                <div className="mt-8 text-center text-zinc-400 font-bold animate-pulse text-sm relative z-10">
                  카드를 터치해서 뜻을 확인하세요! 👆
                </div>
              )}
            </div>
          </div>
        );

case 'summary':
        return (
          <div className="flex flex-col justify-center space-y-6 p-6 h-full animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
              {renderMascot(currentStep.emotion || 'cheering', 'w-20 h-20')}
              <h2 className="text-2xl font-black text-zinc-800 dark:text-white break-keep">{currentStep.title}</h2>
            </div>
            
            {/* 🎯 기존 테이블을 지우고 2번 사진 스타일의 카드 리스트로 변경 */}
            <div className="space-y-4">
              {currentStep.summaryTable?.map((row, idx) => {
                // 첫 번째 줄(단모음)은 초록색 테마, 두 번째 줄(장모음)은 핑크색 테마
                const isFirst = idx === 0;
                const textColor = isFirst ? 'text-emerald-500' : 'text-pink-500';
                const borderColor = isFirst ? 'border-emerald-100 dark:border-emerald-900/30' : 'border-pink-100 dark:border-pink-900/30';
                
                return (
                  <div key={idx} className={`bg-white dark:bg-[#1E1E1E] border-2 ${borderColor} rounded-3xl p-5 flex items-center gap-5 shadow-sm`}>
                    {/* 왼쪽: 커다란 소리 텍스트 */}
                    <div className={`text-3xl font-black flex-shrink-0 min-w-[70px] text-center ${textColor} font-['Lexend'] tracking-tighter`}>
                      {row.sound}
                    </div>
                    
                    {/* 오른쪽: 상황, 이유, 예시 단어 */}
                    <div className="flex flex-col gap-1">
                      <div className="text-[15px] font-black text-zinc-800 dark:text-zinc-200">
                        {row.situation}
                      </div>
                      <div className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 break-keep leading-snug">
                        {row.reason}
                      </div>
                      {row.example && (
                        <div className={`text-[13px] font-black mt-1.5 ${textColor} opacity-90 tracking-wide font-['Lexend']`}>
                          {row.example}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-sm font-bold leading-relaxed text-indigo-900 dark:text-indigo-200 shadow-sm border border-indigo-100 dark:border-indigo-500/20 text-center break-keep">
              {currentStep.outro}
            </div>
          </div>
        );

case 'quiz':
        if (quizPool.length === 0) return <div className="text-center p-10 font-bold text-zinc-400">퀴즈 데이터가 없습니다.</div>;

        if (isQuizDone) {
          const isPerfect = quizScore === quizPool.length;
          return (
             <div className="flex flex-col items-center justify-center p-6 h-full animate-fade-in text-center">
               {renderMascot('cheering', 'w-32 h-32 mb-6')}
               <h2 className="text-2xl font-black text-zinc-800 dark:text-white mb-2">퀴즈 완료!</h2>
               <p className="text-zinc-500 font-bold mb-6 break-keep">
                 {isPerfect ? "완벽해요! 파닉스 마스터 🏆" : "참 잘했어요! 조금만 더 연습해볼까요? 💪"}
               </p>
               
               <div className="bg-[#FDF2F2] dark:bg-[#70011D]/10 rounded-3xl p-8 w-full border border-[#70011D]/20 mb-8 shadow-inner">
                  <span className="text-6xl font-black text-[#70011D] dark:text-[#FF4D4D] font-['Lexend']">{quizScore}</span>
                  <span className="text-2xl font-bold text-zinc-400"> / {quizPool.length}</span>
               </div>

               <button 
                 onClick={() => { setQuizIdx(0); setQuizScore(0); setIsQuizDone(false); setQuizSelected(null); initQuizPool(); }} 
                 className="px-6 py-4 bg-white dark:bg-[#1E1E1E] border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl font-black text-zinc-600 dark:text-zinc-300 shadow-sm active:scale-95 transition-transform"
               >
                 새로운 문제로 다시 풀기 🔄
               </button>
             </div>
          );
        }

        const qWord = quizPool[quizIdx];
        const correctAns = qWord.emotion === 'proud' ? "에이~" : "애!";
        const options = ["애!", "에이~"];

        return (
          <div className="flex flex-col items-center justify-center p-6 h-full animate-fade-in w-full">
             <div className="w-full flex justify-between items-center mb-6">
               <span className="text-sm font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                 Q {quizIdx + 1} / {quizPool.length}
               </span>
               <span className="text-sm font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                 {stageData.targetSound}는 어떻게 소리날까요?
               </span>
             </div>

             <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-[2.5rem] p-10 shadow-lg border border-zinc-100 dark:border-zinc-800 flex flex-col items-center mb-8 relative overflow-hidden">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl"></div>
               
               {/* 🎯 퀴즈 문제용 스피커 버튼 추가! */}
               <button 
                 onClick={() => playAudio(qWord.word)}
                 className={`absolute top-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all z-20 ${isPlaying ? 'bg-indigo-100 text-indigo-600 scale-110 shadow-md' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 active:scale-95 shadow-sm'}`}
               >
                 <i className={`ph-fill ph-speaker-high text-2xl ${isPlaying ? 'animate-pulse' : ''}`}></i>
               </button>

               <span className="text-7xl mb-6 relative z-10">{qWord.emoji}</span>
               <h3 className="text-5xl font-black tracking-widest text-zinc-800 dark:text-white font-['Lexend'] relative z-10">{qWord.word}</h3>
             </div>

             <div className="w-full flex gap-4">
               {options.map(opt => {
                 const isCorrect = opt === correctAns;
                 let btnStyle = "bg-white dark:bg-[#1E1E1E] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white hover:border-indigo-300";
                 
                 if (quizSelected === opt) {
                   btnStyle = isCorrect 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 shadow-md scale-105" 
                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-500 text-rose-600 opacity-70";
                 } else if (quizSelected !== null && isCorrect) {
                   btnStyle = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600";
                 }

                 return (
                   <button 
                     key={opt}
                     onClick={() => handleQuizSelect(opt, correctAns)}
                     className={`flex-1 py-6 rounded-3xl border-2 font-black text-2xl shadow-sm active:scale-95 transition-all duration-200 ${btnStyle}`}
                   >
                     {opt}
                   </button>
                 );
               })}
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] flex flex-col font-sans" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      <div className="max-w-md mx-auto w-full flex-1 flex flex-col relative">
        <header className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#F8F9FA]/80 dark:bg-[#0A0A0B]/80 backdrop-blur-md">
          <button onClick={() => navigate('/phonics')} className="p-2 text-zinc-400 dark:text-zinc-500 active:scale-90 transition-transform">
            <i className="ph-bold ph-x text-xl"></i>
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#70011D] dark:bg-[#FF4D4D] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <span className="text-[10px] font-black text-zinc-400 tracking-widest">{currentStepIndex + 1} / {stageData.steps.length}</span>
        </header>

        <div className="flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderStepContent()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F8F9FA] dark:from-[#0A0A0B] to-transparent pointer-events-none z-20 pb-safe">
          <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
            <button 
              disabled={isFirst}
              onClick={() => setCurrentStepIndex(prev => prev - 1)}
              className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 disabled:opacity-30 active:scale-95 transition-all shadow-sm"
            >
              <i className="ph-bold ph-caret-left text-2xl"></i>
            </button>
            
            <button 
              disabled={(currentStep.type === 'quiz' && !isQuizDone)}
              onClick={() => {
                if (!isLast) setCurrentStepIndex(prev => prev + 1);
                else { 
                  alert('🎉 훌륭해요! 스테이지를 완료했습니다.'); 
                  navigate('/phonics'); 
                }
              }}
              className={`flex-1 h-16 rounded-2xl bg-[#70011D] dark:bg-white text-white dark:text-zinc-900 font-black text-lg transition-transform flex items-center justify-center shadow-xl ${(currentStep.type === 'quiz' && !isQuizDone) ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
            >
              {isLast 
                ? '완료하기 🚀' 
                : isNextStepQuiz 
                  ? '퀴즈 시작하기 🎯' 
                  : currentStep.type === 'word' 
                    ? '다음 단어' 
                    : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhonicsPlayPage;
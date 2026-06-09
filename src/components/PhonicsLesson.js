import React, { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

// 🎯 이미지가 없을 때를 대비한 임시 이모지 매핑
const FALLBACK_EMOJIS = {
  waving: '👋',
  thinking: '🤔',
  explaining: '👨‍🏫',
  magic: '🪄',
  cheering: '🙌',
  listening: '👂',
  proud: '😤',
  happy: '😄',
};

const PhonicsLesson = ({ stageData, onComplete, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { speak } = useSpeech();

  useEffect(() => {
    console.log('PhonicsLesson Mounted with stageData:', stageData);
  }, [stageData]);

  const steps = stageData?.steps || [];
  const currentStep = steps[currentStepIndex];

  // 단어 카드일 경우 자동으로 소리 재생
  useEffect(() => {
    if (currentStep?.type === 'word' && currentStep?.word) {
      try {
        speak(currentStep.word);
      } catch (e) {
        console.error("Speech error:", e);
      }
    }
  }, [currentStepIndex, currentStep, speak]);

  if (!currentStep) {
    console.warn('No currentStep found at index:', currentStepIndex);
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0A0A0B] dark:text-white">
        <div className="text-center p-6">
          <p className="mb-4">학습 데이터를 불러올 수 없습니다. (Step: {currentStepIndex})</p>
          <button onClick={onClose} className="px-4 py-2 bg-indigo-500 rounded-xl">목록으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const progressPercent = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  // 🎯 캐릭터와 말풍선을 그려주는 공통 함수
  const CharacterBubble = ({ emotion, text, isWordCard }) => {
    const [imgError, setImgError] = useState(false);
    const publicUrl = process.env.PUBLIC_URL || '';
    
    return (
      <div className={`flex ${isWordCard ? 'flex-col items-center' : 'items-end'} gap-4 w-full animate__animated animate__fadeInUp`}>
        {/* 캐릭터 영역 */}
        <div className={`${isWordCard ? 'w-24 h-24 mb-4' : 'w-20 h-20'} flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-4xl shadow-inner border-2 border-indigo-100 dark:border-indigo-800/50 overflow-hidden`}>
          {!imgError ? (
            <img 
              src={`${publicUrl}/images/character/${emotion}.png`} 
              alt={emotion}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{FALLBACK_EMOJIS[emotion] || '🐥'}</span>
          )}
        </div>

        {/* 말풍선 영역 */}
        {text && (
          <div className="relative flex-1 bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl rounded-bl-none border-2 border-zinc-200 dark:border-zinc-800 shadow-sm">
            <p className="text-[15px] font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
              {text}
            </p>
            {/* 말풍선 꼬리 */}
            <div className="absolute -left-2.5 bottom-0 w-5 h-5 bg-white dark:bg-[#1E1E1E] border-l-2 border-b-2 border-zinc-200 dark:border-zinc-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors font-sans antialiased text-zinc-900 dark:text-white relative">
      
      {/* 상단 헤더 & 진행바 */}
      <header className="px-4 pt-6 pb-2 flex items-center gap-4 sticky top-0 bg-[#F8F9FA] dark:bg-[#0A0A0B] z-10">
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 active:scale-90 p-2">
          <i className="ph-bold ph-x text-2xl"></i>
        </button>
        <div className="flex-1 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 flex flex-col justify-center pb-32 overflow-y-auto">
        
        {/* 1. 대화만 있는 화면 */}
        {currentStep.type === 'dialogue' && (
          <CharacterBubble emotion={currentStep.emotion} text={currentStep.text || currentStep.dialogue} />
        )}

        {/* 2. 설명이 포함된 화면 */}
        {currentStep.type === 'explanation' && (
          <div className="space-y-6 animate__animated animate__fadeIn">
            {currentStep.dialogue && <CharacterBubble emotion={currentStep.emotion} text={currentStep.dialogue} />}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
              {currentStep.subtitle && <span className="text-indigo-500 font-black text-[11px] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full mb-3 inline-block">{currentStep.subtitle}</span>}
              <h2 className="text-2xl font-black mb-4">{currentStep.title}</h2>
              <div className="space-y-4">
                {currentStep.details?.map((detail, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl">
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 단어 카드 화면 */}
        {currentStep.type === 'word' && (
          <div className="flex flex-col items-center justify-center h-full animate__animated animate__zoomIn">
            <CharacterBubble emotion={currentStep.emotion} isWordCard={true} />
            <button onClick={() => speak(currentStep.word)} className="w-full max-w-xs mt-6 bg-white dark:bg-[#1E1E1E] border-b-4 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center active:border-b-0 active:translate-y-1 transition-all">
              <span className="text-6xl font-black text-indigo-500 mb-2 tracking-tighter">{currentStep.word}</span>
              <span className="text-zinc-400 font-bold mb-4">[{currentStep.soundKor}]</span>
              <span className="text-2xl font-black">{currentStep.meaning}</span>
              <div className="mt-6 w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                <i className="ph-fill ph-speaker-high text-2xl"></i>
              </div>
            </button>
          </div>
        )}

        {/* 4. 요약 정리 화면 */}
        {currentStep.type === 'summary' && (
          <div className="space-y-6 animate__animated animate__fadeIn">
            <CharacterBubble emotion={currentStep.emotion} text={currentStep.dialogue} />
            <div className="bg-indigo-500 text-white rounded-3xl p-6 shadow-md border-b-4 border-indigo-700">
              <h2 className="text-xl font-black mb-6 text-center">{currentStep.title}</h2>
              <div className="space-y-3">
                {currentStep.summaryTable?.map((row, idx) => (
                  <div key={idx} className="bg-white/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-indigo-200 mb-1">{row.situation}</p>
                      <p className="text-sm font-bold leading-snug">{row.reason}</p>
                    </div>
                    <div className="w-16 h-16 bg-white text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 shadow-sm rotate-3">
                      {row.sound}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {currentStep.outro && (
              <p className="text-center font-bold text-zinc-500 dark:text-zinc-400 mt-4 px-4">{currentStep.outro}</p>
            )}
          </div>
        )}
      </main>

      {/* 하단 '계속하기' 버튼 고정 */}
      <footer className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 z-20">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleNext} 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg py-4 rounded-2xl shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider"
          >
            {currentStepIndex === steps.length - 1 ? '완료하기' : '계속하기'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PhonicsLesson;

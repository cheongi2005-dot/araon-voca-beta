import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuiz } from '../hooks/useQuiz';
import { useSpeech } from '../hooks/useSpeech';

const QuizEngine = ({ questions, mode, themeColor, onFinish, onMistake, onCorrect, showEmoji, useSound }) => {
  const { speak, muted, setMuted } = useSpeech();

  useEffect(() => {
    if (useSound !== undefined) {
      setMuted(!useSound);
    }
  }, [useSound, setMuted]);

  const { 
    currentIndex, 
    showFeedback, 
    isCurrentCorrect, 
    userInput, 
    setUserInput, 
    selectedAnswer, 
    setSelectedAnswer, 
    submitAnswer 
  } = useQuiz(questions, onFinish, onMistake, onCorrect);
  
  const currentQ = questions[currentIndex];

  const sanitizedCurrentQ = useMemo(() => {
    return currentQ ? {
      word: currentQ.word,
      meaning: currentQ.meaning,
      emoji: currentQ.emoji,
      levelKey: currentQ.levelKey,
      levelId: currentQ.levelId,
    } : null;
  }, [currentQ]);

  // 🎯 안전장치 추가: 데이터가 이상해도 앱이 터지지 않도록 무조건 문자열로 변환
  const safeWord = String(sanitizedCurrentQ?.word || '');
  const safeInput = String(userInput || '');

  const dynamicOptions = useMemo(() => {
    if (mode !== 'choice' || !currentQ) return [];
    const correctMeaning = sanitizedCurrentQ?.meaning;
    const allUniqueMeanings = Array.from(new Set(questions.map(q => q.meaning)));
    const potentialDistractorMeanings = allUniqueMeanings.filter(m => m !== correctMeaning);
    const selectedDistractorMeanings = potentialDistractorMeanings
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correctMeaning, ...selectedDistractorMeanings].sort(() => Math.random() - 0.5);
  }, [mode, questions, sanitizedCurrentQ, currentQ]);

  const inputRef = useRef(null);

  useEffect(() => {
    if ((mode === 'letter' || mode === 'full') && inputRef.current && !showFeedback) {
      inputRef.current.focus();
    }
  }, [mode, currentIndex, showFeedback]);

  const letterTiles = useMemo(() => {
    if (mode !== 'letter' || !currentQ) return [];
    // 🎯 safeWord를 사용하여 split 오류 방지
    return safeWord.toLowerCase().split('').map((char, index) => ({ char, id: `${char}-${index}`, isUsed: false })).sort(() => Math.random() - 0.5);
  }, [mode, currentQ, safeWord]);

  const [displayLetterTiles, setDisplayLetterTiles] = useState([]);

  useEffect(() => {
    if (mode === 'letter' && safeWord) {
      setDisplayLetterTiles(letterTiles);
    }
  }, [mode, safeWord, letterTiles]);

  const handleNext = (isCorrect) => {
    if (showFeedback) {
      submitAnswer();
    } else {
      submitAnswer(isCorrect, currentQ);
    }
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  // 🎯 하얀 화면의 주범 해결: currentQ가 없을 때(마지막 문제 제출 직후) 빈 화면 대신 로딩창 출력
  if (currentQ === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate__animated animate__fadeIn">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mb-4" style={{ borderTopColor: themeColor }}></div>
        <p className="text-zinc-500 font-bold dark:text-zinc-400">결과를 서버에 저장하고 있어요... 🚀</p>
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn bg-[#F8F9FA] dark:bg-[#0A0A0B]">
      {/* 상단 진행도 바 */}
      <div className="flex justify-between items-center mb-8 px-1 text-xs font-bold uppercase text-zinc-400">
          <span>{currentIndex + 1} / {questions.length}</span>
          <div className="flex-1 mx-4 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, backgroundColor: themeColor }}></div>
          </div>
          <button onClick={() => setMuted(!muted)} className="p-2 text-zinc-400 active:scale-90">
            <i className={`ph-bold ${muted ? 'ph-speaker-slash' : 'ph-speaker-high'} text-2xl`}></i>
          </button>
      </div>

      {/* 문제 카드 */}
      <div className="text-center py-12 mb-8 bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 relative overflow-hidden">
          {mode === 'choice' ? (
            <>
              {showEmoji && sanitizedCurrentQ?.emoji && <span className="text-6xl mb-6 block animate__animated animate__bounceIn">{sanitizedCurrentQ.emoji}</span>}
              <h3 className="text-5xl font-bold dark:text-white tracking-tighter text-center">{safeWord}</h3>
            </>
          ) : (
            <>
              {showEmoji && sanitizedCurrentQ?.emoji && <span className="text-6xl mb-6 block animate__animated animate__bounceIn">{sanitizedCurrentQ.emoji}</span>}
              <p className="text-zinc-400 text-xs font-bold uppercase mb-2 tracking-wider">Meaning</p>
              <h3 className="text-3xl font-bold px-4 dark:text-white leading-tight">{sanitizedCurrentQ?.meaning}</h3>
              <button onClick={() => speak(safeWord)} className="mt-5 px-5 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 active:scale-90 transition-transform inline-flex items-center gap-1.5 text-xs font-bold">
                <i className="ph-bold ph-speaker-high text-base"></i> 발음 듣기
              </button>
              {mode === 'letter' && (
                <div className="mt-8 flex justify-center gap-1.5">
                    {safeWord.split('').map((_, i) => (
                        <div key={i} className={`w-8 h-10 border-b-4 ${showFeedback && isCurrentCorrect ? 'border-emerald-500' : 'border-zinc-200 dark:border-zinc-700'} text-2xl font-bold dark:text-white`}>
                          {userInput[i] || ""}
                        </div>
                    ))}
                </div>
              )}
            </>
          )}
      </div>

      {/* 피드백 텍스트 */}
      {showFeedback && mode !== 'choice' && (
        <div className={`text-center mb-6 py-4 rounded-xl animate__animated animate__headShake ${isCurrentCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          <p className="font-bold">정답: {safeWord.toLowerCase()}</p>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex flex-col gap-4 text-center">
        {mode === 'choice' && dynamicOptions.map((opt, i) => {
          const isCorrect = opt === sanitizedCurrentQ?.meaning;
          let style = "bg-white dark:bg-[#1E1E1E] border-zinc-200 dark:border-zinc-800 dark:text-zinc-300";
          if (showFeedback) { 
            if (isCorrect) style = "bg-emerald-600 border-emerald-500 text-white shadow-md scale-105"; 
            else if (selectedAnswer === opt) style = `bg-rose-500 border-rose-500 text-white opacity-50`;
          }
          return <button key={i} disabled={showFeedback} onClick={() => { setSelectedAnswer(opt); handleNext(isCorrect); }}
                         className={`p-5 rounded-2xl font-bold text-lg border-2 transition-all active:scale-[0.98] ${style}`}>{opt}</button>;
        })}

        {mode === 'letter' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-center gap-3">
              {displayLetterTiles.map((tile) => (
                <button key={tile.id} onClick={() => { 
                          setUserInput(prev => prev + tile.char);
                          setDisplayLetterTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isUsed: true } : t));
                        }} 
                        disabled={showFeedback || tile.isUsed}
                        className={`w-14 h-14 bg-white dark:bg-[#1E1E1E] border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl font-bold text-xl dark:text-white shadow-sm active:scale-90 transition-transform ${tile.isUsed ? 'opacity-30' : ''}`}>{tile.char}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleNext(safeInput.toLowerCase() === safeWord.toLowerCase())} 
                      className="flex-1 p-6 text-white rounded-2xl font-bold text-xl shadow-md active:scale-95 transition-all" 
                      style={{ backgroundColor: themeColor }}>
                {showFeedback ? (currentIndex === questions.length - 1 ? '결과 확인하기' : '다음 문제로') : '정답 확인'}
              </button>
              {!showFeedback && (
                <button onClick={() => {
                  const lastChar = safeInput.slice(-1);
                  if (lastChar) {
                    setUserInput(prev => prev.slice(0, -1));
                    setDisplayLetterTiles(prev => {
                      let found = false;
                      return prev.map(t => {
                        if (t.char === lastChar && t.isUsed && !found) {
                          found = true;
                          return { ...t, isUsed: false };
                        }
                        return t;
                      });
                    });
                  }
                }} disabled={safeInput.length === 0} className="w-16 p-3 bg-zinc-100 dark:bg-[#1E1E1E] rounded-2xl text-zinc-500 font-bold text-xl shadow-md active:scale-95 transition-all"><i className="ph-fill ph-backspace text-2xl"></i></button>
              )}
            </div>
          </div>
        )}

        {mode === 'full' && (
          <div className="flex flex-col gap-4">
            <input ref={inputRef} autoFocus type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={showFeedback}
                   className={`w-full p-6 bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 ${showFeedback ? (isCurrentCorrect ? 'border-emerald-500' : 'border-rose-500') : 'border-zinc-100 dark:border-zinc-800'} text-center text-3xl font-bold outline-none dark:text-white shadow-inner`}
                   onKeyPress={(e) => e.key === 'Enter' && handleNext(safeInput.trim().toLowerCase() === safeWord.toLowerCase())} />
            <button onClick={() => handleNext(safeInput.trim().toLowerCase() === safeWord.toLowerCase())} 
                    className="p-6 text-white rounded-2xl font-bold text-xl shadow-md active:scale-95 transition-all" 
                    style={{ backgroundColor: themeColor }}>
              {showFeedback ? (currentIndex === questions.length - 1 ? '결과 확인하기' : '다음 문제로') : '제출하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEngine;
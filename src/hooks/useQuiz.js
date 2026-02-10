import { useState, useCallback } from 'react';

export const useQuiz = (questions, onFinish, onMistake, onCorrect) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctWords, setCorrectWords] = useState([]); // 맞은 단어들을 저장할 상태
  const [incorrectWords, setIncorrectWords] = useState([]); // 틀린 단어들을 저장할 상태

  const submitAnswer = useCallback((isCorrect, currentQuestion) => { // correctWord 대신 currentQuestion 객체를 받음
    if (showFeedback) return;
    
    setIsCurrentCorrect(isCorrect);
    setShowFeedback(true);
    
    // 'sentence' 속성 및 기타 불필요한 속성을 필터링하여 맞은/틀린 단어를 저장합니다.
    const sanitizedQuestion = {
        word: currentQuestion.word,
        meaning: currentQuestion.meaning,
        emoji: currentQuestion.emoji,
        levelKey: currentQuestion.levelKey,
        levelId: currentQuestion.levelId,
    };

    if (isCorrect) {
      setScore(prev => prev + 1);
      setCorrectWords(prev => [...prev, sanitizedQuestion]); // 맞은 단어 추가
      onCorrect?.(currentQuestion.word, currentQuestion.levelKey); // onCorrect 콜백 호출
    } else {
      setIncorrectWords(prev => [...prev, sanitizedQuestion]); // 틀린 단어 추가
      onMistake?.(currentQuestion); // onMistake에 전체 단어 객체 전달 (Note: onMistake still receives full object, which might be intended for some logging or specific mistake handling)
    }

    const delay = isCorrect ? 600 : 1800; // 정답 시 0.6초 후 다음 문제, 오답 시 1.8초 후 다음 문제

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowFeedback(false);
        setUserInput("");
        setSelectedAnswer(null);
      } else {
        // 마지막 문제인 경우, onFinish 콜백에 최종 점수와 단어 목록을 전달
        // Calculate final results including the current question's outcome
        const finalScore = isCorrect ? score + 1 : score;
        const finalCorrectWords = isCorrect ? [...correctWords, sanitizedQuestion] : correctWords;
        const finalIncorrectWords = isCorrect ? incorrectWords : [...incorrectWords, sanitizedQuestion];

        onFinish?.({ 
          score: finalScore, 
          correctWords: finalCorrectWords,
          incorrectWords: finalIncorrectWords
        });
      }
    }, delay);
  }, [currentIndex, questions.length, score, showFeedback, onFinish, onMistake, onCorrect, correctWords, incorrectWords]);

  return {
    currentIndex, score, showFeedback, isCurrentCorrect,
    userInput, setUserInput, selectedAnswer, setSelectedAnswer,
    submitAnswer
  };
};
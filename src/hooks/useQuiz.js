import { useState, useCallback, useRef, useEffect } from 'react';

export const useQuiz = (questions, onFinish, onMistake, onCorrect) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctWords, setCorrectWords] = useState([]);
  const [incorrectWords, setIncorrectWords] = useState([]);

  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 딜레이를 스킵하고 즉시 다음으로 넘어가는 전용 함수
  const moveToNext = useCallback(() => {
    if (!isMounted.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
      setUserInput("");
      setSelectedAnswer(null);
    } else {
      if (isFinishedRef.current) return;
      isFinishedRef.current = true;
      onFinish?.({
        score,
        correctWords,
        incorrectWords
      });
    }
  }, [currentIndex, questions.length, score, correctWords, incorrectWords, onFinish]);

  const submitAnswer = useCallback((isCorrect, currentQuestion) => {
    // 🎯 2. QuizEngine에서 인자 없이 호출(=이미 결과를 본 상태에서 스킵 요청)한 경우 캐치
    if (showFeedback || !currentQuestion) {
      moveToNext();
      return;
    }
    
    if (!isMounted.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    setIsCurrentCorrect(isCorrect);
    setShowFeedback(true);
    
    // 🎯 3. 데이터가 비어있어도 앱이 죽지 않도록 안전장치 적용
    const sanitizedQuestion = {
        word: currentQuestion?.word || '',
        meaning: currentQuestion?.meaning || '',
        emoji: currentQuestion?.emoji || '',
        levelKey: currentQuestion?.levelKey || '',
        levelId: currentQuestion?.levelId || '',
    };

    // setTimeout 내부에서 정확한 최신 상태를 참조하기 위한 지역 변수
    let newScore = score;
    let newCorrectWords = [...correctWords];
    let newIncorrectWords = [...incorrectWords];

    if (isCorrect) {
      newScore += 1;
      setScore(newScore);
      newCorrectWords.push(sanitizedQuestion);
      setCorrectWords(newCorrectWords);
      onCorrect?.(sanitizedQuestion.word, sanitizedQuestion.levelKey);
    } else {
      newIncorrectWords.push(sanitizedQuestion);
      setIncorrectWords(newIncorrectWords);
      onMistake?.(sanitizedQuestion);
    }

    const delay = isCorrect ? 800 : 2000;

    timerRef.current = setTimeout(() => {
      if (!isMounted.current) return;

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowFeedback(false);
        setUserInput("");
        setSelectedAnswer(null);
      } else {
        if (isFinishedRef.current) return;
        isFinishedRef.current = true;
        onFinish?.({
          score: newScore,
          correctWords: newCorrectWords,
          incorrectWords: newIncorrectWords
        });
      }
    }, delay);
  }, [currentIndex, questions.length, score, showFeedback, correctWords, incorrectWords, moveToNext, onCorrect, onMistake, onFinish]);

  return {
    currentIndex, score, showFeedback, isCurrentCorrect,
    userInput, setUserInput, selectedAnswer, setSelectedAnswer,
    submitAnswer
  };
};
import { useState, useCallback, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { addMistakeWord, refreshMistakesCache } from '../utils/mistakes';

export const useStorage = (key) => {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const parsed = safeGetItem(key, {});
    if (!parsed.lastUpdated) parsed.lastUpdated = 0;
    setData(parsed);
    setIsLoading(false);
  }, [key]);

  // 🎯 훅 상태가 아니라 쓰기 직전의 localStorage를 다시 읽어 그 위에 병합한다. 이 훅 밖에서(예: LevelTemplate의
  // Firebase 동기화 effect) 같은 key에 직접 쓴 최신 내용을 통째로 덮어쓰지 않기 위해서다.
  // 저장한 결과를 바로 돌려줘서 호출부가 같은 값을 Firebase에 올릴 수 있게 한다.
  const write = useCallback((updateDay, day) => {
    const current = safeGetItem(key, {});
    const updated = { ...current, [day]: updateDay(current[day] || {}), lastUpdated: Date.now() };
    safeSetItem(key, JSON.stringify(updated));
    refreshMistakesCache();
    setData(updated);
    return updated;
  }, [key]);

  const addMistake = useCallback((day, word) => write(dayData => ({
    ...dayData,
    attempts: addMistakeWord(dayData.attempts, typeof word === 'object' ? word.word : word)
  }), day), [write]);

  const saveProgress = useCallback((day, score, total, mode) => write(dayData => {
    const scores = dayData.scores || {};
    return {
      ...dayData,
      completed: true,
      bestScore: Math.max(dayData.bestScore || 0, score),
      scores: { ...scores, [mode]: Math.max(scores[mode] || 0, score) },
      total
    };
  }, day), [write]);

  return { data, isLoading, addMistake, saveProgress };
};

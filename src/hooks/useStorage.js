import { useState, useCallback, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { addMistakeWord, migrateAttempts, refreshMistakesCache } from '../utils/mistakes';

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

  const syncFromDB = useCallback((dbData) => {
    if (!dbData || !dbData.lastUpdated) return;
    if (dbData.lastUpdated > (data.lastUpdated || 0)) {
      const restoredData = JSON.parse(JSON.stringify(dbData));
      Object.keys(restoredData).forEach(dayKey => {
        if (dayKey === 'lastUpdated') return;
        const day = restoredData[dayKey];
        if (day?.attempts !== undefined) day.attempts = migrateAttempts(day.attempts);
      });
      setData(restoredData);
      safeSetItem(key, JSON.stringify(restoredData));
      refreshMistakesCache();
    }
  }, [key, data.lastUpdated]);

  // 🎯 prev(훅 마운트 시점에 로드된 상태)만 기준으로 병합하면, 이 훅 밖에서(예: LevelTemplate의
  // Firebase 동기화 effect) 같은 key에 직접 쓴 최신 localStorage 내용을 놓치고 통째로 덮어써
  // 버릴 수 있다. 쓰기 직전 localStorage를 다시 읽어 그 위에 병합한다.
  const addMistake = useCallback((day, word) => {
    setData(prev => {
      const current = safeGetItem(key, prev) || prev;
      const dayData = current[day] || { attempts: {} };
      const wordString = typeof word === 'object' ? word.word : word;
      const updated = {
        ...current,
        [day]: { ...dayData, attempts: addMistakeWord(dayData.attempts, wordString) },
        lastUpdated: Date.now()
      };
      safeSetItem(key, JSON.stringify(updated));
      refreshMistakesCache();
      return updated;
    });
  }, [key]);

  const saveProgress = useCallback((day, score, total, mode) => {
    setData(prev => {
      const current = safeGetItem(key, prev) || prev;
      const currentDay = current[day] || {};
      const currentScores = currentDay.scores || {};
      const updated = {
        ...current,
        [day]: {
          ...currentDay,
          completed: true,
          bestScore: Math.max((currentDay.bestScore || 0), score),
          scores: { ...currentScores, [mode]: Math.max((currentScores[mode] || 0), score) },
          total
        },
        lastUpdated: Date.now()
      };
      safeSetItem(key, JSON.stringify(updated));
      refreshMistakesCache();
      return updated;
    });
  }, [key]);

  return { data, isLoading, addMistake, saveProgress, syncFromDB };
};

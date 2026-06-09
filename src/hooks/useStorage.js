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

  const addMistake = useCallback((day, word) => {
    setData(prev => {
      const dayData = prev[day] || { attempts: {} };
      const wordString = typeof word === 'object' ? word.word : word;
      const updated = {
        ...prev,
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
      const currentDay = prev[day] || {};
      const currentScores = currentDay.scores || {};
      const updated = {
        ...prev,
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

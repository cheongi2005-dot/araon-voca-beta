import { useState, useCallback, useEffect } from 'react';
import { safeGetItem, safeSetJson } from '../utils/storage';
import { addMistakeWord, refreshMistakesCache } from '../utils/mistakes';
import { migrateLevelData } from '../utils/levelProgress';

/**
 * 한 레벨의 학습 기록(localStorage)을 읽고 쓰는 훅.
 *
 * 저장 형태: { [day]: { completed, bestScore, scores, total, attempts }, lastUpdated }
 * 기록이 바뀔 때마다 오답 수 캐시를 갱신해야 홈 화면 배지가 어긋나지 않습니다.
 */
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

  /** 로컬에 반영하고 오답 캐시를 다시 계산합니다. */
  const persist = useCallback((next) => {
    safeSetJson(key, next);
    refreshMistakesCache();
  }, [key]);

  /** 서버 기록이 더 최신일 때만 로컬을 덮어씁니다. */
  const syncFromDB = useCallback((dbData) => {
    if (!dbData?.lastUpdated) return;
    setData(prev => {
      if (dbData.lastUpdated <= (prev.lastUpdated || 0)) return prev;
      const restored = migrateLevelData(dbData);
      persist(restored);
      return restored;
    });
  }, [persist]);

  const addMistake = useCallback((day, word) => {
    setData(prev => {
      const dayData = prev[day] || { attempts: {} };
      const wordText = typeof word === 'object' ? word.word : word;
      const next = {
        ...prev,
        [day]: { ...dayData, attempts: addMistakeWord(dayData.attempts, wordText) },
        lastUpdated: Date.now(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const saveProgress = useCallback((day, score, total, mode) => {
    setData(prev => {
      const dayData = prev[day] || {};
      const scores = dayData.scores || {};
      const next = {
        ...prev,
        [day]: {
          ...dayData,
          completed: true,
          // 점수는 최고 기록만 남깁니다 — 재도전으로 기록이 깎이면 안 되니까요.
          bestScore: Math.max(dayData.bestScore || 0, score),
          scores: { ...scores, [mode]: Math.max(scores[mode] || 0, score) },
          total,
        },
        lastUpdated: Date.now(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  return { data, isLoading, addMistake, saveProgress, syncFromDB };
};

import { useState, useCallback } from 'react';

export const useStorage = (key) => {
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem(key) || '{}'));

  // 오답 추가 로직
  const addMistake = useCallback((day, word) => {
    setData(prev => {
      const dayData = prev[day] || { attempts: [[]] };
      const currentMistakes = dayData.attempts[0] || [];
      const wordString = typeof word === 'object' ? word.word : word;
      
      if (currentMistakes.includes(wordString)) return prev;

      const updated = {
        ...prev,
        [day]: { ...dayData, attempts: [[...currentMistakes, wordString]] }
      };
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  // ✅ 완료 및 모드별 최고 점수 저장 (mode 파라미터 추가)
  const saveProgress = useCallback((day, score, total, mode) => {
    setData(prev => {
      const currentDay = prev[day] || {};
      const currentScores = currentDay.scores || {};
      
      // 해당 모드(4지선다, 철자 등)의 이전 기록과 비교하여 최고점 갱신
      const newModeScore = Math.max((currentScores[mode] || 0), score);

      const updated = {
        ...prev,
        [day]: { 
          ...currentDay, 
          completed: true, 
          // 1. 전체 통합 최고 점수 유지 (기존 UI 호환용)
          bestScore: Math.max((currentDay.bestScore || 0), score),
          // 2. 모드별 개별 점수 저장소 운영 (신규 로직)
          scores: {
            ...currentScores,
            [mode]: newModeScore
          },
          total 
        }
      };
      
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  return { data, addMistake, saveProgress };
};
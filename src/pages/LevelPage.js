import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import QuizEngine from '../components/QuizEngine';
import { useStorage } from '../hooks/useStorage';
import { LEVEL_CONFIG } from '../config/levelConfig'; // 레벨별 데이터 매핑 파일

const LevelPage = () => {
  const { levelId } = useParams();
  const config = LEVEL_CONFIG[levelId];
  const { data, addMistake, saveProgress } = useStorage(config.key);
  const [view, setView] = useState('home'); // home, quiz, result

  // 퀴즈가 끝났을 때의 공통 로직
  const handleQuizFinish = (finalScore, day, total) => {
    saveProgress(day, finalScore, total);
    setView('result');
  };

  return (
    <div className="layout">
      {view === 'home' && <LevelHome data={data} config={config} onStart={() => setView('quiz')} />}
      {view === 'quiz' && (
        <QuizEngine 
          questions={config.data[selectedDay]} 
          onMistake={(word) => addMistake(selectedDay, word)}
          onFinish={(score) => handleQuizFinish(score, selectedDay, config.data[selectedDay].length)}
        />
      )}
    </div>
  );
};
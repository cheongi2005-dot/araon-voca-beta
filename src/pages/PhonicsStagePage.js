import { LEVEL_CONFIG } from '../config/levelConfig';
import AppHeader from '../components/AppHeader';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PHONICS_STAGES } from '../data/phonicsData';

const PhonicsStagePage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans pb-10">
      <div className="max-w-md mx-auto">
        {/* 헤더: Home.js와 동일한 스타일 적용 */}
        <AppHeader themeColor={LEVEL_CONFIG.phonics.color} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/')} />

        {/* 스테이지 리스트 */}
        <div className="p-6 space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-white">소리의 규칙을<br/>발견해 보세요! 🎧</h2>
            <p className="text-sm font-bold text-zinc-400 mt-2">알파벳이 모여서 내는 진짜 소리</p>
          </div>

          {PHONICS_STAGES.map((stage, index) => (
            <button 
              key={stage.id}
              onClick={() => {
                // App.js에 정의된 경로로 이동합니다.
                navigate(`/phonics/play/${stage.id}`);
              }}
              className="w-full p-5 flex items-center justify-between bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-lg shadow-none active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl">
                  {stage.targetSound.toUpperCase()}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-white">{stage.title}</h3>
                  <p className="text-xs font-bold text-zinc-400 mt-0.5">{stage.subTitle || (stage.targetSound + ' 소리의 비밀')}</p>
                </div>
              </div>
              <i className="ph-bold ph-play-circle text-2xl text-zinc-300 dark:text-zinc-600"></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhonicsStagePage;

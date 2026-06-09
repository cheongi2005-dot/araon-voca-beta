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
        <header className="sticky top-0 z-20 flex flex-col bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
          <div className="flex-1 flex items-center px-6 justify-between w-full h-16">
            <button onClick={() => navigate('/')} className="p-2 text-black dark:text-white active:scale-90 transition-transform">
              <i className="ph-bold ph-caret-left text-2xl"></i>
            </button>
            <div className="flex items-center gap-2">
              <img 
                src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`}
                alt="ARAON" 
                className="h-10 w-auto" 
              />
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md text-[9px] font-black uppercase tracking-tighter border border-amber-200 dark:border-amber-800/50 mb-4">Beta</span>
            </div>
            <button onClick={() => setIsDark(!isDark)} className="p-2 text-black dark:text-white active:scale-90 transition-transform">
              <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i>
            </button>
          </div>
        </header>

        {/* 스테이지 리스트 */}
        <div className="p-6 space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-zinc-800 dark:text-white">소리의 규칙을<br/>발견해 보세요! 🎧</h2>
            <p className="text-sm font-bold text-zinc-400 mt-2">알파벳이 모여서 내는 진짜 소리</p>
          </div>

          {PHONICS_STAGES.map((stage, index) => (
            <button 
              key={stage.id}
              onClick={() => {
                // App.js에 정의된 경로로 이동합니다.
                navigate(`/phonics/play/${stage.id}`);
              }}
              className="w-full p-5 flex items-center justify-between bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm active:scale-95 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-xl">
                  {stage.targetSound.toUpperCase()}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-black text-zinc-800 dark:text-white">{stage.title}</h3>
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

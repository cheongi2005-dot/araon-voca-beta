import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';

function Home() {
  // 테마 상태 초기화
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(() => 
    parseInt(localStorage.getItem('araon_voca_voice_idx') || '0')
  );

  // 다크모드 적용 로직
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 오답 개수 계산
  const totalMistakes = useMemo(() => {
    let count = 0;
    Object.values(LEVEL_CONFIG).forEach(config => {
      const data = JSON.parse(localStorage.getItem(config.key) || '{}');
      const levelWords = new Set();
      Object.values(data).forEach(d => {
        if (d.attempts) {
          d.attempts.flat().forEach(w => levelWords.add(w));
        }
      });
      count += levelWords.size;
    });
    return count;
  }, []);

  return (
    <div 
      className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans pb-10"
      style={{ 
        // 기본 여백 24px + 앱일 경우 노치 여백 추가
        paddingTop: 'calc(24px + env(safe-area-inset-top))' 
      }}
    >
      <div className="max-w-md mx-auto px-8">
        
        {/* 헤더 섹션 */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <img 
              src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.png` : `${process.env.PUBLIC_URL}/Araon_logo.png`} 
              alt="ARAON" 
              className="h-16 w-auto object-contain" 
            />
          </div>
          <button 
            onClick={() => setIsDark(!isDark)} 
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors active:scale-90"
          >
            <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl text-black dark:text-white`}></i>
          </button>
        </header>

        {/* 나의 단어장 카드 */}
        <Link to="/my-voca" className="group block mb-8">
          <div className="flex items-center justify-between bg-white dark:bg-[#1E1E1E] p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 active:scale-[0.98] transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#70011D] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#70011D]/20">
                <i className="ph-fill ph-star text-2xl"></i>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-[#70011D] dark:text-[#E2A4A4] mb-0.5">Personal Collection</h3>
                <p className="text-xl font-bold dark:text-white">
                  나의 단어장
                  <span className="ml-2 text-xs px-2.5 py-1 bg-[#70011D] text-white rounded-full font-bold">
                    {totalMistakes}
                  </span>
                </p>
              </div>
            </div>
            <i className="ph-bold ph-caret-right text-[#70011D]/40 group-hover:text-[#70011D] dark:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors text-xl"></i>
          </div>
        </Link>

        {/* 레벨 네비게이션 리스트 */}
        <nav className="space-y-4">
          {Object.keys(LEVEL_CONFIG).map((pathKey) => {
            const m = LEVEL_CONFIG[pathKey];
            return (
              <Link key={pathKey} to={`/${pathKey}`} className="group block">
                <div className="flex items-center justify-between bg-white dark:bg-[#1E1E1E] p-5 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <span className="text-sm font-black text-zinc-300 dark:text-zinc-600 w-6">{m.id}</span>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: m.color }}>{m.title}</h3>
                      <p className="text-lg font-bold tracking-tight dark:text-white">{m.subTitle}</p>
                    </div>
                  </div>
                  <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 dark:text-zinc-700 dark:group-hover:text-zinc-500 transition-colors"></i>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 푸터: 음성 설정 */}
        <footer className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-100 dark:bg-[#1E1E1E] p-4 rounded-2xl flex items-center">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mr-4 border-r border-zinc-200 dark:border-zinc-800">
              Voice
            </label>
            <select 
              value={selectedVoiceIndex} 
              onChange={(e) => { 
                setSelectedVoiceIndex(parseInt(e.target.value)); 
                localStorage.setItem('araon_voca_voice_idx', e.target.value); 
              }} 
              className="flex-1 bg-transparent text-xs font-bold outline-none dark:text-zinc-300 appearance-none cursor-pointer"
            >
              {voices.map((v, i) => (
                <option key={i} value={i} className="dark:bg-[#1E1E1E]">{v.name}</option>
              ))}
            </select>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from '../components/LoadingScreen';
import { safeGetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';

const LEVEL_MAP = [
  { id: "00", name: "Phonics", title: "파닉스 학습", sub: "(소리의 규칙)", path: "/phonics", color: "#4F46E5", key: "araon_voca_phonics", days: 1 },
  { id: "01", name: "Foundation", title: "초등 기초 100", path: "/elementary-100", color: "#FFD000", key: "araon_voca_elementary_100", days: 100 },
  { id: "02", name: "Essential", title: "Level 1", sub: "(초등 필수)", path: "/level-1", color: "#E29526", key: "araon_voca_level_1", days: 30 },
  { id: "03", name: "Intermediate", title: "Level 2", sub: "(중등 기초)", path: "/level-2", color: "#9CAF88", key: "araon_voca_level_2", days: 30 },
  { id: "04", name: "Advanced", title: "Level 3", sub: "(중등 심화)", path: "/level-3", color: "#006039", key: "araon_voca_level_3", days: 30 },
  { id: "05", name: "Expert", title: "Level 4", sub: "(고등 기초)", path: "/level-4", color: "#151E3D", key: "araon_voca_level_4", days:25 },
  { id: "06", name: "Academic", title: "Level 5", sub: "(고등 심화)", path: "/level-5", color: "#32127A", key: "araon_voca_level_5", days: 30 },
];

function LevelHome() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  
  // ✅ [수정 1] 시작할 때 로컬 캐시에서 내 레벨을 먼저 꺼내옵니다.
  const [currentLevelTitle, setCurrentLevelTitle] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('araon_cached_user') || '{}');
      return cached.currentLevel || "";
    } catch (e) {
      return "";
    }
  }); 

  const [isLoading, setIsLoading] = useState(!auth.currentUser);
  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(false);

        try {
          const docSnap = await getDoc(doc(db, "users", user.email));
          if (docSnap.exists()) {
            const userData = docSnap.data();

            if (userData.currentLevel) {
              setCurrentLevelTitle(userData.currentLevel);
              try {
                const cached = JSON.parse(localStorage.getItem('araon_cached_user') || '{}');
                cached.currentLevel = userData.currentLevel;
                localStorage.setItem('araon_cached_user', JSON.stringify(cached));
              } catch (e) {}
            }

            setTimeout(() => {
              const progressMap = {};
              LEVEL_MAP.forEach(level => {
                const dbData = userData.levelProgress?.[level.key] || {};
                let localData = {};
                try {
                  localData = JSON.parse(localStorage.getItem(level.key) || '{}');
                } catch (e) {
                  localData = {};
                }

                const dbTime = dbData.lastUpdated || 0;
                const localTime = localData.lastUpdated || 0;
                const finalData = Object.keys(dbData).length > 0
                  ? (dbTime >= localTime ? { ...dbData } : localData)
                  : localData;

                localStorage.setItem(level.key, JSON.stringify(finalData));

                let completedCount = Object.values(finalData).filter(item => item && typeof item === 'object' && item.completed).length;

                if (completedCount === 0 && Array.isArray(userData.attendance)) {
                  const levelPathId = level.path.slice(1);
                  const completedDaysSet = new Set();
                  userData.attendance.forEach(record => {
                    if (typeof record === 'string' || !record.day) return;
                    if (!String(record.type || '').includes('문제풀이')) return;
                    if (String(record.levelId || '').toLowerCase() !== levelPathId.toLowerCase()) return;
                    completedDaysSet.add(String(record.day));
                  });
                  completedCount = completedDaysSet.size;
                }

                progressMap[level.id] = {
                  completed: completedCount,
                  percent: Math.min(Math.round((completedCount / level.days) * 100), 100)
                };
              });
              setProgressData(progressMap);
            }, 100);
          }
        } catch (e) {
          console.error("LevelHome fetch error:", e);
        }
      } else {
        setIsLoading(false);
        navigate('/');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleLevelSelect = async (level) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const history = safeGetItem(level.key, {});
        const completedCount = Object.values(history).filter(d => d.completed).length;
        const nextDay = level.name === "Phonics" ? `Stage ${completedCount + 1}` : `Day ${completedCount + 1}`;

        await setDoc(doc(db, "users", user.email), { currentLevel: level.name, currentDay: nextDay }, { merge: true });
        
        const cached = localStorage.getItem('araon_cached_user');
        if (cached) {
          const userData = JSON.parse(cached);
          userData.currentLevel = level.name;
          userData.currentDay = nextDay;
          localStorage.setItem('araon_cached_user', JSON.stringify(userData));
        }
        navigate('/');
      } catch (e) {
        console.error("레벨 업데이트 오류:", e);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <header className="sticky top-0 z-30 flex items-center px-6 justify-between w-full h-16 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors">
        <button onClick={() => navigate('/settings')} className="p-2 text-black dark:text-white active:opacity-70 rounded-full"><i className="ph-bold ph-caret-left text-2xl"></i></button>
        <img src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`} alt="ARAON" className="h-10 w-auto" />
        <button onClick={() => setIsDark(!isDark)} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i></button>
      </header>

      <main className="flex-1 py-8 px-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-1">Course Selection</p>
          <h2 className="text-2xl font-black dark:text-white leading-tight tracking-tight">학습하실 레벨을<br/>선택해 주세요</h2>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {LEVEL_MAP.map((level) => {
            const progress = progressData[level.id] || { completed: 0, percent: 0 };
            const isCurrent = currentLevelTitle === level.name;

            return (
              <div key={level.id} onClick={() => handleLevelSelect(level)} className={`group block active:scale-[0.98] transition-all cursor-pointer border-2 rounded-[1.8rem] overflow-hidden ${isCurrent ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-transparent'}`}>
                <div className="p-5 bg-white dark:bg-[#1E1E1E] shadow-sm relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm" style={{ backgroundColor: level.color }}>
                        {level.id === "00" ? <i className="ph-fill ph-headphones"></i> : level.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.name}</h3>
                          {isCurrent && <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Current</span>}
                        </div>
                        <p className="text-[16px] font-bold dark:text-white tracking-tight">{level.title} <span className="text-[11px] font-medium text-zinc-400 ml-0.5">{level.sub}</span></p>
                      </div>
                    </div>
                    {isCurrent ? <i className="ph-fill ph-check-circle text-indigo-500 text-2xl"></i> : <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors text-xl"></i>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex justify-between items-center mb-2 px-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter">Progress</span>
                      <span className="text-[10px] font-black text-zinc-400">{progress.completed} / {level.days} {level.name === "Phonics" ? "Stages" : "Days"}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${progress.percent}%`, backgroundColor: level.color, opacity: progress.percent > 0 ? 1 : 0.3 }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <footer className="py-8 text-center"><p className="text-[9px] text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-[0.4em]">Araon Voca Professional</p></footer>
    </div>
  );
}

export default LevelHome;
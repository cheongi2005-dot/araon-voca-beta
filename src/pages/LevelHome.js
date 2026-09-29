import AppHeader from '../components/AppHeader';
import AraonIcon from '../components/AraonIcon';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, setDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import { safeGetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { useUserData } from '../contexts/UserDataContext';

const LEVEL_MAP = [
  { id: "00", name: "Phonics", title: "파닉스 학습", sub: "(소리의 규칙)", path: "/phonics", color: "#4F46E5", key: "araon_voca_phonics", days: 1 },
  { id: "01", name: "Foundation", title: "초등 기초 100", path: "/elementary-100", color: "#FFD000", key: "araon_voca_elementary_100", days: 100 },
  { id: "02", name: "Essential", title: "Level 1", sub: "(초등 필수)", path: "/level-1", color: "#E29526", key: "araon_voca_level_1", days: 30 },
  { id: "03", name: "Intermediate", title: "Level 2", sub: "(중등 기초)", path: "/level-2", color: "#9CAF88", key: "araon_voca_level_2", days: 30 },
  { id: "04", name: "Advanced", title: "Level 3", sub: "(중등 심화)", path: "/level-3", color: "#006039", key: "araon_voca_level_3", days: 30 },
  { id: "05", name: "Expert", title: "Level 4", sub: "(고등 기초)", path: "/level-4", color: "#151E3D", key: "araon_voca_level_4", days:25 },
  { id: "06", name: "Academic", title: "Level 5", sub: "(고등 심화)", path: "/level-5", color: "#000080", key: "araon_voca_level_5", days: 30 },
];

function LevelHome() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData, isLoading } = useUserData();
  const currentLevelTitle = userData?.currentLevel || "";

  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    if (!isLoading && !userData) navigate('/');
  }, [isLoading, userData, navigate]);

  useEffect(() => {
    if (!userData) return;

    const timer = setTimeout(() => {
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

    return () => clearTimeout(timer);
  }, [userData]);

  const handleLevelSelect = async (level) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const history = safeGetItem(level.key, {});
        const completedCount = Object.values(history).filter(d => d.completed).length;
        const nextDay = level.name === "Phonics" ? `Stage ${completedCount + 1}` : `Day ${completedCount + 1}`;

        await setDoc(doc(db, "users", user.email), { currentLevel: level.name, currentDay: nextDay }, { merge: true });
        // 🎯 UserDataContext의 실시간 구독이 곧 최신 currentLevel을 반영하므로 로컬 캐시 수동 갱신 불필요
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
      <AppHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/settings')} />

      <main className="flex-1 py-8 px-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest mb-1">Course Selection</p>
          <h2 className="text-2xl font-bold dark:text-white leading-tight tracking-tight">학습하실 레벨을<br/>선택해 주세요</h2>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {LEVEL_MAP.map((level) => {
            const progress = progressData[level.id] || { completed: 0, percent: 0 };
            const isCurrent = currentLevelTitle === level.name;

            return (
              <div key={level.id} onClick={() => handleLevelSelect(level)} className={`group block active:opacity-80 transition-all cursor-pointer border-2 rounded-lg overflow-hidden ${isCurrent ? 'border-indigo-500 shadow-none ' : 'border-transparent'}`}>
                <div className="p-5 bg-white dark:bg-[#1E1E1E] shadow-none relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-none" style={{ backgroundColor: level.color }}>
                        {level.id === "00" ? <AraonIcon name="help" size={32} style={{ background: '#F8F1E5', borderRadius: 8 }} /> : level.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: level.color }}>{level.name}</h3>
                          {isCurrent && <span className="text-[8px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Current</span>}
                        </div>
                        <p className="text-[16px] font-bold dark:text-white tracking-tight">{level.title} <span className="text-[11px] font-medium text-zinc-400 ml-0.5">{level.sub}</span></p>
                      </div>
                    </div>
                    {isCurrent ? <AraonIcon name="check" size={28} /> : <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors text-xl"></i>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex justify-between items-center mb-2 px-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter">Progress</span>
                      <span className="text-[10px] font-bold text-zinc-400">{progress.completed} / {level.days} {level.name === "Phonics" ? "Stages" : "Days"}</span>
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
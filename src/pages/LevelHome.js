import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LEVELS } from '../config/levelConfig';
import { STORAGE_KEYS } from '../config/storageKeys';
import { safeGetItem, safeSetJson } from '../utils/storage';
import { countCompletedDays, mergeLevelData } from '../utils/levelProgress';
import { useTheme } from '../hooks/useTheme';
import LoadingScreen from '../components/LoadingScreen';
import AppHeader from '../components/AppHeader';

/** 진도 계산은 첫 렌더를 막지 않도록 뒤로 미룹니다. */
const PROGRESS_CALC_DELAY_MS = 100;

/**
 * levelProgress에 완료 기록이 없는 예전 계정을 위해 attendance에서 완료 Day 수를 역산합니다.
 * LevelTemplate의 backfill과 달리 여기서는 개수만 필요합니다.
 */
const countCompletedFromAttendance = (attendance, levelPath) => {
  if (!Array.isArray(attendance)) return 0;
  const levelPathId = levelPath.slice(1);
  const completedDays = new Set();
  attendance.forEach(record => {
    if (typeof record === 'string' || !record?.day) return;
    if (!String(record.type || '').includes('문제풀이')) return;
    if (String(record.levelId || '').toLowerCase() !== levelPathId.toLowerCase()) return;
    completedDays.add(String(record.day));
  });
  return completedDays.size;
};

function LevelHome() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();

  // 캐시에서 현재 레벨을 먼저 꺼내 화면이 비어 보이지 않게 합니다.
  const [currentLevelTitle, setCurrentLevelTitle] = useState(
    () => safeGetItem(STORAGE_KEYS.cachedUser, {})?.currentLevel || ''
  );
  const [isLoading, setIsLoading] = useState(!auth.currentUser);
  const [progressData, setProgressData] = useState({});

  useEffect(() => {
    let progressTimer;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoading(false);
        navigate('/');
        return;
      }
      setIsLoading(false);

      try {
        const snapshot = await getDoc(doc(db, 'users', user.email));
        if (!snapshot.exists()) return;
        const userData = snapshot.data();

        if (userData.currentLevel) {
          setCurrentLevelTitle(userData.currentLevel);
          const cached = safeGetItem(STORAGE_KEYS.cachedUser, {});
          safeSetJson(STORAGE_KEYS.cachedUser, { ...cached, currentLevel: userData.currentLevel });
        }

        progressTimer = setTimeout(() => {
          const progressMap = {};
          LEVELS.forEach(level => {
            const merged = mergeLevelData(userData.levelProgress?.[level.key], safeGetItem(level.key, {}));
            safeSetJson(level.key, merged);

            const completed = countCompletedDays(merged)
              || countCompletedFromAttendance(userData.attendance, level.path);

            progressMap[level.id] = {
              completed,
              percent: Math.min(Math.round((completed / level.days) * 100), 100),
            };
          });
          setProgressData(progressMap);
        }, PROGRESS_CALC_DELAY_MS);
      } catch (error) {
        console.error('LevelHome fetch error:', error);
      }
    });

    return () => {
      unsubscribe();
      if (progressTimer) clearTimeout(progressTimer);
    };
  }, [navigate]);

  const handleLevelSelect = async (level) => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const completed = countCompletedDays(safeGetItem(level.key, {}));
      const nextDay = `${level.unit} ${completed + 1}`;

      await setDoc(doc(db, 'users', user.email), { currentLevel: level.title, currentDay: nextDay }, { merge: true });

      const cached = safeGetItem(STORAGE_KEYS.cachedUser, null);
      if (cached) safeSetJson(STORAGE_KEYS.cachedUser, { ...cached, currentLevel: level.title, currentDay: nextDay });
    } catch (error) {
      console.error('레벨 업데이트 오류:', error);
    } finally {
      navigate('/');
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <AppHeader isDark={isDark} onToggleTheme={setIsDark} backTo="/settings" />

      <main className="flex-1 py-8 px-6 overflow-y-auto">
        <div className="mb-10 px-2">
          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-1">Course Selection</p>
          <h2 className="text-2xl font-black dark:text-white leading-tight tracking-tight">
            학습하실 레벨을<br />선택해 주세요
          </h2>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {LEVELS.map(level => {
            const progress = progressData[level.id] || { completed: 0, percent: 0 };
            const isCurrent = currentLevelTitle === level.title;

            return (
              <div
                key={level.id}
                onClick={() => handleLevelSelect(level)}
                className={`group block active:scale-[0.98] transition-all cursor-pointer border-2 rounded-[1.8rem] overflow-hidden ${isCurrent ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-transparent'}`}
              >
                <div className="p-5 bg-white dark:bg-[#1E1E1E] shadow-sm relative">
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm" style={{ backgroundColor: level.color }}>
                        {level.id === '00' ? <i className="ph-fill ph-headphones"></i> : level.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: level.color }}>{level.title}</h3>
                          {isCurrent && (
                            <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Current</span>
                          )}
                        </div>
                        <p className="text-[16px] font-bold dark:text-white tracking-tight">{level.subTitle}</p>
                      </div>
                    </div>
                    {isCurrent
                      ? <i className="ph-fill ph-check-circle text-indigo-500 text-2xl"></i>
                      : <i className="ph-bold ph-caret-right text-zinc-200 group-hover:text-zinc-400 transition-colors text-xl"></i>}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex justify-between items-center mb-2 px-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-tighter">Progress</span>
                      <span className="text-[10px] font-black text-zinc-400">
                        {progress.completed} / {level.days} {level.unit}s
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-1000 rounded-full"
                        style={{ width: `${progress.percent}%`, backgroundColor: level.color, opacity: progress.percent > 0 ? 1 : 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="text-[9px] text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-[0.4em]">Araon Voca Professional</p>
      </footer>
    </div>
  );
}

export default LevelHome;

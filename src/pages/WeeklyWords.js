import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import SpeakerIcon from '../components/SpeakerIcon';
import LoadingScreen from '../components/LoadingScreen';
import { LEVEL_CONFIG } from '../config/levelConfig';
import { useTheme } from '../hooks/useTheme';
import { useSpeech } from '../hooks/useSpeech';
import { useUserData } from '../contexts/UserDataContext';
import { getWeeklyQuizDays } from '../utils/progress';

const LEVEL_ORDER = Object.keys(LEVEL_CONFIG);

// 홈 '이번 주 학습 단어'를 누르면 오는 화면: 이번 주 퀴즈를 푼 Day의 단어를 Day별로 보여준다.
export default function WeeklyWords() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  const { speak } = useSpeech();
  const { userData, isLoading } = useUserData();
  const [sections, setSections] = useState(null);

  useEffect(() => {
    if (!userData) { if (!isLoading) navigate('/'); return; }
    const days = getWeeklyQuizDays(userData.attendance)
      .sort((a, b) => LEVEL_ORDER.indexOf(a.levelId) - LEVEL_ORDER.indexOf(b.levelId) || Number(a.day) - Number(b.day));
    let alive = true;
    Promise.all([...new Set(days.map(d => d.levelId))].map(id => LEVEL_CONFIG[id].loadData().then(m => [id, m])))
      .then(mods => {
        if (!alive) return;
        const byId = Object.fromEntries(mods);
        setSections(days.map(d => ({ ...d, config: LEVEL_CONFIG[d.levelId], title: byId[d.levelId].DAY_TITLES?.[d.day], words: byId[d.levelId].DATA_BY_DAY?.[d.day] || [] })));
      })
      .catch(e => { console.error('[WeeklyWords] 단어 데이터 로드 실패:', e); if (alive) setSections([]); });
    return () => { alive = false; };
  }, [userData, isLoading, navigate]);

  if (!sections) return <LoadingScreen />;
  const total = sections.reduce((n, s) => n + s.words.length, 0);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      <AppHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/')} />
      <main className="flex-1 px-6 py-8 flex flex-col gap-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">이번 주 학습한 단어</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">퀴즈를 푼 Day {sections.length}개 · 단어 {total}개</p>
        </section>

        {sections.length === 0 && (
          <p className="py-16 text-center text-sm font-bold text-zinc-400">이번 주에 퀴즈를 푼 Day가 아직 없어요.</p>
        )}

        {sections.map(s => (
          <section key={`${s.levelId}/${s.day}`}>
            <h2 className="px-1 mb-2 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {s.config.level ? `Level ${s.config.level}` : s.config.title} · Day {s.day}{s.title ? ` ${s.title}` : ''}
            </h2>
            <ul className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1E1E1E] divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {s.words.map(item => (
                <li key={item.word} className="min-h-[56px] px-4 py-2 flex items-center gap-3">
                  {item.emoji && <span className="text-xl" aria-hidden="true">{item.emoji}</span>}
                  <span className="text-lg font-semibold text-zinc-900 dark:text-white" lang="en">{item.word}</span>
                  <span className="flex-1 min-w-0 truncate text-sm text-zinc-500 dark:text-zinc-400">{item.meaning}</span>
                  <button type="button" onClick={() => speak(item.word)} aria-label={`${item.word} 발음 듣기`} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center active:opacity-70" style={{ color: s.config.color }}>
                    <SpeakerIcon size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

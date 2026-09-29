import AppHeader from '../components/AppHeader';
import AraonIcon from '../components/AraonIcon';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getMessagingInstance } from '../firebase-config';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getToken } from "firebase/messaging";
import { useSyncSettings } from '../hooks/useSyncSettings';
import { useTheme } from '../hooks/useTheme';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState("21:00");
  
  // 🎯 useSyncSettings 훅 사용 (자동 클라우드 동기화)
  const [settings, updateSettings] = useSyncSettings();

  // 기본값 설정 (settings가 null일 경우 대비)
  const currentSettings = settings || {
    pushRanking: true,
    rankingTypes: ['hall', 'level', 'passion'],
    pushMistakes: true,
    mistakeInterval: 60,
    pushStreak: true,
    streakTime: "21:00",
    quizSound: true,
    quizEmoji: true
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const messaging = await getMessagingInstance();
        const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (token) {
          const user = auth.currentUser;
          if (user) {
            const { db } = await import('../firebase-config');
            await setDoc(doc(db, "users", user.email), { 
              fcmToken: token,
              lastTokenUpdate: serverTimestamp() 
            }, { merge: true });
          }
        }
      } else {
        alert("알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해 주세요.");
      }
    } catch (error) {
      console.error("FCM Token Error:", error);
    }
  };

  const toggleSetting = async (key) => {
    const newActiveState = !currentSettings[key];
    const newSettings = { ...currentSettings, [key]: newActiveState };
    if (newActiveState && key.startsWith('push')) await requestNotificationPermission();
    updateSettings(newSettings);
  };


  const setMistakeInterval = (minutes) => {
    updateSettings({ ...currentSettings, mistakeInterval: minutes });
  };

  const handleTimeChange = (newTime) => {
    updateSettings({ ...currentSettings, streakTime: newTime });
  };

  const openPicker = () => { setTempTime(currentSettings.streakTime || "21:00"); setShowPicker(true); };
  const confirmTime = () => { handleTimeChange(tempTime); setShowPicker(false); };

  const handleTestNotification = async () => {
    if (Notification.permission !== 'granted') {
      alert("브라우저 알림 권한이 없습니다. 알림을 허용해 주세요.");
      return;
    }
    try {
      // serviceWorker.ready는 등록이 끝내 안 되면 영원히 멈출 수 있어 타임아웃을 둠
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('알림 서비스 준비 시간이 초과되었습니다.')), 5000))
      ]);
      await registration.showNotification("🔔 아라온 보카 테스트", {
        body: "알림 서비스가 정상적으로 연결되었습니다!",
        icon: "/logo-v2-192.png",
        tag: "test-notif"
      });
      alert("테스트 알림을 발송했습니다.");
    } catch (error) {
      alert("오류 발생: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased relative overflow-hidden text-zinc-900 dark:text-white pb-10">
      <AppHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/settings')} />

      <main className="flex-1 p-6">
        <div className="mb-10 px-2">
          <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest mb-1">Preferences</p>
          <h2 className="text-2xl font-bold leading-tight tracking-tight">개인별 학습 환경 및<br/>알림 설정</h2>
        </div>

        <div className="space-y-6">
          
          {/* 🎯 퀴즈 학습 설정 (추가) */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Quiz Experience</h3>
            <div className="p-6 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-none space-y-5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center"><AraonIcon name="music" size={28} /></div><div><h3 className="text-sm font-bold">퀴즈 효과음</h3><p className="text-[10px] text-zinc-400 font-medium">정답/오답 시 소리 재생</p></div></div>
                <ToggleButton active={currentSettings.quizSound} onClick={() => toggleSetting('quizSound')} />
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-zinc-50 dark:border-zinc-800/50">
                <div className="flex items-center gap-4"><div className="w-11 h-11 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg flex items-center justify-center"><AraonIcon name="hint" size={28} /></div><div><h3 className="text-sm font-bold">이모지 힌트</h3><p className="text-[10px] text-zinc-400 font-medium">퀴즈 중 이미지 힌트 노출</p></div></div>
                <ToggleButton active={currentSettings.quizEmoji} onClick={() => toggleSetting('quizEmoji')} />
              </div>
            </div>
          </section>

          {/* 🎯 알림 설정 */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Push Notifications</h3>
            <div className="space-y-4">
              <div className="p-6 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-none space-y-5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><div className="w-11 h-11 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg flex items-center justify-center"><AraonIcon name="review" size={28} /></div><div><h3 className="text-sm font-bold">오답 복습 알림</h3><p className="text-[10px] text-zinc-400 font-medium">잊기 전 틀린 단어 상기</p></div></div>
                  <ToggleButton active={currentSettings.pushMistakes} onClick={() => toggleSetting('pushMistakes')} />
                </div>
                {currentSettings.pushMistakes && (
                  <div className="pt-5 border-t border-zinc-50 dark:border-zinc-800/50 flex flex-wrap gap-2 animate__animated animate__fadeIn">
                    {[ { val: 30, label: '30분' }, { val: 60, label: '1시간' }, { val: 120, label: '2시간' }, { val: 1440, label: '내일' } ].map(time => {
                      const isActive = currentSettings.mistakeInterval === time.val;
                      return (
                        <button key={time.val} onClick={() => setMistakeInterval(time.val)} className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all border ${isActive ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-none' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>{time.label}</button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 bg-white dark:bg-[#1E1E1E] rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-none space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4"><div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center"><AraonIcon name="passion" tone="green" size={28} /></div><div><h3 className="text-sm font-bold">출석 유지 알림</h3><p className="text-[10px] text-zinc-400 font-medium">학습 스트릭 지키기</p></div></div>
                  <ToggleButton active={currentSettings.pushStreak} onClick={() => toggleSetting('pushStreak')} />
                </div>
                {currentSettings.pushStreak && (
                  <button onClick={openPicker} className="w-full flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800/50 active:opacity-50 animate__animated animate__fadeIn">
                    <span className="text-xs font-bold text-zinc-500">지정 시간</span>
                    <div className="flex items-center gap-2"><span className="text-base font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-xl">{currentSettings.streakTime}</span></div>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 px-2">
          <button onClick={handleTestNotification} className="w-full py-4 bg-zinc-100 dark:bg-[#1E1E1E] text-zinc-600 dark:text-zinc-300 rounded-lg font-bold text-xs active:scale-95 transition-all border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 shadow-none">
            <AraonIcon name="bell" size={22} /> 알림 테스트하기
          </button>
        </div>
      </main>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPicker(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-t-lg p-8 pb-12 shadow-none animate__animated animate__slideInUp">
            <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-8"></div>
            <h3 className="text-lg font-bold text-center mb-8">알림 시간 선택</h3>
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => { const h = (parseInt(tempTime.split(':')[0]) + 1) % 24; setTempTime(`${h.toString().padStart(2, '0')}:${tempTime.split(':')[1]}`); }} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400"><i className="ph-bold ph-caret-up text-xl"></i></button>
                <span className="text-5xl font-bold tabular-nums">{tempTime.split(':')[0]}</span>
                <button onClick={() => { const h = (parseInt(tempTime.split(':')[0]) + 23) % 24; setTempTime(`${h.toString().padStart(2, '0')}:${tempTime.split(':')[1]}`); }} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400"><i className="ph-bold ph-caret-down text-xl"></i></button>
              </div>
              <span className="text-3xl font-bold text-zinc-200 dark:text-zinc-800">:</span>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => { const m = (parseInt(tempTime.split(':')[1]) + 5) % 60; setTempTime(`${tempTime.split(':')[0]}:${m.toString().padStart(2, '0')}`); }} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400"><i className="ph-bold ph-caret-up text-xl"></i></button>
                <span className="text-5xl font-bold tabular-nums">{tempTime.split(':')[1]}</span>
                <button onClick={() => { const m = (parseInt(tempTime.split(':')[1]) + 55) % 60; setTempTime(`${tempTime.split(':')[0]}:${m.toString().padStart(2, '0')}`); }} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-full text-zinc-400"><i className="ph-bold ph-caret-down text-xl"></i></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowPicker(false)} className="py-4 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 font-bold rounded-lg">취소</button>
              <button onClick={confirmTime} className="py-4 bg-emerald-500 text-white font-bold rounded-lg shadow-none ">설정 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleButton = ({ active, onClick }) => (
  <button onClick={onClick} className={`w-12 h-6 rounded-full relative flex items-center transition-all ${active ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
    <div className={`w-4 h-4 bg-white rounded-full shadow-none absolute transition-all duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} style={{ left: '4px' }} />
  </button>
);

export default NotificationSettings;
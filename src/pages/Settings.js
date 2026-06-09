import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { signOut, deleteUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useSpeech } from '../hooks/useSpeech';
import { safeGetItem } from '../utils/storage';
import { useTheme } from '../hooks/useTheme';

const Settings = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const { voices, voiceConfig, setVoiceConfig } = useSpeech();
  
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(() => {
    const name = localStorage.getItem('araon_voca_voice_name');
    const idx = voices.findIndex(v => v.name === name);
    return idx === -1 ? 0 : idx;
  });
  const [useAI, setUseAI] = useState(() => safeGetItem('araon_voca_use_ai', true));
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  
  const [showPrivacyManager, setShowPrivacyManager] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // 캐시에서 읽기 — name/phone은 캐시에 없으므로 패널 열 때만 fetch
  const [studentInfo, setStudentInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('araon_cached_user') || 'null');
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('araon_voca_use_ai', JSON.stringify(useAI));
  }, [useAI]);

  // 로그아웃 감지만 — Firebase 패치 없음
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // 개인정보 패널 열릴 때만 name/phone 포함 전체 정보 fetch
  const openPrivacyManager = async () => {
    setShowPrivacyManager(true);
    if (studentInfo?.name) return; // 이미 있으면 재사용
    setPrivacyLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.email));
        if (snap.exists()) setStudentInfo(snap.data());
      }
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleSignOut = () => setModal({ type: 'signout' });
  const handleWithdrawal = () => {
    setShowPrivacyManager(false);
    setModal({ type: 'withdraw-confirm' });
  };

  const executeSignOut = async () => {
    setModal(null);
    setIsSigningOut(true);
    try {
      localStorage.removeItem('araon_cached_user');
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("로그아웃 오류:", error);
      setIsSigningOut(false);
    }
  };

  const executeWithdrawal = async () => {
    if (modalInput !== '계정삭제') {
      setModal({ type: 'withdraw-input', error: true });
      return;
    }
    setModal(null);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteDoc(doc(db, "users", user.email));
      await deleteUser(user);
      localStorage.clear();
      window.location.replace('/');
    } catch (error) {
      console.error("탈퇴 오류:", error);
      if (error.code === 'auth/requires-recent-login') {
        localStorage.clear();
        await signOut(auth);
        window.location.replace('/');
      }
    }
  };

  // ✅ [수정 4] authLoading으로 인한 전체 화면 렌더링 차단 로직 삭제
  // if (authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FA] dark:bg-[#0A0A0B] transition-colors duration-500 font-sans antialiased overflow-x-hidden">
      
      <header className="sticky top-0 z-20 flex flex-col bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(64px + env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between w-full flex-1 px-6 h-16">
          <button onClick={() => navigate('/')} className="p-2 text-black dark:text-white active:opacity-70 rounded-full"><i className="ph-bold ph-caret-left text-2xl"></i></button>
          <img src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`} alt="ARAON" className="h-10 w-auto" />
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-black dark:text-white active:scale-90 transition-transform"><i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i></button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-3">
        <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight px-2 mb-4 uppercase">Settings</h2>

        <MenuCard icon="ph-graduation-cap" color="indigo" title="학습 레벨 변경" sub="나에게 맞는 학습 코스 선택" onClick={() => navigate('/level-home')} />
        <MenuCard icon="ph-bell-simple" color="blue" title="알림 설정" sub="학습 알람 및 랭킹 소식 관리" onClick={() => navigate('/settings/notifications')} />
        <MenuCard icon="ph-speaker-high" color="amber" title="음성(Voice) 설정" sub={useAI ? '✨ AI 프리미엄 음성 사용 중' : (voices[selectedVoiceIndex]?.name || '음성 로드 중...')} onClick={() => setShowVoicePicker(true)} />
        
        <MenuCard icon="ph-headset" color="indigo" title="선생님께 문의하기" sub="오류 신고 및 궁금한 점 질문하기" onClick={() => navigate('/inquiry')} />
        
        <div className="my-4 border-t border-zinc-100 dark:border-zinc-800"></div>

        <MenuCard icon="ph-shield-check" color="emerald" title="개인정보 관리 및 탈퇴" sub="내 정보 확인 및 계정 관리" onClick={openPrivacyManager} />

        <button onClick={handleSignOut} disabled={isSigningOut} className="w-full p-5 border border-rose-50 dark:border-rose-900/20 rounded-[1.8rem] bg-rose-50/30 dark:bg-rose-900/5 flex items-center justify-between disabled:opacity-60">
          <div className="flex items-center gap-4"><div className="w-11 h-11 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center"><i className={`ph-fill ${isSigningOut ? 'ph-spinner animate-spin' : 'ph-sign-out'} text-xl`}></i></div><div className="text-left"><h3 className="text-sm font-black text-rose-600">{isSigningOut ? '로그아웃 중...' : '로그아웃'}</h3><p className="text-[10px] text-rose-400">안전하게 접속 종료</p></div></div>
        </button>

        <div className="mt-8 flex flex-col items-center gap-2">
          <a href="/privacy.html" className="text-[10px] font-bold text-zinc-400 underline">개인정보 처리방침</a>
          <p className="text-[9px] text-zinc-300 dark:text-zinc-700 font-bold uppercase">&copy; 2026 Araon Voca. All rights reserved.</p>
        </div>
      </main>

      {/* 🛡️ 개인정보 관리 바텀 시트 */}
      {showPrivacyManager && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPrivacyManager(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate__animated animate__slideInUp">
            <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-8"></div>
            <h3 className="text-lg font-black dark:text-white text-center mb-8">개인정보 관리</h3>
            
            <div className="space-y-4 mb-10">
              {privacyLoading ? (
                <p className="text-center text-xs font-bold text-zinc-400 animate-pulse py-4">불러오는 중...</p>
              ) : (
                <>
                  <InfoRow label="이메일" value={auth.currentUser?.email} />
                  <InfoRow label="이름" value={studentInfo?.name} />
                  <InfoRow label="전화번호" value={studentInfo?.phone} />
                  <InfoRow label="만 14세 미만" value={studentInfo?.isUnder14 ? "예" : (studentInfo?.isUnder14 === false ? "아니오" : "정보 없음")} />
                  <InfoRow label="개인정보 동의" value={studentInfo?.privacyAgreed ? "동의 완료" : "미동의"} />
                  <InfoRow label="가입 일시" value={studentInfo?.createdAt ? (studentInfo.createdAt.toDate ? studentInfo.createdAt.toDate().toLocaleDateString() : new Date(studentInfo.createdAt.seconds * 1000).toLocaleDateString()) : '-'} />
                </>
              )}
            </div>

            <div className="space-y-3">
              <button onClick={() => setShowPrivacyManager(false)} className="w-full py-4 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-black rounded-2xl">닫기</button>
              <button onClick={handleWithdrawal} className="w-full py-4 text-rose-500 font-bold text-xs underline">회원 탈퇴 (계정 삭제)</button>
            </div>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1E1E1E] rounded-3xl p-7 shadow-2xl">
            {modal.type === 'signout' && (
              <>
                <h3 className="text-lg font-black dark:text-white mb-2">로그아웃</h3>
                <p className="text-sm text-zinc-400 mb-8">로그아웃 하시겠습니까?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setModal(null)} className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black rounded-2xl">취소</button>
                  <button onClick={executeSignOut} className="py-3 bg-rose-500 text-white font-black rounded-2xl">로그아웃</button>
                </div>
              </>
            )}
            {modal.type === 'withdraw-confirm' && (
              <>
                <h3 className="text-lg font-black dark:text-white mb-2">회원 탈퇴</h3>
                <p className="text-sm text-zinc-400 mb-8">정말로 탈퇴하시겠습니까?{'\n'}탈퇴 시 모든 학습 기록과 오답 데이터가 영구히 삭제됩니다.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setModal(null)} className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black rounded-2xl">취소</button>
                  <button onClick={() => { setModal({ type: 'withdraw-input' }); setModalInput(''); }} className="py-3 bg-rose-500 text-white font-black rounded-2xl">계속</button>
                </div>
              </>
            )}
            {modal.type === 'withdraw-input' && (
              <>
                <h3 className="text-lg font-black dark:text-white mb-2">탈퇴 확인</h3>
                <p className="text-sm text-zinc-400 mb-4">'계정삭제'라고 입력해 주세요.</p>
                <input
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  placeholder="계정삭제"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold dark:text-white mb-2 outline-none focus:border-rose-400"
                />
                {modal.error && <p className="text-xs text-rose-500 font-bold mb-4">입력이 올바르지 않습니다.</p>}
                {!modal.error && <div className="mb-4" />}
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setModal(null)} className="py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black rounded-2xl">취소</button>
                  <button onClick={executeWithdrawal} className="py-3 bg-rose-500 text-white font-black rounded-2xl">탈퇴</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 보이스 선택 팝업 */}
      {showVoicePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVoicePicker(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate__animated animate__slideInUp max-h-[85vh] flex flex-col">
            <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-8 flex-shrink-0"></div>
            
            <h3 className="text-lg font-black dark:text-white text-center mb-6 flex-shrink-0">음성 설정</h3>

            <div className="flex-1 overflow-y-auto pr-1">
              {/* 🎯 AI 음성 토글 섹션 */}
              <div className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.8rem] flex items-center justify-between border border-indigo-100 dark:border-indigo-800/30">
                <div>
                  <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400">AI 프리미엄 음성</h4>
                  <p className="text-[10px] text-indigo-400">ElevenLabs의 최고급 AI 발음</p>
                </div>
                <button 
                  onClick={() => setUseAI(!useAI)}
                  className={`w-12 h-6 rounded-full relative transition-all ${useAI ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${useAI ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {/* 🎯 음성 속도 및 볼륨 설정 */}
              <div className="mb-8 space-y-6 px-2">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">목소리 속도</span>
                    <span className="text-xs font-black text-indigo-500">{voiceConfig.rate.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2.0" step="0.1" 
                    value={voiceConfig.rate} 
                    onChange={(e) => setVoiceConfig({...voiceConfig, rate: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">음성 크기</span>
                    <span className="text-xs font-black text-indigo-500">{Math.round(voiceConfig.volume * 100)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="1.0" step="0.1" 
                    value={voiceConfig.volume} 
                    onChange={(e) => setVoiceConfig({...voiceConfig, volume: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 px-2">기본 시스템 목소리</div>
              <div className="space-y-2">
                {voices.map((v, i) => (
                  <button key={i} onClick={() => { 
                    setSelectedVoiceIndex(i); 
                    localStorage.setItem('araon_voca_voice_name', v.name); 
                    setUseAI(false); 
                    setShowVoicePicker(false); 
                  }} className={`w-full p-4 rounded-2xl text-left transition-all ${!useAI && selectedVoiceIndex === i ? 'bg-indigo-500 text-white font-black' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-bold'}`}>
                    <span className="text-sm truncate">{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <p className="mt-4 text-[10px] text-zinc-400 font-bold text-center leading-relaxed flex-shrink-0">
              💡 <span className="text-indigo-500">Microsoft Edge</span> 브라우저를 사용하시면<br/>더 자연스러운 AI 발음을 무료로 들으실 수 있습니다.
            </p>

            <button onClick={() => setShowVoicePicker(false)} className="mt-6 py-4 w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black rounded-2xl flex-shrink-0">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuCard = ({ icon, color, title, sub, onClick }) => {
  const colors = { indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500', blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500', amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500', emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' };
  return (
    <button onClick={onClick} className="w-full p-5 border border-zinc-100 dark:border-zinc-800 rounded-[1.8rem] bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
      <div className="flex items-center gap-4"><div className={`w-11 h-11 ${colors[color]} rounded-2xl flex items-center justify-center`}><i className={`ph-fill ${icon} text-xl`}></i></div><div className="text-left"><h3 className="text-sm font-black dark:text-white">{title}</h3><p className="text-[10px] text-zinc-400 font-medium">{sub}</p></div></div>
      <i className="ph-bold ph-caret-right text-zinc-300 text-xl"></i>
    </button>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center px-2 py-1">
    <span className="text-xs font-bold text-zinc-400">{label}</span>
    <span className="text-sm font-black dark:text-white">{value || '-'}</span>
  </div>
);

export default Settings;
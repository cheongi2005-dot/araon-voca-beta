import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { safeGetItem } from '../utils/storage';

const maskEmail = (email) => {
  const [local, domain] = email.split('@');
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 3)}${local.slice(-1)}@${domain}`;
};

const underlineInput = "w-full py-2.5 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none text-base dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:border-[#70011D] transition-colors duration-200";
const label = "block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2";

function AuthPage() {
  const params = new URLSearchParams(window.location.search);
  const [isLoginMode, setIsLoginMode] = useState(params.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isUnder14, setIsUnder14] = useState(false);
  const [parentConsented, setParentConsented] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(params.get('agreed') === 'true');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFindEmail, setShowFindEmail] = useState(false);
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState('');

  useEffect(() => {
    const saved = safeGetItem('araon_temp_signup', {});
    if (saved.name) setName(saved.name);
    if (saved.phone) setPhone(saved.phone);
    if (saved.email) setEmail(saved.email);
    if (saved.ageCheck) setIsUnder14(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('araon_temp_signup', JSON.stringify({ name, phone, email, ageCheck: isUnder14 }));
  }, [name, phone, email, isUnder14]);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.removeItem('araon_temp_signup');
      } else {
        if (!name || !phone) { setError('이름과 전화번호를 모두 입력해주세요.'); setLoading(false); return; }
        if (!privacyAgreed) { setError('개인정보 수집 및 이용에 동의해 주세요.'); setLoading(false); return; }
        if (isUnder14 && !parentConsented) { setError('만 14세 미만은 법정대리인(부모님)의 동의가 필요합니다.'); setLoading(false); return; }
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', res.user.email), {
          name, phone, email: res.user.email, isUnder14, parentConsented: isUnder14,
          progress: 0, stats: { totalWords: 0, weeklyWords: 0, weeklyStudyTime: 0 },
          createdAt: new Date(), privacyAgreed: true, privacyAgreedAt: new Date()
        });
        localStorage.removeItem('araon_temp_signup');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential') setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      else if (err.code === 'auth/email-already-in-use') setError('이미 사용 중인 이메일입니다.');
      else if (err.code === 'auth/weak-password') setError('비밀번호는 6자리 이상이어야 합니다.');
      else setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('비밀번호 재설정을 위해 이메일을 먼저 입력해주세요.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('');
      alert('비밀번호 재설정 이메일을 발송했습니다. 받은 편지함을 확인해주세요.');
    } catch (err) {
      setError('이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.');
    }
  };

  const handleFindEmail = async () => {
    if (!findName || !findPhone) { setError('이름과 전화번호를 모두 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    setFoundEmail('');
    try {
      const q = query(collection(db, 'users'), where('name', '==', findName), where('phone', '==', findPhone));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('일치하는 계정을 찾을 수 없습니다.');
      } else {
        setFoundEmail(maskEmail(snapshot.docs[0].data().email));
      }
    } catch {
      setError('조회 중 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0a0a0b] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">

        {/* 타이틀 */}
        <div className="flex flex-col items-center mb-12">
          <img src={`${process.env.PUBLIC_URL}/logo_v2_512.webp`} alt="아라온" className="w-20 h-20 object-cover rounded-2xl shadow-md mb-4" />
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">아라온스쿨</h1>
          <p className="text-xs text-zinc-400 mt-1">Vocaraon</p>
        </div>

        <div className="space-y-8">
          {!isLoginMode && (
            <>
              <div>
                <label className={label}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" className={underlineInput} />
              </div>
              <div>
                <label className={label}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" className={underlineInput} />
              </div>
            </>
          )}

          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="araon@school.com"
              className={underlineInput}
            />
          </div>

          <div>
            <label className={label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="6자리 이상"
              className={underlineInput}
            />
          </div>

          {!isLoginMode && (
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={isUnder14} onChange={e => setIsUnder14(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-[#70011D] cursor-pointer flex-shrink-0" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">만 14세 미만입니다.</span>
              </label>
              {isUnder14 && (
                <label className="flex items-start gap-3 cursor-pointer pl-1">
                  <input type="checkbox" checked={parentConsented} onChange={e => setParentConsented(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-300 accent-[#70011D] cursor-pointer flex-shrink-0" />
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight">법정대리인의 개인정보 수집 및 서비스 이용 동의를 받았습니다.</span>
                </label>
              )}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={privacyAgreed} onChange={e => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-[#70011D] cursor-pointer flex-shrink-0" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
                  <span className="font-black text-zinc-700 dark:text-zinc-300">[필수]</span> 개인정보 수집 및 이용에 동의합니다.{' '}
                  <a href="/privacy.html?from=signup" className="text-[#70011D] underline font-bold">내용 보기</a>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-5 text-xs text-[#70011D] font-bold text-center">{error}</p>
        )}

        {/* 로그인/가입 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-10 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all active:scale-95 tracking-widest uppercase text-sm"
        >
          {loading ? '...' : (isLoginMode ? 'Login' : 'Sign Up')}
        </button>

        {/* 하단 링크 */}
        <div className="flex items-center justify-center gap-6 mt-5">
          {isLoginMode && (
            <>
              <button onClick={handleForgotPassword} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Forgot Password?
              </button>
              <button onClick={() => { setShowFindEmail(true); setError(''); setFoundEmail(''); }} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                Forgot Email?
              </button>
            </>
          )}
          <button
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {isLoginMode ? '회원가입' : '로그인으로 돌아가기'}
          </button>
        </div>

        {/* 이메일 찾기 모달 */}
        {showFindEmail && (
          <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-[#141416] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-6">이메일 찾기</h2>
              <div className="space-y-6">
                <div>
                  <label className={label}>Name</label>
                  <input value={findName} onChange={e => setFindName(e.target.value)} placeholder="홍길동" className={underlineInput} />
                </div>
                <div>
                  <label className={label}>Phone</label>
                  <input type="tel" value={findPhone} onChange={e => setFindPhone(e.target.value)} placeholder="010-0000-0000" className={underlineInput} />
                </div>
              </div>
              {error && <p className="mt-4 text-xs text-[#70011D] font-bold text-center">{error}</p>}
              {foundEmail && (
                <div className="mt-5 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
                  <p className="text-[10px] text-zinc-400 mb-1 uppercase tracking-widest">등록된 이메일</p>
                  <p className="text-base font-bold text-zinc-900 dark:text-white">{foundEmail}</p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowFindEmail(false); setError(''); setFoundEmail(''); setFindName(''); setFindPhone(''); }}
                  className="flex-1 py-3 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 font-bold">
                  닫기
                </button>
                <button onClick={handleFindEmail} disabled={loading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg text-sm font-bold">
                  {loading ? '...' : '찾기'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AuthPage;

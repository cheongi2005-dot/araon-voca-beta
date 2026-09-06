import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { findLevel, getCurrentLevelDisplay } from '../config/levelConfig';
import { DEFAULT_ACCENT_COLOR } from '../config/theme';
import { SESSION_KEYS } from '../config/storageKeys';
import { getWeekBoundsSunday } from '../utils/dateUtils';
import {
  calculateDailyStats,
  countAttendanceDays,
  formatPhoneNumber,
  getDominantLevelColor,
  summarizeWeek,
} from '../utils/activity';
import { INQUIRY_TARGET_EMAIL, sortInquiriesByNewest } from '../services/inquiries';
import WeeklyBarChart from '../components/WeeklyBarChart';
import DailyActivityList from '../components/DailyActivityList';
import WeekNavigator from '../components/WeekNavigator';

/**
 * 학부모 열람 페이지.
 *
 * 로그인 없이 학생 전화번호만으로 리포트를 봅니다. 앱 본체(다크 모드/라우팅)와
 * 섞이지 않도록 화면 전체를 덮는 고정 컨테이너 위에 라이트 테마로만 렌더링합니다.
 */
const OVERLAY_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 999999,
  backgroundColor: '#F8F9FA',
  overflowY: 'auto',
};

/** 입력 중인 번호를 010-1234-5678 형태로 다듬습니다. */
const formatPhoneInput = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const ParentPage = () => {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [myInquiries, setMyInquiries] = useState([]);
  const [showReplyDot, setShowReplyDot] = useState(false);
  const [hasReadReplies, setHasReadReplies] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState('report');
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryContent, setInquiryContent] = useState('');

  // onSnapshot 콜백은 구독 시점의 state를 클로저로 붙잡으므로, 재구독 없이
  // 최신 값을 읽기 위해 ref로 미러링합니다.
  const activeTabRef = useRef(activeTab);
  const hasReadRepliesRef = useRef(hasReadReplies);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { hasReadRepliesRef.current = hasReadReplies; }, [hasReadReplies]);

  const fetchStudentByPhone = useCallback(async (phone) => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('phone', '==', phone)));
      if (snapshot.empty) {
        alert('등록된 학생을 찾을 수 없습니다.');
        sessionStorage.removeItem(SESSION_KEYS.parentViewPhone);
        return;
      }
      const studentDoc = snapshot.docs[0];
      setStudent({ id: studentDoc.id, ...studentDoc.data() });
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedPhone = sessionStorage.getItem(SESSION_KEYS.parentViewPhone);
    if (savedPhone) fetchStudentByPhone(savedPhone);
  }, [fetchStudentByPhone]);

  // 문의 답변 실시간 구독 — student.phone이 바뀔 때만 재구독합니다.
  useEffect(() => {
    if (!student?.phone) return;

    const inquiryQuery = query(collection(db, 'inquiries'), where('studentPhone', '==', student.phone));
    const unsubscribe = onSnapshot(inquiryQuery, (snapshot) => {
      const inquiries = sortInquiriesByNewest(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMyInquiries(inquiries);

      const hasReply = inquiries.some(inquiry => inquiry.adminReply);
      if (hasReply && !hasReadRepliesRef.current && activeTabRef.current === 'report') {
        setShowReplyDot(true);
      }
    });

    return () => unsubscribe();
  }, [student?.phone]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'inquiry') {
      setShowReplyDot(false);
      setHasReadReplies(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length < 10) return alert('올바른 번호를 입력해주세요.');

    setLoading(true);
    try {
      // 계정에 따라 번호가 하이픈 포함/미포함으로 저장돼 있어 두 형태 모두 조회합니다.
      const candidates = [digits, formatPhoneNumber(digits)];
      for (const candidate of candidates) {
        const snapshot = await getDocs(query(collection(db, 'users'), where('phone', '==', candidate)));
        if (snapshot.empty) continue;

        const storedPhone = snapshot.docs[0].data().phone;
        sessionStorage.setItem(SESSION_KEYS.parentViewPhone, storedPhone);
        setHasReadReplies(false);
        await fetchStudentByPhone(storedPhone);
        return;
      }
      alert('등록된 학생이 없습니다.');
    } catch (error) {
      console.error('학부모 로그인 오류:', error);
      alert('로그인 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEYS.parentViewPhone);
    setStudent(null);
    setPhoneInput('');
    setMyInquiries([]);
    setShowReplyDot(false);
    setHasReadReplies(false);
    navigate('/parent');
  };

  const submitInquiry = async () => {
    if (!inquiryContent.trim()) return alert('내용을 입력해 주세요.');
    setLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        studentName: student?.name || '알 수 없음',
        studentPhone: student?.phone || '알 수 없음',
        content: inquiryContent,
        targetEmail: INQUIRY_TARGET_EMAIL,
        createdAt: serverTimestamp(),
      });
      alert('문의가 접수되었습니다.');
      setIsInquiryOpen(false);
      setInquiryContent('');
      setHasReadReplies(false);
    } catch (error) {
      console.error('문의 접수 오류:', error);
      alert('접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div style={OVERLAY_STYLE} className="flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[32px] shadow-lg shadow-emerald-100/50 w-full max-w-md text-center border border-emerald-50">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i className="ph-fill ph-users-three text-emerald-500 text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">학부모 리포트 열람</h2>
          <p className="text-[11px] font-bold text-slate-400 mb-6">등록된 학생의 휴대전화 번호를 입력해주세요.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(formatPhoneInput(e.target.value))}
              maxLength={13}
              placeholder="010-0000-0000"
              disabled={loading}
              className="w-full p-4 bg-slate-50 rounded-2xl text-center font-black outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? '확인 중...' : '리포트 보기'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { startOfWeek, endOfWeek } = getWeekBoundsSunday(weekOffset);
  const dailyStats = calculateDailyStats(student, startOfWeek, endOfWeek);
  const { totalWords, totalTime, maxWords, maxTime } = summarizeWeek(dailyStats);

  const themeColor = findLevel(student.currentLevel)?.color || DEFAULT_ACCENT_COLOR;
  const legendWordColor = getDominantLevelColor(dailyStats, themeColor);

  return (
    <div style={OVERLAY_STYLE} className="font-sans antialiased">
      <div className="min-h-screen bg-[#F8F9FA] p-4 pb-12 w-full max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6 pt-2 px-1">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="p-2.5 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-all"
              aria-label="열람 종료"
            >
              <i className="ph-bold ph-sign-out text-lg"></i>
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">나의 학습 리포트</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {student.name} 학부모 열람
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInquiryOpen(true)}
            className="flex flex-col items-center gap-1 p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 active:scale-90 transition-all"
          >
            <i className="ph-fill ph-chat-centered-text text-xl"></i>
            <span className="text-[9px] font-black uppercase">문의하기</span>
          </button>
        </header>

        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-full">
          <button
            onClick={() => handleTabChange('report')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            학습 리포트
          </button>
          <button
            onClick={() => handleTabChange('inquiry')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'inquiry' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            답변 확인 {showReplyDot && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>}
          </button>
        </div>

        {activeTab === 'report' ? (
          <div className="animate__animated animate__fadeIn">
            <div className="flex flex-col gap-3 mb-6 px-1">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/50 flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">누적 출석</p>
                <p className="text-base font-black text-emerald-600">{countAttendanceDays(student.attendance)}일</p>
              </div>
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/50 flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">현재 레벨</p>
                <p className="text-sm font-black" style={{ color: themeColor }}>
                  {getCurrentLevelDisplay(student.currentLevel)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">최근 학습</p>
                <p className="text-sm font-bold text-slate-600">
                  {student.lastActive
                    ? new Date(student.lastActive.seconds * 1000).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                    : '없음'}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 mb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <i className="ph-fill ph-presentation-chart text-indigo-500 text-lg"></i> 주간 성과
                </h3>
                <WeekNavigator weekOffset={weekOffset} onChange={setWeekOffset} />
              </div>

              <WeeklyBarChart
                dailyStats={dailyStats}
                maxWords={maxWords}
                maxTime={maxTime}
                fallbackColor={themeColor}
                legendWordColor={legendWordColor}
              />

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Weekly Word</p>
                  <p className="text-2xl font-black text-slate-900">{totalWords}개</p>
                </div>
                <div className="bg-emerald-50/40 p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Weekly Time</p>
                  <p className="text-2xl font-black text-emerald-600">{totalTime}분</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 mb-5">
                <i className="ph-fill ph-list-dashes text-indigo-500 text-lg"></i> 상세 활동 내역
              </h3>
              <DailyActivityList attendance={student.attendance} weekStart={startOfWeek} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate__animated animate__fadeIn">
            {myInquiries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] text-slate-300 font-bold border border-dashed">
                내역이 없습니다.
              </div>
            ) : (
              myInquiries.map(inquiry => (
                <div key={inquiry.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-indigo-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400">
                      {inquiry.createdAt?.toDate().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${inquiry.adminReply ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 bg-slate-100'}`}>
                      {inquiry.adminReply ? '답변 완료' : '확인 중'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap">
                    <span className="text-indigo-400 font-black mr-1">Q.</span>{inquiry.content}
                  </p>
                  {inquiry.adminReply && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-50 relative mt-4">
                      <div className="absolute -top-2 left-4 w-3 h-3 bg-slate-50 border-t border-l border-indigo-50 rotate-45"></div>
                      <p className="text-xs font-bold text-indigo-700 leading-relaxed whitespace-pre-wrap">
                        <span className="font-black text-indigo-500 mr-1">A.</span> {inquiry.adminReply}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {isInquiryOpen && (
          <div
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setIsInquiryOpen(false); }}
          >
            <div className="bg-white w-full max-w-sm p-6 rounded-[32px] shadow-2xl animate__animated animate__fadeInUp">
              <h3 className="text-lg font-black text-slate-800 mb-2">선생님께 문의하기</h3>
              <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-[11px] font-bold text-slate-500">
                작성자: {student.name} ({formatPhoneNumber(student.phone)})
              </div>
              <textarea
                value={inquiryContent}
                onChange={(e) => setInquiryContent(e.target.value)}
                placeholder="내용을 입력하세요..."
                className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 text-sm mb-4 resize-none font-bold text-slate-700"
              />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsInquiryOpen(false)} className="py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm active:scale-95">
                  취소
                </button>
                <button onClick={submitInquiry} disabled={loading} className="py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm active:scale-95 shadow-lg flex items-center justify-center gap-1">
                  {loading ? '전송중..' : '보내기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPage;

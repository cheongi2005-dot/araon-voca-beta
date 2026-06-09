import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';

const ParentPage = () => {
  // --- STATE MANAGEMENT ---
  const [student, setStudent] = useState(null);
  const [myInquiries, setMyInquiries] = useState([]);
  const [showRedDot, setShowRedDot] = useState(false); // 🎯 빨간 점 표시 여부
  const [hasReadReplies, setHasReadReplies] = useState(false); // 🎯 읽음 상태 기록
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState('report'); 
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryContent, setInquiryContent] = useState("");

  const navigate = useNavigate();
  const MISTAKE_NOTE_COLOR = '#70011D';

  // onSnapshot 내부에서 최신 state를 읽기 위한 ref (불필요한 재구독 방지)
  const activeTabRef = useRef(activeTab);
  const hasReadRepliesRef = useRef(hasReadReplies);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { hasReadRepliesRef.current = hasReadReplies; }, [hasReadReplies]);

  // Firebase Timestamp, ISO 문자열, seconds 객체 등 모든 날짜 형식을 안전하게 파싱
  const parseDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    if (value.seconds != null) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  // --- HELPERS ---
  const getMethodInKorean = (method) => {
    if (method === 'choice') return '4지선다';
    if (method === 'letter') return '철자 채우기';
    if (method === 'full') return '전체 받아쓰기';
    if (method === 'subjective') return '주관식';
    return method || '';
  };

  const getLevelNameInKorean = (lvlId) => {
    if (!lvlId || lvlId.toLowerCase() === 'all') return '전체 레벨';
    const id = lvlId.toLowerCase().replace(/_/g, '-');
    if (id.includes('elementary-100')) return '초등 기초 100';
    if (id.includes('level-1')) return '초등 필수';
    if (id.includes('level-2')) return '중등 기초';
    if (id.includes('level-3')) return '중등 심화';
    if (id.includes('level-4')) return '고등 기초';
    if (id.includes('level-5')) return '고등 심화';
    return lvlId;
  };

  const getDotColor = (activityData) => {
    if (activityData?.type?.includes('오답노트')) return MISTAKE_NOTE_COLOR;
    let levelKey = activityData?.levelId;
    if (levelKey && LEVEL_CONFIG[levelKey.toLowerCase()]) {
      return LEVEL_CONFIG[levelKey.toLowerCase()].color;
    }
    return '#cbd5e1';
  };

  const getCurrentLevelDisplay = (levelName) => {
    if (!levelName || levelName === 'Level 미정') return 'Level 미정';
    const foundEntry = Object.values(LEVEL_CONFIG).find(l => 
      l.id === levelName || l.title === levelName || l.key === levelName
    );
    return foundEntry ? foundEntry.subTitle : levelName;
  };

  const formatPhoneNumber = (phoneNumberString) => {
    if (!phoneNumberString) return "";
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    return phoneNumberString;
  };

  const getWeekBoundaries = (offset) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (offset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };

  // 🎯 DATA FETCHING (실시간 데이터 연동 및 빨간 점 제어)
  // student.phone이 바뀔 때만 재구독 (activeTab/hasReadReplies 변경 시 재구독 불필요)
  useEffect(() => {
    if (!student?.phone) return;

    const q = query(
      collection(db, "inquiries"),
      where("studentPhone", "==", student.phone)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setMyInquiries(data);

      // ref를 통해 최신 상태 읽기 (클로저 문제 방지)
      const hasReply = data.some(iq => iq.adminReply);
      if (hasReply && !hasReadRepliesRef.current && activeTabRef.current === 'report') {
        setShowRedDot(true);
      }
    });

    return () => unsubscribe();
  }, [student?.phone]);

  // 🎯 탭 전환 시 "답변 확인"을 누르면 점 사라짐
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'inquiry') {
      setShowRedDot(false);
      setHasReadReplies(true); // 이 세션에서는 다시 점이 뜨지 않도록 처리
    }
  };

  const fetchStudentByPhone = useCallback(async (phone) => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        setStudent({ id: studentDoc.id, ...studentDoc.data() });
      } else {
        alert('등록된 학생을 찾을 수 없습니다.');
        sessionStorage.removeItem('parentViewPhone');
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const parentPhone = sessionStorage.getItem('parentViewPhone');
    if (parentPhone) fetchStudentByPhone(parentPhone);
  }, [fetchStudentByPhone]);

  // --- HANDLERS ---
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7)}`;
    }
    setPhoneInput(formatted);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanedPhone = phoneInput.replace(/\D/g, '');
    if (cleanedPhone.length < 10) return alert("올바른 번호를 입력해주세요.");
    
    setLoading(true);
    try {
      let q = query(collection(db, "users"), where("phone", "==", cleanedPhone));
      let snap = await getDocs(q);
      if (snap.empty) {
        const formatPhone = cleanedPhone.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
        q = query(collection(db, "users"), where("phone", "==", formatPhone));
        snap = await getDocs(q);
      }
      if (!snap.empty) {
        const phone = snap.docs[0].data().phone;
        sessionStorage.setItem('parentViewPhone', phone);
        setHasReadReplies(false); // 로그인 시 읽음 상태 초기화
        await fetchStudentByPhone(phone);
      } else {
        alert("등록된 학생이 없습니다.");
      }
    } catch (err) { alert("로그인 오류가 발생했습니다."); }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('parentViewPhone');
    setStudent(null);
    setPhoneInput("");
    setMyInquiries([]);
    setShowRedDot(false);
    setHasReadReplies(false);
    navigate('/parent');
  };

  const submitInquiry = async () => {
    if (!inquiryContent.trim()) return alert("내용을 입력해 주세요.");
    setLoading(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        studentName: student?.name || "알 수 없음",
        studentPhone: student?.phone || "알 수 없음",
        content: inquiryContent,
        targetEmail: "di4377491@gmail.com",
        createdAt: serverTimestamp(),
      });
      alert("문의가 접수되었습니다.");
      setIsInquiryOpen(false);
      setInquiryContent("");
      setHasReadReplies(false); // 새 문의 시 새로운 답변을 기다리므로 초기화
    } catch (e) { alert("접수 중 오류가 발생했습니다."); }
    setLoading(false);
  };

  // --- STATS CALCULATION ---
  const { startOfWeek, endOfWeek } = getWeekBoundaries(weekOffset);
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  const calculateDailyStats = (studentData, weekStart, weekEnd) => {
    const dailyStats = Array(7).fill(null).map((_, i) => ({ dayIndex: i, totalWords: 0, totalTime: 0, levelCounts: {} }));
    if (!studentData?.attendance) return dailyStats;
    studentData.attendance.forEach(activity => {
      const record = typeof activity === 'string' ? { date: activity.split(' (')[0], type: activity.split(' (')[1]?.replace(')', '') || '' } : activity;
      if (!record || !record.date) return;
      const activityDate = parseDate(record.date);
      if (!activityDate) return;
      if (activityDate >= weekStart && activityDate <= weekEnd) {
        const dayIndex = activityDate.getDay();
        const isOudap = record.type?.includes('오답노트');
        const isProblemSolving = record.type?.includes('문제풀이') && !isOudap;
        if ((isProblemSolving || isOudap) && typeof record.score === 'number') {
          dailyStats[dayIndex].totalWords += record.score;
          let lvlId = isOudap ? 'mistake' : (record.levelId ? record.levelId.toLowerCase() : 'unknown');
          dailyStats[dayIndex].levelCounts[lvlId] = (dailyStats[dayIndex].levelCounts[lvlId] || 0) + record.score;
        }
        if (record.type?.includes('단어학습') || isProblemSolving || isOudap) {
          dailyStats[dayIndex].totalTime += (record.studyTime || 1);
        }
      }
    });
    return dailyStats;
  };

  const getActivitiesForDay = (activityKey, dayIndex, weekStart) => {
    if (!student?.attendance) return [];
    const dayS = new Date(weekStart); dayS.setDate(weekStart.getDate() + dayIndex); dayS.setHours(0,0,0,0);
    const dayE = new Date(dayS); dayE.setHours(23,59,59,999);
    const activities = student.attendance
      .map(a => typeof a === 'string' ? { date: a.split(' (')[0], type: a.split(' (')[1]?.replace(')', '') || '' } : a)
      .filter(a => {
        if (!a || !a.type?.includes(activityKey)) return false;
        const d = parseDate(a.date);
        return d && d >= dayS && d <= dayE;
      });
    const seen = new Map();
    activities.forEach(a => {
      const k = `${a.type}-${a.day || ''}-${a.method || ''}-${a.levelId || ''}`;
      if(!seen.has(k)) seen.set(k, { ...a, count: 1 });
      else seen.get(k).count++;
    });
    return Array.from(seen.values()).reverse();
  };

  const dailyStats = calculateDailyStats(student, startOfWeek, endOfWeek);
  const weeklyTotalWords = dailyStats.reduce((acc, cur) => acc + cur.totalWords, 0);
  const weeklyTotalTime = dailyStats.reduce((acc, cur) => acc + cur.totalTime, 0);
  const maxWordsInWeek = Math.max(...dailyStats.map(d => d.totalWords), 1);
  const maxTimeInWeek = Math.max(...dailyStats.map(d => d.totalTime), 1);
  const currentLevelConfig = student?.currentLevel ? LEVEL_CONFIG[student.currentLevel.toLowerCase()] : null;
  const themeColor = currentLevelConfig ? currentLevelConfig.color : '#4F46E5';
  const timeBarColor = '#34D399';
  const legendWordColor = (() => {
    const counts = {};
    dailyStats.forEach(s => Object.entries(s.levelCounts).forEach(([l, c]) => counts[l] = (counts[l] || 0) + c));
    let max = -1, dom = null;
    Object.entries(counts).forEach(([l, c]) => { if(c > max) { max = c; dom = l; }});
    return (dom && LEVEL_CONFIG[dom]) ? LEVEL_CONFIG[dom].color : themeColor;
  })();

  const containerStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, backgroundColor: '#F8F9FA', overflowY: 'auto' };

  // --- RENDER ---
  if (!student) {
    return (
      <div style={containerStyle} className="flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[32px] shadow-lg shadow-emerald-100/50 w-full max-w-md text-center border border-emerald-50">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i className="ph-fill ph-users-three text-emerald-500 text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">학부모 리포트 열람</h2>
          <p className="text-[11px] font-bold text-slate-400 mb-6">등록된 학생의 휴대전화 번호를 입력해주세요.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="tel" value={phoneInput} onChange={handlePhoneChange} maxLength={13} placeholder="010-0000-0000" className="w-full p-4 bg-slate-50 rounded-2xl text-center font-black outline-none focus:ring-2 focus:ring-emerald-400 text-sm" disabled={loading} />
            <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-50">{loading ? '확인 중...' : '리포트 보기'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="font-sans antialiased">
      <div className="min-h-screen bg-[#F8F9FA] p-4 pb-12 w-full max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6 pt-2 px-1">
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="p-2.5 bg-white text-rose-500 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-all"><i className="ph-bold ph-sign-out text-lg"></i></button>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">나의 학습 리포트</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{student.name} 학부모 열람</p>
            </div>
          </div>
          <button onClick={() => setIsInquiryOpen(true)} className="flex flex-col items-center gap-1 p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 active:scale-90 transition-all">
            <i className="ph-fill ph-chat-centered-text text-xl"></i>
            <span className="text-[9px] font-black uppercase">문의하기</span>
          </button>
        </header>

        {/* 🎯 탭 메뉴 (점 표시 로직 showRedDot 상태로 변경) */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-full">
          <button onClick={() => handleTabChange('report')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'report' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>학습 리포트</button>
          <button onClick={() => handleTabChange('inquiry')} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'inquiry' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            답변 확인 {showRedDot && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>}
          </button>
        </div>

        {activeTab === 'report' ? (
          <div className="animate__animated animate__fadeIn">
            {/* 요약 카드 */}
            <div className="flex flex-col gap-3 mb-6 px-1">
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/50 flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">누적 출석</p>
                <p className="text-base font-black text-emerald-600">{new Set((student.attendance || []).map(r => r.date)).size}일</p>
              </div>
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100/50 flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">현재 레벨</p>
                <p className="text-sm font-black" style={{ color: themeColor }}>{getCurrentLevelDisplay(student.currentLevel)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center px-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">최근 학습</p>
                <p className="text-sm font-bold text-slate-600">{student.lastActive ? new Date(student.lastActive.seconds * 1000).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '없음'}</p>
              </div>
            </div>

            {/* 그래프 섹션 */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 mb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5"><i className="ph-fill ph-presentation-chart text-indigo-500 text-lg"></i> 주간 성과</h3>
                <div className="flex gap-1.5">
                  <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 bg-slate-50 rounded-lg text-slate-400"><i className="ph-bold ph-arrow-left text-sm"></i></button>
                  <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0} className="p-2 bg-slate-50 rounded-lg text-slate-400 disabled:opacity-20"><i className="ph-bold ph-arrow-right text-sm"></i></button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mb-3 px-1">
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: legendWordColor }}></div><span className="text-[10px] font-bold text-slate-500">단어</span></div>
                <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: timeBarColor }}></div><span className="text-[10px] font-bold text-slate-500">시간</span></div>
              </div>
              <div className="flex justify-between items-end h-32 mb-3 px-1">
                {dailyStats.map((stat, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end h-full w-[12%]">
                    <div className="flex items-end gap-0.5 h-full pb-1 w-full justify-center">
                      <div className="w-2.5 rounded-t-sm flex flex-col-reverse overflow-hidden bg-slate-100/50" style={{ height: `${(stat.totalWords / maxWordsInWeek) * 100 || 0}%` }}>
                        {Object.entries(stat.levelCounts).map(([l, s]) => <div key={l} style={{ height: `${stat.totalWords > 0 ? (s / stat.totalWords) * 100 : 0}%`, backgroundColor: l === 'mistake' ? MISTAKE_NOTE_COLOR : (LEVEL_CONFIG[l]?.color || themeColor), width: '100%' }} />)}
                      </div>
                      <div className="w-2.5 rounded-t-sm" style={{ height: `${(stat.totalTime / maxTimeInWeek) * 100 || 0}%`, backgroundColor: timeBarColor }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 px-1">
                {daysOfWeek.map(d => <div key={d} className="text-[10px] font-black text-slate-400 w-[12%] text-center">{d}</div>)}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-50 p-4 rounded-2xl text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Weekly Word</p><p className="text-2xl font-black text-slate-900">{weeklyTotalWords}개</p></div>
                <div className="bg-emerald-50/40 p-4 rounded-2xl text-center"><p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Weekly Time</p><p className="text-2xl font-black text-emerald-600">{weeklyTotalTime}분</p></div>
              </div>
            </div>

            {/* 상세 활동 */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50 mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 mb-5"><i className="ph-fill ph-list-dashes text-indigo-500 text-lg"></i> 상세 활동 내역</h3>
              <div className="flex flex-col gap-3">
                {daysOfWeek.map((dayN, dayI) => {
                  const words = getActivitiesForDay('단어학습', dayI, startOfWeek);
                  const solves = getActivitiesForDay('문제풀이', dayI, startOfWeek);
                  const mistakes = getActivitiesForDay('오답노트', dayI, startOfWeek);
                  const has = words.length > 0 || solves.length > 0 || mistakes.length > 0;
                  return (
                    <div key={dayI} className="bg-slate-50 p-3.5 rounded-2xl">
                      <div className="flex justify-between mb-2"><span className="text-xs font-black text-slate-700">{dayN}요일</span>{!has && <span className="text-[10px] text-slate-400 font-bold">활동 없음</span>}</div>
                      {has && <div className="flex flex-col gap-2">
                        {words.map((act, i) => <div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDotColor(act) }}></div><span className="text-[11px] font-bold text-slate-500 w-12">단어학습</span><span className="text-[11px] text-slate-600">{act.day ? `Day ${act.day}` : '완료'} {act.count > 1 && `(${act.count})`}</span></div>)}
                        {solves.map((act, i) => !act.type?.includes('오답') && <div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDotColor(act) }}></div><span className="text-[11px] font-bold text-slate-500 w-12">문제풀이</span><span className="text-[11px] text-slate-600">{act.day && `Day ${act.day} `}{act.method && `${getMethodInKorean(act.method)} `}{act.score !== undefined ? `${act.score}/${act.total || '?'}` : '완료'} {act.count > 1 && `(${act.count})`}</span></div>)}
                        {mistakes.map((act, i) => <div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDotColor(act) }}></div><span className="text-[11px] font-bold text-slate-500 w-12">오답노트</span><span className="text-[11px] text-slate-600">[{getLevelNameInKorean(act.levelId)}] {act.method && `${getMethodInKorean(act.method)} `}{act.score !== undefined ? `${act.score}/${act.total || '?'}` : '완료'} {act.count > 1 && `(${act.count})`}</span></div>)}
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate__animated animate__fadeIn">
            {myInquiries.length === 0 ? <div className="text-center py-20 bg-white rounded-[32px] text-slate-300 font-bold border border-dashed">내역이 없습니다.</div> : 
              myInquiries.map(iq => (
                <div key={iq.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-indigo-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400">{iq.createdAt?.toDate().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${iq.adminReply ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 bg-slate-100'}`}>{iq.adminReply ? '답변 완료' : '확인 중'}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap"><span className="text-indigo-400 font-black mr-1">Q.</span>{iq.content}</p>
                  {iq.adminReply && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-50 relative mt-4">
                      <div className="absolute -top-2 left-4 w-3 h-3 bg-slate-50 border-t border-l border-indigo-50 rotate-45"></div>
                      <p className="text-xs font-bold text-indigo-700 leading-relaxed whitespace-pre-wrap"><span className="font-black text-indigo-500 mr-1">A.</span> {iq.adminReply}</p>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* 문의하기 모달 */}
        {isInquiryOpen && (
          <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsInquiryOpen(false); }}>
            <div className="bg-white w-full max-w-sm p-6 rounded-[32px] shadow-2xl animate__animated animate__fadeInUp">
              <h3 className="text-lg font-black text-slate-800 mb-2">선생님께 문의하기</h3>
              <div className="bg-slate-50 p-3 rounded-2xl mb-4 text-[11px] font-bold text-slate-500">작성자: {student.name} ({formatPhoneNumber(student.phone)})</div>
              <textarea value={inquiryContent} onChange={(e) => setInquiryContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 text-sm mb-4 resize-none font-bold text-slate-700" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsInquiryOpen(false)} className="py-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm active:scale-95">취소</button>
                <button onClick={submitInquiry} disabled={loading} className="py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm active:scale-95 shadow-lg flex items-center justify-center gap-1">{loading ? '전송중..' : '보내기'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPage;
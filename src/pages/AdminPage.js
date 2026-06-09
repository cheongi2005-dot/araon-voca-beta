import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { LEVEL_CONFIG } from '../config/levelConfig';
import StudentReport from '../components/StudentReport'; 

const AdminPage = () => {
  // --- STATE MANAGEMENT ---
  const [students, setStudents] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'parentInquiry' | 'studentInquiry'
  const [replyInputs, setReplyInputs] = useState({});
  const [search, setSearch] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  // 관리자 접속 코드 (환경변수 미설정 시 명시적 차단)
  const ACCESS_CODE = process.env.REACT_APP_ADMIN_CODE;
  
  // 안정적인 비동기 작업을 위한 Ref
  const isComponentMounted = React.useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    if (sessionStorage.getItem('isAdmin') === 'true') {
      setIsLoggedIn(true);
      fetchAllData();
    }
    return () => { isComponentMounted.current = false; };
  }, []);

  const fetchAllData = async () => {
    if (!isComponentMounted.current) return;
    try {
      const studentQuery = query(collection(db, "users"));
      const studentSnap = await getDocs(studentQuery);
      
      const inquiryQuery = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
      const inquirySnap = await getDocs(inquiryQuery);
      
      if (isComponentMounted.current) {
        setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setInquiries(inquirySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) { 
      console.error("데이터 로드 오류:", error); 
    }
  };

  const handleSendReply = async (inquiryId) => {
    const replyText = replyInputs[inquiryId];
    if (!replyText?.trim()) return alert("답변 내용을 입력해주세요.");
    try {
      await updateDoc(doc(db, "inquiries", inquiryId), {
        adminReply: replyText,
        repliedAt: serverTimestamp()
      });
      alert("답변이 전송되었습니다.");
      fetchAllData();
    } catch (error) { alert("전송 실패"); }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "inquiries", inquiryId));
      setInquiries(inquiries.filter(iq => iq.id !== inquiryId));
    } catch (error) { alert("삭제 실패"); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!ACCESS_CODE) {
      alert("관리자 코드가 서버에 설정되지 않았습니다.");
      return;
    }
    if (adminCode === ACCESS_CODE) {
      sessionStorage.setItem('isAdmin', 'true');
      setIsLoggedIn(true);
      await fetchAllData();
    } else { alert("코드 불일치"); }
    setAdminCode("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    navigate('/');
  };

  const formatPhoneNumber = (num) => {
    if (!num) return "";
    const clean = ('' + num).replace(/\D/g, '');
    const match = clean.match(/^(\d{3})(\d{3,4})(\d{4})$/); 
    return match ? `${match[1]}-${match[2]}-${match[3]}` : num;
  };

  const getCurrentLevelDisplay = (levelName) => {
    const found = Object.values(LEVEL_CONFIG).find(l => l.title === levelName || l.name === levelName);
    return found ? found.subTitle : (levelName || 'Level 미정');
  };

  // 🎯 문의 필터링 로직
  const parentInquiries = inquiries.filter(iq => iq.userType !== 'student');
  const studentInquiries = inquiries.filter(iq => iq.userType === 'student');
  const getUnrepliedCount = (list) => list.filter(iq => !iq.adminReply).length;

  const containerStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999999, backgroundColor: '#F8F9FA', overflowY: 'auto' };

  if (!isLoggedIn) {
    return (
      <div style={containerStyle} className="admin-safe-zone flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100 w-full max-w-sm text-center border border-indigo-50">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><i className="ph-fill ph-lock-key text-indigo-600 text-3xl"></i></div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">선생님 관리자 로그인</h2>
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="관리자 접속 코드" className="w-full p-4 bg-gray-50 rounded-2xl text-center font-black outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg">접속하기</button>
          </form>
          <button onClick={() => navigate('/')} className="mt-6 text-xs text-gray-400 font-bold">홈으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="admin-safe-zone p-6 font-sans antialiased">
      <div className="max-w-4xl mx-auto">
      {selectedStudent ? (
        <StudentReport student={selectedStudent} onBack={() => setSelectedStudent(null)} backText="목록으로 돌아가기" isLogoutMode={false} />
      ) : (
        <div className="animate__animated animate__fadeIn">
          <header className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-2xl font-black text-indigo-900 leading-tight">ARAON Voca<br/>Master Admin</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                <NavBtn active={activeTab === 'students'} onClick={() => setActiveTab('students')} label="학생 관리" />
                <NavBtn active={activeTab === 'parentInquiry'} onClick={() => setActiveTab('parentInquiry')} label="학부모 문의" count={getUnrepliedCount(parentInquiries)} />
                <NavBtn active={activeTab === 'studentInquiry'} onClick={() => setActiveTab('studentInquiry')} label="학생 문의" count={getUnrepliedCount(studentInquiries)} />
              </div>
              <button onClick={handleLogout} className="px-4 py-2.5 bg-white text-rose-500 rounded-xl text-xs font-black shadow-sm border border-slate-100 active:scale-95 transition-all">로그아웃</button>
            </div>
          </header>

          {activeTab === 'students' ? (
            <>
              <div className="mb-8 relative">
                <input type="text" placeholder="이름 또는 전화번호로 검색..." className="w-full p-5 pl-14 rounded-[32px] shadow-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700" onChange={(e) => setSearch(e.target.value)} />
                <i className="ph-bold ph-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 text-2xl"></i>
              </div>
              <div className="grid gap-4 pb-20">
                {students.filter(s => s.name?.includes(search) || s.phone?.includes(search)).map(student => (
                  <div key={student.id} onClick={() => setSelectedStudent(student)} className="bg-white p-6 rounded-[35px] shadow-sm border border-indigo-50 hover:shadow-md cursor-pointer flex items-center justify-between transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-xl">{(student.name || '?').charAt(0)}</div>
                      <div>
                        <h3 className="font-black text-gray-800 text-lg leading-tight">{student.name || "미입력"}</h3>
                        <p className="text-[11px] text-gray-400 font-bold mt-1">{formatPhoneNumber(student.phone)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black mb-1">{getCurrentLevelDisplay(student.currentLevel)}</div>
                      <p className="text-xs font-black text-indigo-600">{student.currentDay || '0'}일차</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-10 pb-20">
              {(() => {
                const currentList = activeTab === 'parentInquiry' ? parentInquiries : studentInquiries;
                if (currentList.length === 0) return <div className="text-center py-20 bg-white rounded-[40px] text-slate-300 font-bold border border-dashed border-slate-200">문의 내역이 없습니다.</div>;
                
                // 카테고리별 그룹화 로직 (가독성 강화)
                const grouped = currentList.reduce((acc, iq) => {
                  const cat = iq.category || "기타 문의";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(iq);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([category, items]) => (
                  <section key={category}>
                    <div className="flex items-center gap-3 mb-6 px-2">
                      <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-lg font-black text-slate-800">{category} <span className="text-xs text-indigo-400 ml-2">{items.length}건</span></h3>
                    </div>
                    <div className="grid gap-6">
                      {items.map(iq => (
                        <div key={iq.id} className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100 relative">
                          <div className="flex justify-between items-start mb-5">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${iq.userType === 'student' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {iq.category || (iq.userType === 'student' ? '학생 문의' : '학부모 문의')}
                                </span>
                                <h4 className="font-black text-slate-800 text-lg">{iq.studentName}</h4>
                              </div>
                              <p className="text-xs text-slate-400 font-bold">{formatPhoneNumber(iq.studentPhone)} • {iq.createdAt?.toDate().toLocaleString('ko-KR')}</p>
                            </div>
                            <button onClick={() => handleDeleteInquiry(iq.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><i className="ph-bold ph-trash text-xl"></i></button>
                          </div>
                          
                          <div className="bg-slate-50 p-6 rounded-3xl text-[13px] text-slate-600 leading-relaxed font-bold whitespace-pre-wrap mb-5 border border-slate-100">
                            {iq.content}
                          </div>

                          <div className="border-t border-slate-100 pt-5">
                            {iq.adminReply ? (
                              <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 relative">
                                <div className="absolute -top-2 left-6 w-4 h-4 bg-indigo-50 border-t border-l border-indigo-100 rotate-45"></div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">My Answer</p>
                                <p className="text-sm text-indigo-800 font-bold whitespace-pre-wrap leading-relaxed">{iq.adminReply}</p>
                              </div>
                            ) : (
                              <div className="flex gap-3">
                                <textarea 
                                  value={replyInputs[iq.id] || ""}
                                  onChange={(e) => setReplyInputs({...replyInputs, [iq.id]: e.target.value})}
                                  placeholder="답변 내용을 작성해 주세요..."
                                  className="flex-1 p-5 bg-slate-50 rounded-[2rem] border-none outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold resize-none h-24"
                                />
                                <button onClick={() => handleSendReply(iq.id)} className="px-6 bg-indigo-600 text-white rounded-[2rem] font-black active:scale-95 transition-all text-sm">전송</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ));
              })()}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

const NavBtn = ({ active, onClick, label, count }) => (
  <button onClick={onClick} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
    {label}
    {count > 0 && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">{count}</span>}
  </button>
);

export default AdminPage;
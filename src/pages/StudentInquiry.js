import AppHeader from '../components/AppHeader';
import AraonIcon from '../components/AraonIcon';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { collection, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../hooks/useTheme';
import { useUserData } from '../contexts/UserDataContext';

const StudentInquiry = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useTheme();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [category, setCategory] = useState("학습 오류");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myInquiries, setMyInquiries] = useState([]);
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData: studentInfo } = useUserData();

  const categories = ["학습 오류", "시스템 버그", "기능 건의", "기타 질문"];

  const faqGroups = [
    {
      icon: "words", category: " 1. 학습 진행 및 방법 (Learning)",
      items: [
        { q: "나에게 맞는 레벨은 어떻게 선택하나요?", a: "현재 자신의 학교 학년이나 평소 영어 실력에 맞춰 선택해 주세요. [레벨 변경] 메뉴에서 언제든지 조정 가능하지만, 기초부터 차근차근 밟아가는 것이 가장 효과적입니다." },
        { q: "하루에 몇 개의 단어를 학습하는 것이 좋은가요?", a: "'Day' 하나당 약 20~30개의 단어로 구성되어 있습니다. 매일 최소 1개의 Day를 완벽히 마스터하는 것을 목표로 설정해 보세요." },
        { q: "오답노트 기능은 어떻게 활용하나요?", a: "퀴즈에서 틀린 단어는 자동으로 [오답노트]에 저장됩니다. 나의 단어장에서 퀴즈를 통해 해당 단어를 맞히면 목록에서 자동으로 사라지며 완벽히 외운 것으로 간주합니다." }
      ]
    },
    {
      icon: "settings", category: " 2. 기술적인 문제 해결 (Technical)",
      items: [
        { q: "단어 발음 소리가 들리지 않아요.", a: "1) 기기의 무음 모드(매너 모드)를 해제해 주세요. 2) 설정 메뉴에서 [음성(Voice) 설정]이 제대로 되어 있는지 확인해 주세요. 3) 브라우저의 소리 권한이 차단되어 있는지 체크해 보세요." },
        { q: "학습 완료를 했는데 체크 표시가 안 떠요.", a: "퀴즈를 마지막 문제까지 풀고 '결과 화면'을 확인해야 학습 데이터가 저장됩니다. 퀴즈 도중 창을 닫으면 완료 처리가 되지 않으니 주의해 주세요." },
        { q: "집 컴퓨터에서 하던 공부를 밖에서 폰으로 이어서 할 수 있나요?", a: "네, 계정 기반으로 동기화되므로 로그인을 하시면 장소에 상관없이 학습 진행 상황(진도, 오답노트 등)을 이어서 하실 수 있습니다." }
      ]
    },
    {
      icon: "ranking", category: " 3. 동기부여 및 랭킹 (Ranking)",
      items: [
        { q: "주간 랭킹은 언제 초기화되나요?", a: "랭킹은 매주 월요일 새벽에 초기화됩니다. 한 주 동안 가장 열심히 공부한 학생들의 순위를 확인해 보세요!" },
        { q: "포인트를 모으면 무엇을 할 수 있나요?", a: "학습 포인트는 랭킹 산정의 기준이 되며, 추후 포인트로 이용할 수 있는 다양한 리워드 시스템이 업데이트될 예정입니다." }
      ]
    }
  ];

  // 2. 내 문의 내역 실시간 로드
  // 🎯 studentAuthEmail(=로그인 이메일) 기준으로 조회해야 보안 규칙(본인 것만 read 허용)을 통과합니다.
  useEffect(() => {
    const myEmail = auth.currentUser?.email;
    if (!myEmail) return;

    const q = query(collection(db, "inquiries"), where("studentAuthEmail", "==", myEmail));

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 최신순 정렬
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      // 본인이 남긴 문의만 필터링 (학부모 문의와 혼동 방지)
      setMyInquiries(data.filter(iq => iq.userType === 'student'));
    });

    return () => unsubscribe();
  }, []);

  // 3. 문의 전송
  const handleSubmit = async () => {
    if (!content.trim()) return alert("문의 내용을 입력해 주세요.");
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "inquiries"), {
        studentName: studentInfo?.name || "학생",
        studentPhone: studentInfo?.phone || "알수없음",
        studentAuthEmail: auth.currentUser?.email || null, // 🎯 보안 규칙이 본인 문의를 판별하는 기준
        userType: "student", // 🌟 학부모와 구분
        category: category,
        content: content,
        targetEmail: "di4377491@gmail.com",
        createdAt: serverTimestamp(),
      });
      alert("문의가 접수되었습니다. 선생님이 확인 후 답변해 드립니다.");
      setContent("");
      setActiveTab('history'); // 접수 후 내역 탭으로 이동
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0B] flex flex-col max-w-md mx-auto font-sans antialiased transition-colors duration-500">
      
      {/* 헤더 */}
      <AppHeader isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onBack={() => navigate('/settings')} />
      <h1 className="px-6 pt-6 pb-2 text-xl font-bold dark:text-white">학생 고객센터</h1>

      {/* 탭 전환 */}
      <div className="p-4 bg-white dark:bg-[#1E1E1E] border-b border-slate-100 dark:border-zinc-800 flex gap-2 shrink-0">
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'new' ? 'bg-indigo-500 text-white shadow-none shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'}`}
        >
          <AraonIcon name="question" size={20} className="mr-2" />새 문의 작성
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-none shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400'}`}
        >
          <AraonIcon name="activity" size={20} className="mr-2" />내 문의 내역
          {myInquiries.some(iq => iq.adminReply) && activeTab === 'new' && (
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 본문 영역 */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'new' ? (
          <div className="space-y-6 animate__animated animate__fadeIn">
            
            {/* FAQ 섹션 */}
            <section className="space-y-6">
              <h3 className="text-xs font-bold text-indigo-500 mb-1 flex items-center gap-1"><AraonIcon name="question" size={22} /> 자주 묻는 질문</h3>
              
              {faqGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-1 uppercase tracking-tighter"><AraonIcon name={group.icon} size={20} className="mr-2" />{group.category}</h4>
                  <div className="space-y-2">
                    {group.items.map((faq, idx) => (
                      <details key={idx} className="group bg-white dark:bg-[#1E1E1E] rounded-lg border border-slate-100 dark:border-zinc-800 cursor-pointer shadow-none">
                        <summary className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 p-4 list-none flex justify-between items-center">
                          <span><span className="text-indigo-400 mr-1">Q.</span>{faq.q}</span>
                          <i className="ph-bold ph-caret-down text-slate-300 dark:text-zinc-500 group-open:rotate-180 transition-transform"></i>
                        </summary>
                        <div className="p-4 pt-0 text-[10px] font-bold text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-50 dark:border-zinc-800/50 mt-2">
                          <span className="text-indigo-400 font-bold mr-1">A.</span>{faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* 입력 폼 */}
            <section className="bg-white dark:bg-[#1E1E1E] p-5 rounded-lg shadow-none border border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4"><AraonIcon name="help" size={24} className="mr-2" />선생님께 직접 문의하기</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      category === cat 
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30' 
                        : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="어떤 점이 불편하신가요? 상세히 적어주세요."
                className="w-full h-32 p-4 bg-slate-50 dark:bg-zinc-900 rounded-lg border-none outline-none focus:ring-2 focus:ring-indigo-400 text-xs font-bold text-slate-700 dark:text-zinc-300 resize-none mb-4"
              />

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-sm active:scale-95 transition-all shadow-none shadow-indigo-200 dark:shadow-none disabled:opacity-50"
              >
                {isSubmitting ? '전송 중...' : '문의 등록하기'}
              </button>
            </section>
          </div>
        ) : (
          <div className="space-y-3 animate__animated animate__fadeIn">
            {myInquiries.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-[#1E1E1E] rounded-lg text-slate-300 dark:text-zinc-600 font-bold border border-dashed border-slate-200 dark:border-zinc-800">
                작성한 문의가 없습니다.
              </div>
            ) : (
              myInquiries.map(iq => (
                <div key={iq.id} className="bg-white dark:bg-[#1E1E1E] p-5 rounded-lg shadow-none border border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md">{iq.category}</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500">
                        {iq.createdAt?.toDate().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${iq.adminReply ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20' : 'text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {iq.adminReply ? '답변 완료' : '확인 중'}
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed"><span className="text-indigo-400 font-bold mr-1">Q.</span>{iq.content}</p>
                  
                  {iq.adminReply && (
                    <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-lg relative mt-4">
                      <div className="absolute -top-2 left-4 w-3 h-3 bg-slate-50 dark:bg-zinc-900 rotate-45"></div>
                      <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 leading-relaxed whitespace-pre-wrap"><span className="font-bold mr-1">A.</span>{iq.adminReply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentInquiry;
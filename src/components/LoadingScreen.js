import React, { useState, useEffect } from 'react';

const LOADING_FAQS = [
  { q: "araon이 무슨 뜻이에요?", a: "아론(araon)은 순우리말로 '바다'를 뜻해요. 영단어를 바다처럼 넓게 배우자는 의미를 담고 있어요." },
  { q: "하루에 얼마나 공부하면 좋을까요?", a: "매일 10~20분씩 꾸준히 하는 것이 가장 효과적이에요. 짧더라도 매일 반복하는 습관이 중요해요." },
  { q: "모르는 단어가 너무 많아요. 어떻게 하죠?", a: "처음에는 모르는 게 당연해요! 오답 단어장에 쌓인 단어를 반복해서 보다 보면 어느새 외워져 있을 거예요." },
  { q: "AI 음성이 기본 음성보다 더 좋은가요?", a: "ElevenLabs의 AI 음성은 원어민에 가까운 자연스러운 발음을 제공해요. 설정에서 언제든지 바꿀 수 있어요." },
  { q: "단어를 외웠는데 금방 잊어버려요.", a: "망각은 자연스러운 현상이에요. 중요한 것은 반복! 오답 단어를 주기적으로 복습하면 장기 기억으로 이어져요." },
  { q: "랭킹은 어떻게 계산되나요?", a: "이번 주에 학습한 단어 수를 기준으로 같은 레벨 학생들과 랭킹을 겨뤄요. 매주 초기화돼서 누구나 도전할 수 있어요." },
  { q: "레벨은 어떻게 선택하나요?", a: "설정에서 '학습 레벨 변경'을 누르면 내 수준에 맞는 코스를 선택할 수 있어요. 언제든지 바꿀 수 있으니 걱정 마세요." },
  { q: "문의는 어떻게 하나요?", a: "설정 메뉴의 '선생님께 문의하기'를 이용하면 선생님께 직접 문의 사항을 보낼 수 있어요." },
  { q: "Phonics가 뭔가요?", a: "파닉스는 알파벳의 소리와 조합 규칙을 배우는 학습법이에요. 처음 영어를 시작하는 친구들에게 꼭 필요한 첫 단계예요." },
  { q: "다크 모드는 어떻게 켜나요?", a: "화면 오른쪽 상단의 달 모양 아이콘을 누르면 다크 모드와 라이트 모드를 자유롭게 전환할 수 있어요." },
];

const LoadingScreen = () => {
  const [faqIndex, setFaqIndex] = useState(() => Math.floor(Math.random() * LOADING_FAQS.length));
  const [isDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Q&A 랜덤 전환 타이머 (4초 유지)
    const faqTimer = setInterval(() => {
      setFaqIndex(prev => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * LOADING_FAQS.length);
        } while (nextIndex === prev);
        return nextIndex;
      });
    }, 4000);

    // 진행바 애니메이션 (1초마다 1~5 랜덤 증가, 최대 97%)
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 97) return 97; // 이미 97% 이상이면 그대로 유지
        
        const randomIncrement = Math.floor(Math.random() * 5) + 1; // 1~5 사이 랜덤 값
        const nextProgress = prev + randomIncrement;
        
        return nextProgress >= 97 ? 97 : nextProgress; // 더한 값이 97을 넘어가면 97로 고정
      });
    }, 1000); // 1000ms = 1초 간격으로 실행

    return () => {
      clearInterval(faqTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const faq = LOADING_FAQS[faqIndex];

  return (
    // ... (기존 return 내부 UI 코드는 변경 없음) ...
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-10 transition-colors duration-500 ${isDark ? 'bg-[#0A0A0B]' : 'bg-[#F8F9FA]'}`}>
      <div className="max-w-xs w-full flex flex-col items-center">
        
        {/* Q&A 카드 */}
        <div className="w-full space-y-6 mb-16">
          <div className="space-y-3">
            <p className={`text-base font-black leading-tight ${isDark ? 'text-white' : 'text-zinc-800'}`}>
              <span className="text-[#70011D] dark:text-[#FF4D4D] mr-2">Q.</span>
              {/* ✅ 여기에 물음표(?)를 추가했습니다! */}
              {faq?.q}
            </p>
            <p className={`text-[13px] font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span className="text-indigo-500 font-black mr-2">A.</span>
              {/* ✅ 여기에도 물음표(?)를 추가했습니다! */}
              {faq?.a}
            </p>
          </div>
        </div>

        {/* 직선형 진행바 */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">Loading</span>
            <span className="text-[10px] font-black text-[#70011D] dark:text-[#FF4D4D]">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#70011D] dark:bg-[#FF4D4D] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoadingScreen;
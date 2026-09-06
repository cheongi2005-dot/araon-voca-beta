import React, { useState, useEffect } from 'react';
import { readStoredTheme } from '../hooks/useTheme';
import { LOADING_FAQS } from '../data/loadingFaqs';

const LoadingScreen = () => {
  const [faqIndex, setFaqIndex] = useState(() => Math.floor(Math.random() * LOADING_FAQS.length));
  const [isDark] = useState(readStoredTheme);
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
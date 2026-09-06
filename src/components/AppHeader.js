import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 모든 화면 상단에 반복되던 sticky 헤더.
 *
 * 일곱 개 화면이 각자 노치(safe-area) 패딩, 로고 경로, 다크 토글을 복사해 갖고 있어서
 * 한 곳만 고치면 나머지가 어긋나곤 했습니다. 두 가지 형태를 지원합니다.
 *  - variant="light" : 흰색 반투명 배경 + 컬러 로고 (홈, 설정, 랭킹 등)
 *  - variant="brand" : 레벨 색 배경 + 반전된 로고 (레벨 학습, 나의 단어장)
 */
const AppHeader = ({
  isDark,
  onToggleTheme,
  onBack,
  backTo = '/',
  variant = 'light',
  backgroundColor,
  title,
  badge,
  leftSlot,
  rightSlot,
}) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(backTo));
  const isBrand = variant === 'brand';

  const containerClass = isBrand
    ? 'sticky top-0 z-20 flex flex-col border-b border-black/10 shadow-sm transition-colors'
    : 'sticky top-0 z-20 flex flex-col bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors';

  const buttonClass = isBrand
    ? 'p-2 text-white active:scale-90 transition-transform'
    : 'p-2 text-black dark:text-white active:scale-90 transition-transform';

  return (
    <header
      className={containerClass}
      style={{
        ...(isBrand && backgroundColor ? { backgroundColor } : {}),
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: 'calc(64px + env(safe-area-inset-top))',
      }}
    >
      <div className="flex-1 flex items-center px-4 justify-between w-full h-16">
        {leftSlot ?? (
          <button onClick={handleBack} className={buttonClass} aria-label="뒤로 가기">
            <i className="ph-bold ph-caret-left text-2xl"></i>
          </button>
        )}

        {title ? (
          <h1 className={`text-sm font-black tracking-[0.2em] uppercase ${isBrand ? 'text-white' : 'dark:text-white'}`}>
            {title}
          </h1>
        ) : (
          <div className="flex items-center gap-2">
            {isBrand ? (
              <img
                src={`${process.env.PUBLIC_URL}/Araon_logo_b.png`}
                alt="ARAON"
                className="h-7 mx-auto invert brightness-200"
              />
            ) : (
              <img
                src={isDark ? `${process.env.PUBLIC_URL}/Araon_logo_W.webp` : `${process.env.PUBLIC_URL}/Araon_logo.webp`}
                alt="ARAON"
                className="h-10 w-auto"
              />
            )}
            {badge}
          </div>
        )}

        {rightSlot ?? (
          <button onClick={() => onToggleTheme(!isDark)} className={buttonClass} aria-label="화면 모드 전환">
            <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-2xl`}></i>
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;

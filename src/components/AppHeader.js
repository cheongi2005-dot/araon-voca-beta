import React from 'react';
import AraonIcon from './AraonIcon';

export default function AppHeader({ isDark, onToggleTheme, onBack, home = false, themeColor, whiteContent = false }) {
  const iconStyle = { color: whiteContent ? '#F8F1E5' : '#6256AD' };
  const themedStyle = whiteContent ? { filter: 'brightness(0) invert(1)' } : undefined;
  return <>
    <header className="fixed top-0 inset-x-0 z-30 bg-white dark:bg-[#1E1E1E] border-b border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)', backgroundColor: themeColor, borderColor: themeColor ? 'transparent' : undefined }}>
      <div className="h-16 max-w-md mx-auto px-6 grid grid-cols-[44px_1fr_44px] items-center">
        <button type="button" onClick={onBack} style={iconStyle} aria-label={home ? '설정 열기' : '뒤로 가기'} className="w-11 h-11 flex items-center justify-center text-black dark:text-white rounded-xl active:scale-95 transition-transform">
          {home ? <AraonIcon name="settings" size={26} monochrome /> : <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12H5 M11 5l-7 7 7 7" /></svg>}
        </button>
        <img src={whiteContent || isDark ? process.env.PUBLIC_URL + '/Araon_logo_W.webp' : process.env.PUBLIC_URL + '/Araon_logo.webp'} alt="ARAON" style={themedStyle} className="h-10 w-auto max-w-full justify-self-center object-contain" />
        <button type="button" onClick={onToggleTheme} style={iconStyle} aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'} className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-95 transition-transform"><AraonIcon name={isDark ? 'sun' : 'moon'} size={26} monochrome /></button>
      </div>
    </header>
    <div aria-hidden="true" style={{ height: 'calc(64px + env(safe-area-inset-top))', flexShrink: 0 }} />
  </>;
}

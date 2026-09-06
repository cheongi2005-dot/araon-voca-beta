import { useState, useEffect, useCallback } from 'react';
import { SURFACE } from '../config/theme';
import { STORAGE_KEYS } from '../config/storageKeys';

/**
 * 다크/라이트 모드를 html 루트와 브라우저 UI에 함께 반영합니다.
 *
 * documentElement와 body의 배경색까지 직접 칠하는 이유는 iOS 노치/홈 인디케이터
 * 영역이 safe-area 바깥이라 Tailwind 클래스만으로는 색이 비기 때문입니다.
 * theme-color 메타까지 같이 바꿔야 상단 상태바 색이 화면과 어긋나지 않습니다.
 */
export const applyTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.backgroundColor = isDark ? SURFACE.darkRoot : SURFACE.lightRoot;
  document.body.style.backgroundColor = isDark ? SURFACE.darkPage : SURFACE.lightPage;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? SURFACE.darkRoot : SURFACE.lightRoot);
};

export const readStoredTheme = () => localStorage.getItem(STORAGE_KEYS.theme) === 'dark';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(prev => !prev), []);

  return [isDark, setIsDark, toggle];
};

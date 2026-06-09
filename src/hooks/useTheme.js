import { useState, useEffect } from 'react';

const LIGHT_COLOR = '#ffffff';
const DARK_COLOR = '#1E1E1E';

export const applyTheme = (isDark) => {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.backgroundColor = isDark ? DARK_COLOR : LIGHT_COLOR;
  document.body.style.backgroundColor = isDark ? '#0A0A0B' : '#F8F9FA';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? DARK_COLOR : LIGHT_COLOR);
};

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return [isDark, setIsDark];
};

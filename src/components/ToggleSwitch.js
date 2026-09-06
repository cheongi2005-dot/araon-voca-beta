import React from 'react';

/** 설정 화면들에서 쓰는 on/off 스위치. */
const ToggleSwitch = ({ active, onClick, activeColor = 'bg-indigo-500', label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!active}
    aria-label={label}
    onClick={onClick}
    className={`w-12 h-6 rounded-full relative flex items-center transition-all flex-shrink-0 ${active ? activeColor : 'bg-zinc-200 dark:bg-zinc-800'}`}
  >
    <div
      className={`w-4 h-4 bg-white rounded-full shadow-sm absolute transition-all duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`}
      style={{ left: '4px' }}
    />
  </button>
);

export default ToggleSwitch;

import React from 'react';

/** 주간 리포트의 이전/다음 주 이동 버튼. 미래 주로는 넘어갈 수 없습니다. */
const WeekNavigator = ({ weekOffset, onChange }) => (
  <div className="flex gap-1.5">
    <button
      onClick={() => onChange(weekOffset - 1)}
      className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-400 active:scale-90 transition-all"
      aria-label="지난 주"
    >
      <i className="ph-bold ph-arrow-left text-sm"></i>
    </button>
    <button
      onClick={() => onChange(weekOffset + 1)}
      disabled={weekOffset >= 0}
      className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-400 disabled:opacity-20 active:scale-90 transition-all"
      aria-label="다음 주"
    >
      <i className="ph-bold ph-arrow-right text-sm"></i>
    </button>
  </div>
);

export default WeekNavigator;

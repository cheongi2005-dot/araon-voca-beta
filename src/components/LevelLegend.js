import React from 'react';
import { LEVELS } from '../config/levelConfig';
import { BRAND_COLOR, ACTIVITY_TYPE } from '../config/theme';

/** 그래프 아래에 붙는 레벨 색상 범례. */
const LevelLegend = ({ className = '' }) => (
  <div className={`flex flex-wrap gap-x-4 gap-y-2 justify-center text-[9px] font-bold text-slate-400 dark:text-zinc-600 ${className}`}>
    {LEVELS.map(level => (
      <div key={level.id} className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: level.color }}></div>
        <span>{level.subTitle}</span>
      </div>
    ))}
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLOR }}></div>
      <span>{ACTIVITY_TYPE.mistakeQuiz}</span>
    </div>
  </div>
);

export default LevelLegend;

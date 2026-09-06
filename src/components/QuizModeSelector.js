import React from 'react';
import { QUIZ_MODES } from '../config/theme';

/**
 * 퀴즈 유형(4지선다 / 철자 채우기 / 전체 받아쓰기) 선택 목록.
 * 레벨 학습과 나의 단어장이 같은 마크업을 각자 갖고 있어 한 곳으로 모았습니다.
 *
 * @param renderMeta 모드별 우측에 붙일 부가 정보(최고 점수 등)를 그리는 함수
 */
const QuizModeSelector = ({ onSelect, renderMeta }) => (
  <div className="space-y-3">
    {QUIZ_MODES.map(mode => (
      <button
        key={mode.id}
        onClick={() => onSelect(mode.id)}
        className="w-full p-5 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all text-left"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl ${mode.color} flex items-center justify-center text-2xl shadow-inner`}>
            <i className={`ph-fill ${mode.icon}`}></i>
          </div>
          <p className="font-bold dark:text-white text-base">{mode.title}</p>
        </div>
        {renderMeta?.(mode)}
      </button>
    ))}
  </div>
);

export default QuizModeSelector;

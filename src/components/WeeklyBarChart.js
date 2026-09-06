import React from 'react';
import { findLevel } from '../config/levelConfig';
import { BRAND_COLOR, MISTAKE_LEVEL_ID, STUDY_TIME_COLOR, WEEKDAY_LABELS } from '../config/theme';

/**
 * 요일별 '맞춘 단어 / 학습 시간' 이중 막대 그래프.
 *
 * 단어 막대는 레벨별 색 세그먼트로 쌓여서, 그 날 어떤 코스를 공부했는지 한눈에 보입니다.
 * 학생 대시보드와 학부모 페이지가 같은 그래프를 따로 구현하고 있어 하나로 합쳤습니다.
 */
const segmentColor = (levelKey, fallbackColor) =>
  levelKey === MISTAKE_LEVEL_ID ? BRAND_COLOR : (findLevel(levelKey)?.color || fallbackColor);

const WeeklyBarChart = ({ dailyStats, maxWords, maxTime, fallbackColor, legendWordColor }) => (
  <>
    <div className="flex justify-end gap-3 mb-3 px-1">
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: legendWordColor }}></div>
        <span className="text-[10px] font-bold text-slate-500">단어</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STUDY_TIME_COLOR }}></div>
        <span className="text-[10px] font-bold text-slate-500">시간</span>
      </div>
    </div>

    <div className="flex justify-between items-end h-32 mb-3 px-1">
      {dailyStats.map((stat, idx) => (
        <div key={idx} className="flex flex-col items-center justify-end h-full w-[12%]">
          <div className="flex items-end gap-0.5 h-full pb-1 w-full justify-center">
            <div
              className="w-2.5 rounded-t-sm flex flex-col-reverse overflow-hidden transition-all duration-700 bg-slate-100/50 dark:bg-zinc-800"
              style={{ height: `${(stat.totalWords / maxWords) * 100 || 0}%` }}
            >
              {Object.entries(stat.levelCounts || {}).map(([levelKey, score]) => (
                <div
                  key={levelKey}
                  style={{
                    height: `${stat.totalWords > 0 ? (score / stat.totalWords) * 100 : 0}%`,
                    backgroundColor: segmentColor(levelKey, fallbackColor),
                    width: '100%',
                  }}
                />
              ))}
            </div>
            <div
              className="w-2.5 rounded-t-sm transition-all duration-700"
              style={{ height: `${(stat.totalTime / maxTime) * 100 || 0}%`, backgroundColor: STUDY_TIME_COLOR }}
            ></div>
          </div>
        </div>
      ))}
    </div>

    <div className="flex justify-between border-t border-slate-100 dark:border-zinc-800/50 pt-2 px-1">
      {WEEKDAY_LABELS.map(day => (
        <div key={day} className="text-[10px] font-black text-slate-400 dark:text-zinc-500 w-[12%] text-center">
          {day}
        </div>
      ))}
    </div>
  </>
);

export default WeeklyBarChart;

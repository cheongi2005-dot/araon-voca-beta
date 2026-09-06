import React from 'react';
import { ACTIVITY_TYPE, WEEKDAY_LABELS } from '../config/theme';
import { getLevelDisplayName } from '../config/levelConfig';
import { getActivitiesForDay, getDotColor, getMethodLabel, isMistakeQuiz } from '../utils/activity';

/**
 * 요일별 상세 활동 내역 목록.
 * 학생 대시보드와 학부모 페이지가 같은 화면을 각각 그리고 있어 하나로 합쳤습니다.
 */
const ActivityRow = ({ activity, label, children }) => (
  <div className="flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: getDotColor(activity) }}></div>
    <span className="text-[11px] font-bold text-slate-500 w-12">{label}</span>
    <span className="text-[11px] text-slate-600 dark:text-zinc-400">{children}</span>
  </div>
);

const RepeatCount = ({ count }) =>
  count > 1 ? <span className="ml-1 text-indigo-500 dark:text-indigo-400 font-black">({count})</span> : null;

const scoreText = (activity, emptyLabel) =>
  activity.score !== undefined ? `${activity.score}/${activity.total || '?'}` : emptyLabel;

const DailyActivityList = ({ attendance, weekStart }) => (
  <div className="flex flex-col gap-3">
    {WEEKDAY_LABELS.map((dayName, dayIndex) => {
      const studies = getActivitiesForDay(attendance, ACTIVITY_TYPE.study, dayIndex, weekStart);
      const mistakes = getActivitiesForDay(attendance, ACTIVITY_TYPE.mistakeQuiz, dayIndex, weekStart);
      // 오답노트 기록의 type("오답노트 문제풀이")은 '문제풀이'를 부분 포함하므로
      // 문제풀이 목록에도 함께 잡힙니다. 아래에서 따로 그리므로 여기서 걸러냅니다.
      const levelQuizzes = getActivitiesForDay(attendance, ACTIVITY_TYPE.quiz, dayIndex, weekStart)
        .filter(activity => !isMistakeQuiz(activity));
      const hasActivity = studies.length > 0 || levelQuizzes.length > 0 || mistakes.length > 0;

      return (
        <div key={dayIndex} className="bg-slate-50 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black text-slate-700 dark:text-zinc-300">{dayName}요일</span>
            {!hasActivity && <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold">활동 없음</span>}
          </div>

          {hasActivity && (
            <div className="flex flex-col gap-2">
              {studies.map((activity, i) => (
                <ActivityRow key={`study-${i}`} activity={activity} label={ACTIVITY_TYPE.study}>
                  {activity.day ? `Day ${activity.day}` : '학습완료'}
                  <RepeatCount count={activity.count} />
                </ActivityRow>
              ))}

              {levelQuizzes.map((activity, i) => (
                <ActivityRow key={`quiz-${i}`} activity={activity} label={ACTIVITY_TYPE.quiz}>
                  {activity.day && <span className="mr-1 font-bold text-slate-500 dark:text-zinc-500">Day {activity.day}</span>}
                  {activity.method ? `${getMethodLabel(activity.method)} ` : ''}
                  {scoreText(activity, activity.isLegacy ? '완료' : '')}
                  <RepeatCount count={activity.count} />
                </ActivityRow>
              ))}

              {mistakes.map((activity, i) => (
                <ActivityRow key={`mistake-${i}`} activity={activity} label={ACTIVITY_TYPE.mistakeQuiz}>
                  <span className="mr-1 font-bold text-slate-500 dark:text-zinc-500">[{getLevelDisplayName(activity.levelId)}]</span>
                  {activity.method ? `${getMethodLabel(activity.method)} ` : ''}
                  {scoreText(activity, '학습완료')}
                  <RepeatCount count={activity.count} />
                </ActivityRow>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export default DailyActivityList;

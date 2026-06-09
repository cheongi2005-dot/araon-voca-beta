import React, { useMemo } from 'react';
import { LEVEL_CONFIG } from '../config/levelConfig';

const WeeklyStatsDashboard = ({ student, weekOffset }) => {
  const weeklyData = useMemo(() => {
    // 1. Calculate week boundaries
    const getWeekBoundaries = (offset) => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek + (offset * 7));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { startOfWeek, endOfWeek };
    };
    const { startOfWeek, endOfWeek } = getWeekBoundaries(weekOffset);

    // 2. Initialize daily stats array
    const days = Array(7).fill(null).map(() => ({
      correctWordCount: 0,
      studyTime: 0,
      wordColor: '#A0AEC0'
    }));

    // 3. Normalize and filter attendance records for the week
    const normalizedAttendance = (student.attendance || []).map(record => {
        if (typeof record === 'string') {
            const [datePart, activityPart] = record.split(' (');
            return { date: datePart, type: activityPart ? activityPart.replace(')', '') : '' };
        }
        return record;
    }).map(r => ({...r, fullDate: new Date(r.date.replace(/\s/g, '').replace(/\.$/, ''))}));

    const weekActivities = normalizedAttendance.filter(record => {
      if (!record || !record.fullDate) return false;
      return record.fullDate >= startOfWeek && record.fullDate <= endOfWeek;
    }).sort((a,b) => a.fullDate - b.fullDate);

    // 4. Process activities day by day
    for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dailyActivities = weekActivities.filter(act => act.fullDate >= dayStart && act.fullDate <= dayEnd);

        if (dailyActivities.length > 0) {
            // New study time calculation
            let dailyStudyTime = 1; // Start with 1 min for the first activity
            for (let j = 1; j < dailyActivities.length; j++) {
                const prevActivityTime = dailyActivities[j-1].fullDate;
                const currentActivityTime = dailyActivities[j].fullDate;
                const diffMinutes = (currentActivityTime - prevActivityTime) / (1000 * 60);

                if (diffMinutes < 1) {
                    dailyStudyTime += diffMinutes;
                } else {
                    dailyStudyTime += 1; // New session, add 1 nominal minutes
                }
            }
            days[i].studyTime = Math.round(dailyStudyTime);

            // Word count and color logic
            let firstQuizColor = null;
            dailyActivities.forEach(activity => {
                if (activity.type === '문제풀이' && activity.levelId && activity.score != null) {
                    days[i].correctWordCount += activity.score;
                    if (!firstQuizColor) {
                        firstQuizColor = LEVEL_CONFIG[activity.levelId]?.color || '#A0AEC0';
                    }
                }
            });
            if(firstQuizColor) days[i].wordColor = firstQuizColor;
        }
    }
    
    // 5. Calculate totals
    const totalCorrectWords = days.reduce((sum, day) => sum + day.correctWordCount, 0);
    const totalStudyTime = days.reduce((sum, day) => sum + day.studyTime, 0);

    return { days, totalCorrectWords, totalStudyTime };

  }, [student, weekOffset]);
  
  const maxWords = Math.max(50, ...weeklyData.days.map(d => d.correctWordCount));
  const maxTime = Math.max(60, ...weeklyData.days.map(d => d.studyTime));

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 mb-6 animate__animated animate__fadeIn">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <i className="ph-fill ph-trend-up text-indigo-500"></i> 주간 학습 성과
          </h3>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Weekly Learning Stats</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400">맞춘 단어 (개)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-slate-400">학습 시간 (분)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-center">
        <div className="md:col-span-3 flex items-end justify-between h-40 px-4 border-b border-slate-100 pb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => {
            const dayData = weeklyData.days[idx];
            const wordHeight = maxWords > 0 ? (dayData.correctWordCount / maxWords) * 100 : 0;
            const timeHeight = maxTime > 0 ? (dayData.studyTime / maxTime) * 100 : 0;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 w-full group">
                <div className="relative flex items-end gap-1 h-32">
                  <div 
                    className="w-3 rounded-t-full transition-all duration-500 group-hover:brightness-110" 
                    style={{ height: `${wordHeight}%`, backgroundColor: dayData.wordColor }}
                  ></div>
                  <div 
                    className="w-3 bg-emerald-400 rounded-t-full transition-all duration-500 group-hover:brightness-110" 
                    style={{ height: `${timeHeight}%` }}
                  ></div>
                </div>
                <span className="text-xs font-black text-slate-400">{day}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">총 맞춘 단어</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-600">{weeklyData.totalCorrectWords}</span>
              <span className="text-xs font-bold text-indigo-400">개</span>
            </div>
          </div>
          <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">총 학습 시간</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-600">{weeklyData.totalStudyTime}</span>
              <span className="text-xs font-bold text-emerald-500">분</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStatsDashboard;

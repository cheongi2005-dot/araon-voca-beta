import React, { useState } from 'react';
import { LEVEL_CONFIG } from '../config/levelConfig';

const StudentReport = ({ student, onBack, backText, isLogoutMode, onLevelChange }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [levelSaved, setLevelSaved] = useState(false);
  const MISTAKE_NOTE_COLOR = '#70011D';

  // --- HELPERS ---
  const getCurrentLevelDisplay = (levelName) => {
    if (!levelName || levelName === 'Level 미정') return 'Level 미정';
    const isAlreadyKorean = Object.values(LEVEL_CONFIG).some(l => l.subTitle === levelName);
    if (isAlreadyKorean) return levelName;
    const foundEntry = Object.values(LEVEL_CONFIG).find(l => l.title === levelName);
    if (foundEntry) return foundEntry.subTitle;
    return levelName;
  };

  const formatPhoneNumber = (phoneNumberString) => {
    if (!phoneNumberString) return "";
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match11 = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/); 
    if (match11) return `${match11[1]}-${match11[2]}-${match11[3]}`;
    const match10 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match10) return `${match10[1]}-${match10[2]}-${match10[3]}`;
    return phoneNumberString; 
  };

  const getMethodInKorean = (method) => {
    if (method === 'choice') return '4지선다';
    if (method === 'letter') return '철자 채우기';
    if (method === 'full') return '전체 받아쓰기';
    if (method === 'subjective') return '주관식';
    return method || '';
  };

  const getLevelNameInKorean = (lvlId) => {
    if (!lvlId || lvlId.toLowerCase() === 'all') return '전체 레벨';
    const id = lvlId.toLowerCase().replace(/_/g, '-');
    if (id.includes('elementary-100')) return '초등 기초 100';
    if (id.includes('level-1')) return '초등 필수';
    if (id.includes('level-2')) return '중등 기초';
    if (id.includes('level-3')) return '중등 심화';
    if (id.includes('level-4')) return '고등 기초';
    if (id.includes('level-5')) return '고등 심화';
    return lvlId; 
  };

  const handleLevelSelect = async (newTitle) => {
    if (newTitle === student.currentLevel || !onLevelChange) return;
    setIsSavingLevel(true);
    setLevelSaved(false);
    try {
      await onLevelChange(newTitle);
      setLevelSaved(true);
      setTimeout(() => setLevelSaved(false), 2000);
    } catch {
      alert("레벨 변경에 실패했습니다.");
    } finally {
      setIsSavingLevel(false);
    }
  };

  const getDotColor = (activityData) => {
    if (activityData?.type?.includes('오답노트')) return MISTAKE_NOTE_COLOR;
    let levelKey = activityData?.levelId;
    if (levelKey && LEVEL_CONFIG[levelKey.toLowerCase()]) {
      return LEVEL_CONFIG[levelKey.toLowerCase()].color;
    }
    return '#cbd5e1';
  };

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

  const calculateDailyStats = (student, weekStart, weekEnd) => {
    const dailyStats = Array(7).fill(null).map((_, i) => ({
      dayIndex: i, totalWords: 0, totalTime: 0, levelCounts: {} 
    }));
    
    const normalizedAttendance = (student.attendance || []).map(record => typeof record === 'string' ? { date: record.split(' (')[0], type: record.split(' (')[1]?.replace(')', '') || '', isLegacy: true } : record);

    normalizedAttendance.forEach(activity => {
      if (!activity || !activity.date) return;
      const activityDate = new Date(activity.date);
      if (activityDate >= weekStart && activityDate <= weekEnd) {
        const dayIndex = activityDate.getDay();
        const isOudap = activity.type?.includes('오답노트');
        const isProblemSolving = activity.type?.includes('문제풀이') && !isOudap;

        if ((isProblemSolving || isOudap) && typeof activity.score === 'number') {
          dailyStats[dayIndex].totalWords += activity.score;
          let lvlId = 'mistake'; 
          if (!isOudap) {
            lvlId = activity.levelId ? activity.levelId.toLowerCase() : 'unknown';
          }
          if (!dailyStats[dayIndex].levelCounts[lvlId]) dailyStats[dayIndex].levelCounts[lvlId] = 0;
          dailyStats[dayIndex].levelCounts[lvlId] += activity.score;
        }

        if (activity.type?.includes('단어학습') || isProblemSolving || isOudap) {
          dailyStats[dayIndex].totalTime += (activity.studyTime || 1);
        }
      }
    });
    return dailyStats;
  };

  const getActivitiesForDay = (activityKey, dayIndex, weekStart) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + dayIndex);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    return (student.attendance || []).map(record =>
      typeof record === 'string' ? { date: record.split(' (')[0], type: record.split(' (')[1]?.replace(')', '') || '', isLegacy: true } : record
    ).filter(record => {
      if (!record || !record.type) return false;
      if (!record.type.includes(activityKey)) return false;
      const recordDate = new Date(record.date);
      return recordDate >= dayStart && recordDate <= dayEnd;
    }).reverse();
  };

  const { startOfWeek, endOfWeek } = getWeekBoundaries(weekOffset);
  const dailyStats = calculateDailyStats(student, startOfWeek, endOfWeek);
  
  const weeklyTotalWords = dailyStats.reduce((acc, cur) => acc + cur.totalWords, 0);
  const weeklyTotalTime = dailyStats.reduce((acc, cur) => acc + cur.totalTime, 0);

  const maxWordsInWeek = Math.max(...dailyStats.map(d => d.totalWords), 1);
  const maxTimeInWeek = Math.max(...dailyStats.map(d => d.totalTime), 1);

  const currentLevelConfig = LEVEL_CONFIG[student.currentLevel?.toLowerCase()];
  const defaultColor = currentLevelConfig ? currentLevelConfig.color : '#4F46E5'; 
  const timeBarColor = '#34D399';
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  const getDominantLevelColor = () => {
    const weeklyLevelCounts = {};
    dailyStats.forEach(stat => {
      Object.entries(stat.levelCounts).forEach(([lvlId, count]) => {
        if (!weeklyLevelCounts[lvlId]) weeklyLevelCounts[lvlId] = 0;
        weeklyLevelCounts[lvlId] += count;
      });
    });

    let maxCount = -1;
    let dominantLvl = null;
    Object.entries(weeklyLevelCounts).forEach(([lvlId, count]) => {
      if (count > maxCount) { maxCount = count; dominantLvl = lvlId; }
    });

    if (dominantLvl && LEVEL_CONFIG[dominantLvl]) return LEVEL_CONFIG[dominantLvl].color;
    return defaultColor;
  };

  const legendWordColor = getDominantLevelColor();

  return (
    <div className="animate__animated animate__fadeIn">
      {/* 백버튼 / 로그아웃 버튼 분기 처리 */}
      <button 
        onClick={onBack} 
        className={`mb-8 flex items-center gap-2 font-black hover:gap-3 transition-all ${isLogoutMode ? 'text-red-500' : 'text-indigo-600'}`}
      >
        <i className={`ph-bold ${isLogoutMode ? 'ph-sign-out' : 'ph-arrow-left'}`}></i> {backText}
      </button>
      
      {/* 1. 상단 프로필 요약 */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 mb-6 relative overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-5xl font-black text-slate-800 mb-2 leading-tight">{student.name || "이름 정보 없음"}</h2>
            <p className="text-lg font-bold text-slate-400 flex items-center gap-2 mb-3">{formatPhoneNumber(student.phone) || "전화번호 미등록"}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">누적 출석</p>
              <p className="text-base font-bold text-emerald-600">{new Set((student.attendance || []).map(record => record.date)).size}일</p>
            </div>
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">마지막 학습 위치</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-bold truncate" style={{ color: defaultColor }}>
                  {getCurrentLevelDisplay(student.currentLevel)} - {student.currentDay || 'Day 미정'}
                </p>
                {onLevelChange && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {levelSaved && <span className="text-[9px] font-black text-emerald-500 animate-pulse">저장됨 ✓</span>}
                    <select
                      value={student.currentLevel || ''}
                      onChange={(e) => handleLevelSelect(e.target.value)}
                      disabled={isSavingLevel}
                      className="text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-600 outline-none cursor-pointer hover:border-indigo-400 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <option value="" disabled>레벨 선택</option>
                      {Object.entries(LEVEL_CONFIG).map(([id, level]) => (
                        <option key={id} value={level.title}>{level.subTitle}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">최근 학습 시각</p>
              <p className="text-xs font-bold text-slate-600">{student.lastActive ? new Date(student.lastActive.seconds * 1000).toLocaleString() : '기록 없음'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 주간 그래프 리포트 */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-indigo-50 mb-6">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <i className="ph-fill ph-presentation-chart text-indigo-500"></i> 주간 학습 성과 리포트
            </h3>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Weekly Quantitative Analysis</p>
          </div>
           <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-slate-400 hidden sm:block">{startOfWeek.toLocaleDateString('ko-KR')} - {endOfWeek.toLocaleDateString('ko-KR')}</p>
            <div className="flex gap-2">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 active:scale-90 transition-transform"><i className="ph-bold ph-arrow-left"></i></button>
              <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 0} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 transition-transform"><i className="ph-bold ph-arrow-right"></i></button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="grid grid-cols-8 items-end h-40 mb-2 px-2">
              <div className="col-span-1 flex flex-col justify-center items-start pl-2 h-full">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: legendWordColor }}></div>
                  <span className="text-[9px] font-bold text-slate-500">단어</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap mt-1">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: timeBarColor }}></div>
                  <span className="text-[9px] font-bold text-slate-500">시간</span>
                </div>
              </div>

              {dailyStats.map((stat, idx) => {
                const barHeightPercent = (stat.totalWords / (maxWordsInWeek || 1)) * 100;
                return (
                  <div key={idx} className="col-span-1 flex flex-col items-center justify-end h-full">
                    <div className="flex items-end gap-1 h-full pb-1">
                      <div className="w-3 rounded-t-sm flex flex-col-reverse overflow-hidden transition-all duration-700 bg-slate-100/50" style={{ height: `${barHeightPercent}%` }}>
                        {Object.entries(stat.levelCounts).map(([lvlId, score]) => {
                           const segmentHeight = stat.totalWords > 0 ? (score / stat.totalWords) * 100 : 0;
                           const segmentColor = lvlId === 'mistake' ? MISTAKE_NOTE_COLOR : (LEVEL_CONFIG[lvlId] ? LEVEL_CONFIG[lvlId].color : defaultColor);
                           return <div key={lvlId} style={{ height: `${segmentHeight}%`, backgroundColor: segmentColor, width: '100%' }} />;
                        })}
                      </div>
                      <div className="w-3 rounded-t-sm transition-all duration-700" style={{ height: `${(stat.totalTime / (maxTimeInWeek || 1)) * 100}%`, backgroundColor: timeBarColor }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-8 border-y border-slate-50 py-4 bg-slate-50/30 rounded-2xl px-2">
              <div className="col-span-1 flex flex-col gap-3 justify-center pl-2">
                <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">구분</span>
                <span className="text-[10px] font-black text-slate-700 whitespace-nowrap">단어</span>
                <span className="text-[10px] font-black text-slate-700 whitespace-nowrap">시간</span>
              </div>
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="col-span-1 flex flex-col items-center gap-3 border-l border-slate-100/50">
                  <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{day}</span>
                  <span className="text-[10px] font-black text-slate-700 whitespace-nowrap">{dailyStats[idx].totalWords}개</span>
                  <span className="text-[10px] font-bold text-emerald-500 whitespace-nowrap">{dailyStats[idx].totalTime}분</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2">이번 주 맞춘 단어</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{weeklyTotalWords}</span><span className="text-xs font-bold text-slate-700">개</span>
              </div>
            </div>
            <div className="bg-emerald-50/20 p-6 rounded-[32px] border border-emerald-100/50">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">이번 주 학습 시간</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-emerald-600">{weeklyTotalTime}</span><span className="text-xs font-bold text-emerald-500">분</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 상세 활동 내역 테이블 */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-indigo-50 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-chart-bar text-indigo-500"></i> 주간 활동 현황 (상세)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left border-b border-slate-50 w-[120px]">활동 / 요일</th>
                {daysOfWeek.map(day => (<th key={day} className="p-3 text-[10px] font-black text-slate-400 border-b border-slate-50">{day}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[{ label: '단어학습', key: '단어학습' },{ label: '문제풀이', key: '문제풀이' },{ label: '오답노트', key: '오답노트' }].map(row => (
                <tr key={row.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-black text-slate-600 align-top">{row.label}</td>
                  {daysOfWeek.map((day, dayIndex) => {
                    const activities = getActivitiesForDay(row.key, dayIndex, startOfWeek);
                    return (
                      <td key={dayIndex} className="p-2 align-top h-16">
                        <div className="space-y-2 flex flex-col items-start">
                          {activities?.length > 0 ? (activities.map((activityData, i) => {
                             const isOudap = activityData.type?.includes('오답노트');
                             const levelDisplayName = isOudap ? getLevelNameInKorean(activityData.levelId) : '';

                             return (
                              <div key={i} className="flex items-center justify-start gap-1.5 w-full">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getDotColor(activityData) }}></div>
                                <div className="text-left">
                                  {/* 일반 문제풀이 */}
                                  {(activityData.type?.includes('문제풀이') || (activityData.type?.includes('풀이') && !isOudap)) && (
                                    <p className="text-[9px] text-slate-500 whitespace-nowrap">
                                      {activityData.day && <span className="mr-1 font-bold text-slate-500">Day {activityData.day}</span>}
                                      {activityData.method ? getMethodInKorean(activityData.method) : ''} {activityData.score !== undefined ? `${activityData.score}/${activityData.total || '?'}` : (activityData.isLegacy ? '완료' : '')}
                                    </p>
                                  )}
                                  
                                  {/* 단어학습 */}
                                  {(activityData.type === '단어학습' || (activityData.type?.includes('학습') && !isOudap)) && (
                                    <p className="text-[9px] text-slate-500 whitespace-nowrap">
                                      {activityData.day ? `Day ${activityData.day}` : '학습완료'}
                                    </p>
                                  )}
                                  
                                  {/* 오답노트 */}
                                  {isOudap && (
                                    <p className="text-[9px] text-slate-500 whitespace-nowrap">
                                      {levelDisplayName && <span className="mr-1 font-bold text-slate-500">[{levelDisplayName}]</span>}
                                      {activityData.method ? `${getMethodInKorean(activityData.method)} ` : ''} {activityData.score !== undefined ? `${activityData.score}/${activityData.total || '?'}` : '학습완료'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-bold text-slate-400">
           {Object.values(LEVEL_CONFIG).map(level => (<div key={level.id} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }}></div><span>{level.subTitle}</span></div>))}
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: MISTAKE_NOTE_COLOR }}></div><span>오답노트</span></div>
        </div>
      </div>
    </div>
  );
};

export default StudentReport;
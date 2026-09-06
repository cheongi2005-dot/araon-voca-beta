/**
 * Firestore `attendance` 배열을 읽어 학습 리포트용 통계로 가공하는 계층.
 *
 * 학생 대시보드 / 학부모 페이지 / 관리자 리포트 세 화면이 각자 거의 같은 로직을
 * 복사해 갖고 있었고, 관리자 리포트만 Firestore Timestamp를 파싱하지 못하는 등
 * 미묘하게 어긋나 있었습니다. 이제 세 화면 모두 이 모듈을 씁니다.
 *
 * attendance 레코드는 두 가지 형태가 섞여 있습니다.
 *  - 레거시 문자열: "2026-01-05 (문제풀이)"
 *  - 현재 객체: { date, type, levelId, day, score, total, method, studyTime }
 */
import { findLevel } from '../config/levelConfig';
import { ACTIVITY_TYPE, BRAND_COLOR, MISTAKE_LEVEL_ID, NEUTRAL_DOT_COLOR } from '../config/theme';
import { getDayBounds, parseDate } from './dateUtils';

/** 레거시 문자열 레코드를 현재의 객체 형태로 맞춥니다. */
export const normalizeRecord = (record) => {
  if (typeof record !== 'string') return record;
  const [datePart, typePart] = record.split(' (');
  return {
    date: datePart,
    type: typePart ? typePart.replace(')', '') : '',
    isLegacy: true,
  };
};

/** attendance 배열 전체를 객체 형태로 정규화합니다. */
export const normalizeAttendance = (attendance) =>
  Array.isArray(attendance) ? attendance.map(normalizeRecord) : [];

/**
 * 오답노트 풀이 여부.
 * 주의: 오답노트 기록의 type은 "오답노트 문제풀이"라 '문제풀이'를 부분 포함합니다.
 * 두 활동을 나눠 세려면 반드시 이 함수로 먼저 걸러야 합니다.
 */
export const isMistakeQuiz = (record) =>
  String(record?.type || '').includes(ACTIVITY_TYPE.mistakeQuiz);

/** 일반(레벨) 문제풀이 여부 — 오답노트 풀이는 제외됩니다. */
export const isLevelQuiz = (record) =>
  String(record?.type || '').includes(ACTIVITY_TYPE.quiz) && !isMistakeQuiz(record);

/** 단어학습 여부. */
export const isWordStudy = (record) =>
  String(record?.type || '').includes(ACTIVITY_TYPE.study);

/** 활동이 속한 그래프 세그먼트 키 (레벨 ID 또는 오답노트). */
export const getActivityLevelKey = (record) => {
  if (isMistakeQuiz(record)) return MISTAKE_LEVEL_ID;
  return record?.levelId ? String(record.levelId).toLowerCase() : 'unknown';
};

/** 활동 점(dot) 색상 — 오답노트는 브랜드 컬러, 그 외는 레벨 컬러. */
export const getDotColor = (record) => {
  if (isMistakeQuiz(record)) return BRAND_COLOR;
  return findLevel(record?.levelId)?.color || NEUTRAL_DOT_COLOR;
};

/** 퀴즈 풀이 방식 코드를 한글 라벨로. */
export const getMethodLabel = (method) => {
  const labels = {
    choice: '4지선다',
    letter: '철자 채우기',
    full: '전체 받아쓰기',
    subjective: '주관식',
  };
  return labels[method] || method || '';
};

/** 전화번호를 010-1234-5678 형태로. 형식을 못 맞추면 원본을 그대로 돌려줍니다. */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : phone;
};

/**
 * 한 주(일요일 시작)의 요일별 통계.
 * 각 항목: { dayIndex, totalWords, totalTime, levelCounts }
 * levelCounts는 막대를 레벨별 색 세그먼트로 쌓기 위한 { [levelKey]: 점수 } 맵입니다.
 */
export const calculateDailyStats = (student, weekStart, weekEnd) => {
  const dailyStats = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    totalWords: 0,
    totalTime: 0,
    levelCounts: {},
  }));

  normalizeAttendance(student?.attendance).forEach(record => {
    if (!record?.date) return;
    const date = parseDate(record.date);
    if (!date || date < weekStart || date > weekEnd) return;

    const dayIndex = date.getDay();
    const stat = dailyStats[dayIndex];
    const isQuiz = isLevelQuiz(record) || isMistakeQuiz(record);

    if (isQuiz && typeof record.score === 'number') {
      const levelKey = getActivityLevelKey(record);
      stat.totalWords += record.score;
      stat.levelCounts[levelKey] = (stat.levelCounts[levelKey] || 0) + record.score;
    }

    if (isQuiz || isWordStudy(record)) {
      stat.totalTime += record.studyTime || 1;
    }
  });

  return dailyStats;
};

/**
 * 특정 요일의 활동 목록.
 *
 * @param {object[]} attendance  원본 attendance 배열
 * @param {string}   activityKey ACTIVITY_TYPE 값 중 하나
 * @param {number}   dayIndex    0(일) ~ 6(토)
 * @param {Date}     weekStart   주 시작일
 * @param {boolean}  dedupe      같은 활동을 한 줄로 합치고 count를 붙일지 여부.
 *                               관리자 리포트는 개별 기록을 그대로 보여주므로 false를 씁니다.
 */
export const getActivitiesForDay = (attendance, activityKey, dayIndex, weekStart, { dedupe = true } = {}) => {
  const { dayStart, dayEnd } = getDayBounds(weekStart, dayIndex);

  const matches = normalizeAttendance(attendance).filter(record => {
    if (!record?.type) return false;
    const date = parseDate(record.date);
    if (!date || date < dayStart || date > dayEnd) return false;

    if (activityKey === ACTIVITY_TYPE.quiz) return isLevelQuiz(record) || isMistakeQuiz(record);
    if (activityKey === ACTIVITY_TYPE.mistakeQuiz) return isMistakeQuiz(record);
    if (activityKey === ACTIVITY_TYPE.study) return isWordStudy(record);
    return String(record.type).includes(activityKey);
  });

  if (!dedupe) return matches.reverse();

  // 같은 Day를 여러 번 푼 경우 한 줄로 접고 횟수를 표시합니다.
  // 점수가 있는 기록을 우선 남겨야 "3/10" 대신 "완료"가 보이는 일이 없습니다.
  const seen = new Map();
  matches.forEach(record => {
    const key = `${record.type}-${record.day || ''}-${record.method || ''}-${record.levelId || ''}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...record, count: 1 });
      return;
    }
    const count = existing.count + 1;
    const preferIncoming = record.score !== undefined && existing.score === undefined;
    seen.set(key, { ...(preferIncoming ? record : existing), count });
  });

  return Array.from(seen.values()).reverse();
};

/** 그 주에 가장 많이 학습한 레벨의 색 — 그래프 범례에 씁니다. */
export const getDominantLevelColor = (dailyStats, fallbackColor) => {
  const totals = {};
  dailyStats.forEach(stat => {
    Object.entries(stat.levelCounts || {}).forEach(([levelKey, count]) => {
      totals[levelKey] = (totals[levelKey] || 0) + count;
    });
  });

  const dominant = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (dominant && findLevel(dominant)?.color) || fallbackColor;
};

/** 요일별 통계에서 주간 합계와 그래프 스케일 기준값을 뽑습니다. */
export const summarizeWeek = (dailyStats) => ({
  totalWords: dailyStats.reduce((sum, stat) => sum + (stat.totalWords || 0), 0),
  totalTime: dailyStats.reduce((sum, stat) => sum + (stat.totalTime || 0), 0),
  maxWords: Math.max(...dailyStats.map(stat => stat.totalWords || 0), 1),
  maxTime: Math.max(...dailyStats.map(stat => stat.totalTime || 0), 1),
});

/** 서로 다른 날짜 수 = 누적 출석일. */
export const countAttendanceDays = (attendance) =>
  new Set(normalizeAttendance(attendance).map(record => record?.date).filter(Boolean)).size;

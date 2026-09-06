/**
 * 주 단위 경계 계산.
 *
 * 앱에는 두 가지 주 시작 기준이 공존합니다.
 * - 월요일 시작: 홈 화면 주간 그래프, 랭킹 집계
 * - 일요일 시작: 학습 리포트(학생/학부모/관리자)
 * 둘을 섞으면 같은 활동이 다른 주에 잡히므로, 이름으로 기준을 명시합니다.
 *
 * weekOffset: 0 = 이번 주, -1 = 지난주.
 */

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toWeekBounds = (start) => {
  const startOfWeek = startOfDay(start);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
};

/** 월요일 시작 기준 주간 경계. */
export const getWeekBounds = (weekOffset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = new Date(now);
  start.setDate(now.getDate() + offsetToMonday + weekOffset * 7);
  return toWeekBounds(start);
};

/** 일요일 시작 기준 주간 경계. */
export const getWeekBoundsSunday = (weekOffset = 0) => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  return toWeekBounds(start);
};

/** 주 시작일로부터 dayIndex번째 날의 00:00~23:59 범위. */
export const getDayBounds = (weekStart, dayIndex) => {
  const dayStart = startOfDay(weekStart);
  dayStart.setDate(new Date(weekStart).getDate() + dayIndex);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
};

/**
 * Firestore Timestamp, `{ seconds }` 객체, ISO 문자열 등 어떤 형태든 Date로.
 * 변환할 수 없으면 null을 반환하므로 호출부에서 반드시 확인해야 합니다.
 */
export const parseDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds != null) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

// Returns Monday-based week boundaries. weekOffset: 0 = this week, -1 = last week.
export const getWeekBounds = (weekOffset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + offsetToMonday + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return { startOfWeek, endOfWeek };
};

// KST 기준 월요일 시작 주(週) 키. leaderboard 컬렉션의 주간 버킷 키와 반드시 동일한 로직이어야 합니다.
// (functions/index.js의 getWeekKey()와 짝을 이룹니다 — 한쪽만 고치면 랭킹이 어긋납니다)
export const getWeekKey = (date = new Date(), weekOffset = 0) => {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(date.getTime() + kstOffset);
  const dayOfWeek = kst.getUTCDay();
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() + offsetToMonday + weekOffset * 7);
  return monday.toISOString().slice(0, 10);
};

import { LEVEL_CONFIG } from '../config/levelConfig';
import { getWeekBounds, parseDate } from './dateUtils';
import { migrateAttempts } from './mistakes';

// DB(levelProgress[키])와 로컬(localStorage[키])의 레벨 진도를 Day 단위로 합친다.
// 한쪽에만 있는 Day는 살리고, 양쪽에 다 있는 Day는 lastUpdated가 최신인 쪽(같으면 DB)을 쓴다.
// (통째로 최신 쪽을 쓰면, 다른 기기에서 먼저 업로드한 순간 이 기기에만 있던 Day 오답이 지워진다)
export const mergeLevelData = (dbData, localData) => {
  const db = dbData || {};
  const local = localData || {};
  const dbTime = db.lastUpdated || 0;
  const localTime = local.lastUpdated || 0;
  const merged = dbTime >= localTime ? { ...local, ...db } : { ...db, ...local };
  merged.lastUpdated = Math.max(dbTime, localTime);
  Object.keys(merged).forEach(dayKey => {
    const day = merged[dayKey];
    if (day?.attempts !== undefined) merged[dayKey] = { ...day, attempts: migrateAttempts(day.attempts) };
  });
  return JSON.parse(JSON.stringify(merged));
};

// 한 레벨에서 완료한 Day 수.
// levelProgress에 완료 표시가 없는 예전 계정은 attendance의 '문제풀이' 기록으로 대신 센다.
export const countCompletedDays = (levelData, attendance, levelPathId) => {
  const completed = Object.values(levelData || {}).filter(item => item && typeof item === 'object' && item.completed).length;
  if (completed > 0 || !Array.isArray(attendance)) return completed;

  const days = new Set();
  attendance.forEach(record => {
    if (typeof record === 'string' || !record?.day) return;
    if (!String(record.type || '').includes('문제풀이')) return;
    if (String(record.levelId || '').toLowerCase() !== levelPathId.toLowerCase()) return;
    days.add(String(record.day));
  });
  return days.size;
};

// 단어 데이터가 있는 레벨의 Day 퀴즈(문제풀이) 기록만. 오답노트 풀이는 Day가 없어서 빠진다.
const dayQuizRecords = (attendance) => (Array.isArray(attendance) ? attendance : []).flatMap(record => {
  if (!record || typeof record === 'string' || !record.day || record.type !== '문제풀이') return [];
  const levelId = String(record.levelId || '').toLowerCase();
  const date = parseDate(record.date);
  if (!LEVEL_CONFIG[levelId]?.loadData || !date) return [];
  return [{ levelId, day: String(record.day), date, total: Number(record.total) || 0 }];
});

// 이번 주에 퀴즈를 푼 레벨·Day 목록 (같은 Day는 한 번). total = 그 Day의 단어 수.
// 홈의 '이번 주 학습 단어' 수와 /weekly-words 목록이 같은 기준을 쓰도록 여기서만 계산한다.
export const getWeeklyQuizDays = (attendance, weekOffset = 0) => {
  const { startOfWeek, endOfWeek } = getWeekBounds(weekOffset);
  const days = new Map();
  dayQuizRecords(attendance).forEach(r => {
    if (r.date < startOfWeek || r.date > endOfWeek) return;
    const key = `${r.levelId}/${r.day}`;
    days.set(key, { levelId: r.levelId, day: r.day, total: Math.max(days.get(key)?.total || 0, r.total) });
  });
  return [...days.values()];
};

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]; // 망각곡선 복습 간격(일)
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// 오늘 복습할 Day: 처음 퀴즈를 푼 날로부터 1·3·7·14·30일째인 Day들.
// 오늘 해당하는 Day가 없으면 가장 최근에 배운 Day 하나(fallback: true)로 채운다.
// ponytail: 그날 앱을 안 열면 그 복습은 지나감. 놓친 복습까지 챙기려면 Day별 복습 완료 기록이 필요.
export const getReviewDays = (attendance, now = new Date()) => {
  const first = new Map();
  dayQuizRecords(attendance).forEach(r => {
    const key = `${r.levelId}/${r.day}`;
    const prev = first.get(key);
    first.set(key, { ...r, date: prev && prev.date < r.date ? prev.date : r.date, total: Math.max(prev?.total || 0, r.total) });
  });
  const today = startOfDay(now);
  const all = [...first.values()].map(d => ({ ...d, daysAgo: Math.round((today - startOfDay(d.date)) / 864e5) }));
  const due = all.filter(d => REVIEW_INTERVALS.includes(d.daysAgo));
  if (due.length > 0 || all.length === 0) return due;
  return [{ ...all.reduce((a, b) => (b.date > a.date ? b : a)), fallback: true }];
};

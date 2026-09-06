/**
 * Firestore `levelProgress`와 localStorage 사이의 병합/복원.
 *
 * 이 로직은 Home / LevelTemplate / MyVoca / LevelHome 네 곳에 복사돼 있었고,
 * 각자 조금씩 다른 비교 연산자(`>` vs `>=`)를 써서 어떤 화면을 먼저 열었는지에
 * 따라 진도가 다르게 보일 수 있었습니다. 이제 규칙은 한 곳에만 있습니다.
 *
 * 규칙: `lastUpdated`가 더 최신인 쪽이 이깁니다. 같으면 서버(DB)를 택합니다.
 */
import { safeGetItem, safeSetItem } from './storage';
import { migrateAttempts, refreshMistakesCache } from './mistakes';

/** attempts 필드를 현재 형식({ word: true })으로 맞춘 깊은 복사본을 만듭니다. */
export const migrateLevelData = (levelData) => {
  const migrated = JSON.parse(JSON.stringify(levelData || {}));
  Object.keys(migrated).forEach(dayKey => {
    if (dayKey === 'lastUpdated') return;
    const day = migrated[dayKey];
    if (day?.attempts !== undefined) day.attempts = migrateAttempts(day.attempts);
  });
  return migrated;
};

/**
 * 한 레벨에 대해 DB 데이터와 로컬 데이터 중 최신본을 고릅니다.
 * DB에 아무 기록이 없으면 로컬을 그대로 씁니다.
 */
export const mergeLevelData = (dbLevelData, localLevelData) => {
  const db = dbLevelData || {};
  const local = localLevelData || {};
  if (Object.keys(db).length === 0) return migrateLevelData(local);
  return migrateLevelData((db.lastUpdated || 0) >= (local.lastUpdated || 0) ? db : local);
};

/**
 * 사용자 문서의 levelProgress 전체를 localStorage에 반영하고 오답 수 캐시를 갱신합니다.
 * @returns {number} 갱신된 전체 오답 단어 수
 */
export const syncLevelProgressToLocal = (levelProgress) => {
  Object.entries(levelProgress || {}).forEach(([levelKey, dbLevelData]) => {
    if (!dbLevelData) return;
    const localLevelData = safeGetItem(levelKey, { lastUpdated: 0 });
    if ((dbLevelData.lastUpdated || 0) < (localLevelData.lastUpdated || 0)) return;
    safeSetItem(levelKey, JSON.stringify(migrateLevelData(dbLevelData)));
  });
  return refreshMistakesCache();
};

/**
 * levelProgress에 완료 기록이 없는 예전 계정을 위해, attendance 기록에서
 * 완료한 Day를 역산해 채워 넣습니다. (원본을 변형하지 않습니다.)
 */
export const backfillFromAttendance = (levelData, attendance, levelId) => {
  const hasCompleted = Object.keys(levelData).some(k => k !== 'lastUpdated' && levelData[k]?.completed);
  if (hasCompleted || !Array.isArray(attendance)) return levelData;

  const filled = { ...levelData };
  attendance.forEach(record => {
    if (typeof record === 'string' || !record?.day) return;
    if (!String(record.type || '').includes('문제풀이')) return;
    if (String(record.levelId || '').toLowerCase() !== String(levelId).toLowerCase()) return;

    const day = String(record.day);
    const score = Number(record.score || 0);
    const current = filled[day] || {};
    const scores = { ...(current.scores || {}) };
    if (record.method) scores[record.method] = Math.max(scores[record.method] || 0, score);

    filled[day] = {
      ...current,
      completed: true,
      bestScore: Math.max(current.bestScore || 0, score),
      ...(record.method ? { scores } : {}),
    };
  });
  return filled;
};

/** 한 레벨에서 완료 처리된 Day 수. */
export const countCompletedDays = (levelData) =>
  Object.entries(levelData || {}).filter(([key, value]) =>
    key !== 'lastUpdated' && value && typeof value === 'object' && value.completed
  ).length;

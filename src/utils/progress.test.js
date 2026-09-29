import { mergeLevelData } from './progress';

test('mergeLevelData: 한쪽에만 있는 Day는 살리고, 겹치는 Day는 최신 쪽을 쓴다', () => {
  const db = { 1: { completed: true, attempts: { apple: true } }, 2: { completed: true }, lastUpdated: 200 };
  const local = { 1: { completed: true, attempts: { apple: true, banana: true } }, 3: { completed: true }, lastUpdated: 100 };

  const merged = mergeLevelData(db, local);
  expect(Object.keys(merged).sort()).toEqual(['1', '2', '3', 'lastUpdated']); // 로컬에만 있던 Day 3 유지
  expect(merged[1].attempts).toEqual({ apple: true });                          // 겹치는 Day 1은 최신(DB)
  expect(merged.lastUpdated).toBe(200);

  // 로컬이 최신이면 로컬 Day가 이긴다 (예: 방금 오답 졸업)
  expect(mergeLevelData(db, { ...local, lastUpdated: 300 })[1].attempts).toEqual({ apple: true, banana: true });
});

test('mergeLevelData: 빈 값·예전 attempts 형식도 처리', () => {
  expect(mergeLevelData(undefined, undefined)).toEqual({ lastUpdated: 0 });
  expect(mergeLevelData({ 1: { attempts: [['Apple '], ['kiwi']] }, lastUpdated: 1 }, {})[1].attempts)
    .toEqual({ apple: true, kiwi: true });
});

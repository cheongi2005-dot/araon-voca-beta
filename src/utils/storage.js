export const safeParse = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const safeGetItem = (key, fallback = null) =>
  safeParse(localStorage.getItem(key), fallback);

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      localStorage.removeItem('araon_ranking_users');
      localStorage.removeItem('araon_ranking_users_at');
      try {
        localStorage.setItem(key, value);
      } catch {
        console.error('[Storage] 저장 공간이 부족합니다:', key);
      }
    }
  }
};

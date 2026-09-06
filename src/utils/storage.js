/**
 * localStorage 안전 래퍼.
 *
 * 브라우저 저장소는 시크릿 모드/용량 초과/직렬화 실패 등으로 언제든 던질 수 있어
 * 앱 코드가 매번 try/catch를 두르는 대신 여기서 한 번만 처리합니다.
 */
import { STORAGE_KEYS } from '../config/storageKeys';

/** 용량이 부족할 때 가장 먼저 버릴 캐시 (언제든 다시 받아올 수 있는 값). */
const EVICTABLE_KEYS = [STORAGE_KEYS.rankingUsers, STORAGE_KEYS.rankingUsersAt];

export const safeParse = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const safeGetItem = (key, fallback = null) => {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
};

export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    const isQuotaError = e.name === 'QuotaExceededError' || e.code === 22;
    if (!isQuotaError) return false;

    // 랭킹 캐시를 버리고 한 번만 재시도합니다. 학습 기록은 절대 버리지 않습니다.
    EVICTABLE_KEYS.forEach(evictable => {
      try { localStorage.removeItem(evictable); } catch {}
    });
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      console.error('[Storage] 저장 공간이 부족합니다:', key);
      return false;
    }
  }
};

/** 객체를 JSON으로 직렬화해 저장합니다. */
export const safeSetJson = (key, value) => safeSetItem(key, JSON.stringify(value));

export const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

/**
 * TTL이 지나지 않은 캐시만 돌려줍니다.
 * `<key>` 에 값을, `<atKey>` 에 저장 시각(ms)을 함께 보관하는 관례를 씁니다.
 */
export const readCache = (key, atKey, ttlMs) => {
  const cachedAt = Number(localStorage.getItem(atKey) || 0);
  if (!cachedAt || Date.now() - cachedAt >= ttlMs) return null;
  return safeGetItem(key, null);
};

/** readCache와 짝을 이루는 저장 함수. */
export const writeCache = (key, atKey, value) => {
  if (safeSetJson(key, value)) safeSetItem(atKey, String(Date.now()));
};

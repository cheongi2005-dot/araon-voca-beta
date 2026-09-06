/**
 * 오답 단어(attempts) 저장 형식 관리.
 *
 * attempts는 앱이 커지며 세 가지 형태를 거쳤습니다.
 *   1. 배열의 배열   [["cat","dog"],["ant"]]
 *   2. Firestore Map {"0":["cat","dog"]}   (배열이 맵으로 저장되던 시기)
 *   3. 현재 형식     { cat: true, dog: true }
 * 읽을 때 항상 3번으로 정규화하므로 저장부는 3번만 신경 쓰면 됩니다.
 */
import { LEVEL_STORAGE_KEYS } from '../config/levelConfig';
import { STORAGE_KEYS } from '../config/storageKeys';
import { safeGetItem, safeSetItem } from './storage';

export const MISTAKES_CACHE_KEY = STORAGE_KEYS.totalMistakes;

const normalizeWord = (word) =>
  typeof word === 'string' && word.trim() ? word.trim().toLowerCase() : null;

const collectWords = (words, target) => {
  words.forEach(word => {
    const normalized = normalizeWord(word);
    if (normalized) target[normalized] = true;
  });
};

/** 어떤 형태의 attempts든 현재 형식 { word: true }로 변환합니다. */
export const migrateAttempts = (attempts) => {
  if (!attempts) return {};

  if (Array.isArray(attempts)) {
    const result = {};
    collectWords(attempts.flat(), result);
    return result;
  }

  if (typeof attempts !== 'object') return {};

  const keys = Object.keys(attempts);
  if (keys.length === 0) return {};

  // 키가 전부 숫자면 배열이 Firestore Map으로 저장된 형태입니다.
  if (keys.every(key => /^\d+$/.test(key))) {
    const result = {};
    keys.forEach(key => {
      if (Array.isArray(attempts[key])) collectWords(attempts[key], result);
    });
    return result;
  }

  return attempts;
};

export const getMistakeWords = (attempts) => Object.keys(migrateAttempts(attempts));

export const hasAnyMistakes = (attempts) => getMistakeWords(attempts).length > 0;

export const addMistakeWord = (attempts, word) => {
  const normalized = normalizeWord(word);
  if (!normalized) return migrateAttempts(attempts);
  return { ...migrateAttempts(attempts), [normalized]: true };
};

export const removeMistakeWord = (attempts, word) => {
  const result = { ...migrateAttempts(attempts) };
  const normalized = normalizeWord(word);
  if (normalized) delete result[normalized];
  return result;
};

/** 모든 레벨을 훑어 중복 없는 오답 단어 수를 셉니다. */
export const countAllMistakes = () => {
  const allWords = new Set();
  LEVEL_STORAGE_KEYS.forEach(key => {
    const levelData = safeGetItem(key, {});
    Object.values(levelData).forEach(dayData => {
      if (dayData?.attempts) getMistakeWords(dayData.attempts).forEach(word => allWords.add(word));
    });
  });
  return allWords.size;
};

/**
 * 오답 수를 다시 세어 캐시에 저장합니다.
 * 홈 화면 배지는 이 캐시를 O(1)로 읽으므로, 오답이 바뀌면 반드시 호출해야 합니다.
 * @returns {number} 갱신된 오답 수
 */
export const refreshMistakesCache = () => {
  const count = countAllMistakes();
  safeSetItem(MISTAKES_CACHE_KEY, String(count));
  return count;
};

/** 캐시된 오답 수. 캐시가 없으면 null(→ 호출부에서 최초 1회 전체 스캔). */
export const readMistakesCache = () => {
  const cached = localStorage.getItem(MISTAKES_CACHE_KEY);
  return cached === null ? null : Number(cached);
};

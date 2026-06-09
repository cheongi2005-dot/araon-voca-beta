import { LEVEL_CONFIG } from '../config/levelConfig';

export const MISTAKES_CACHE_KEY = 'APP_totalMistakes';

// Converts any historical attempts format to canonical { [word]: true } map.
// Handles: Array [[w1,w2],[w3]], Firestore Map {"0":[w1,w2]}, new format {w1:true}
export const migrateAttempts = (attempts) => {
  if (!attempts) return {};

  if (Array.isArray(attempts)) {
    const result = {};
    attempts.flat().forEach(w => {
      if (w && typeof w === 'string' && w.trim()) result[w.trim().toLowerCase()] = true;
    });
    return result;
  }

  if (typeof attempts === 'object') {
    const keys = Object.keys(attempts);
    if (keys.length === 0) return {};
    if (keys.every(k => /^\d+$/.test(k))) {
      const result = {};
      keys.forEach(k => {
        const arr = attempts[k];
        if (Array.isArray(arr)) {
          arr.forEach(w => { if (w && typeof w === 'string' && w.trim()) result[w.trim().toLowerCase()] = true; });
        }
      });
      return result;
    }
    return attempts;
  }

  return {};
};

export const getMistakeWords = (attempts) => Object.keys(migrateAttempts(attempts));

export const hasAnyMistakes = (attempts) => getMistakeWords(attempts).length > 0;

export const addMistakeWord = (attempts, word) => {
  const normalized = word.trim().toLowerCase();
  return { ...migrateAttempts(attempts), [normalized]: true };
};

export const removeMistakeWord = (attempts, word) => {
  const result = { ...migrateAttempts(attempts) };
  delete result[word.trim().toLowerCase()];
  return result;
};

export const refreshMistakesCache = () => {
  const storageKeys = Object.values(LEVEL_CONFIG).map(c => c.key);
  const allWords = new Set();
  storageKeys.forEach(k => {
    try {
      const data = JSON.parse(localStorage.getItem(k) || '{}');
      Object.values(data).forEach(d => {
        if (d?.attempts) getMistakeWords(d.attempts).forEach(w => allWords.add(w));
      });
    } catch {}
  });
  localStorage.setItem(MISTAKES_CACHE_KEY, allWords.size);
};

/**
 * TTS 오디오 캐시.
 *
 * 3단계로 나눠 두어 같은 단어를 두 번 결제하지 않게 합니다.
 *   1) 세션 캐시(Map) — ObjectURL, 탭을 닫으면 사라짐. 즉시 재생.
 *   2) IndexedDB     — base64 원본, 재방문/오프라인에도 유지.
 *   3) Cloud Function — 위 둘이 모두 비었을 때만 ElevenLabs를 호출.
 */
const DB_NAME = 'araon_tts_cache';
const STORE_NAME = 'audio';

/** 세션 캐시가 이 개수를 넘으면 가장 오래된 ObjectURL부터 해제합니다. */
const SESSION_CACHE_MAX = 100;

const sessionCache = new Map();
/** 같은 단어에 대한 동시 요청을 하나로 합칩니다. */
const inFlight = new Map();

let dbPromise = null;

const openDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => { dbPromise = null; reject(request.error); };
  });
  return dbPromise;
};

export const idbGet = async (key) => {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const idbSet = async (key, value) => {
  try {
    const db = await openDB();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  } catch {}
};

export const base64ToObjectURL = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
};

export const hasSessionAudio = (text) => sessionCache.has(text);
export const getSessionAudio = (text) => sessionCache.get(text);
export const isFetching = (text) => inFlight.has(text);

/** 세션 캐시에 넣고, 넘치면 가장 오래된 항목의 ObjectURL을 해제합니다. */
export const putSessionAudio = (text, url) => {
  if (sessionCache.size >= SESSION_CACHE_MAX) {
    const oldestKey = sessionCache.keys().next().value;
    URL.revokeObjectURL(sessionCache.get(oldestKey));
    sessionCache.delete(oldestKey);
  }
  sessionCache.set(text, url);
};

/**
 * 캐시에서 찾고, 없으면 fetchBase64로 받아 두 단계 캐시에 모두 넣습니다.
 * 같은 단어를 동시에 요청하면 진행 중인 약속을 그대로 돌려줍니다.
 */
export const resolveAudioUrl = (text, fetchBase64) => {
  if (sessionCache.has(text)) return Promise.resolve(sessionCache.get(text));
  if (inFlight.has(text)) return inFlight.get(text);

  const promise = (async () => {
    try {
      const cached = await idbGet(text);
      if (cached) {
        const url = base64ToObjectURL(cached);
        putSessionAudio(text, url);
        return url;
      }

      const base64 = await fetchBase64(text);
      await idbSet(text, base64);
      const url = base64ToObjectURL(base64);
      putSessionAudio(text, url);
      return url;
    } finally {
      inFlight.delete(text);
    }
  })();

  inFlight.set(text, promise);
  return promise;
};

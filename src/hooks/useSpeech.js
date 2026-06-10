import { useState, useEffect, useCallback, useRef } from 'react';
import { app } from '../firebase-config';
import { safeGetItem } from '../utils/storage';

// 세션 캐시 (ObjectURL, 탭 닫으면 사라짐)
const audioCache = new Map();
const AUDIO_CACHE_MAX = 100;

// 중복 요청 방지 (같은 단어 동시 요청 시 하나만 실행)
const inFlightCache = new Map();

// ── IndexedDB 영구 캐시 ──────────────────────────────────────
const DB_NAME = 'araon_tts_cache';
const STORE_NAME = 'audio';
let dbPromise = null;

const openDB = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
};

const idbGet = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
};

const idbSet = async (key, value) => {
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

const base64ToObjectURL = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
};
// ────────────────────────────────────────────────────────────

export const useSpeech = () => {
  const [muted, setMuted] = useState(false);
  const [voices, setVoices] = useState([]);
  const ttsFnRef = useRef(null);

  const [voiceConfig, setVoiceConfig] = useState(() => {
    const saved = localStorage.getItem('araon_voca_voice_config');
    return saved ? JSON.parse(saved) : { rate: 0.9, volume: 1.0 };
  });

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    localStorage.setItem('araon_voca_voice_config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  const findBestChromeVoice = (availableVoices) => {
    for (const keyword of ["Google US English", "English United States", "en-US"]) {
      const voice = availableVoices.find(v => v.name.includes(keyword));
      if (voice) return voice;
    }
    return availableVoices.find(v => v.lang.startsWith('en')) || null;
  };

  const playBrowserTTS = useCallback((text, savedVoiceName) => {
    const msg = new SpeechSynthesisUtterance(text);
    const availableVoices = window.speechSynthesis.getVoices();
    const targetVoice =
      availableVoices.find(v => v.name === savedVoiceName) ||
      findBestChromeVoice(availableVoices);
    if (targetVoice) msg.voice = targetVoice;
    msg.lang = 'en-US';
    msg.rate = voiceConfig.rate;
    msg.volume = voiceConfig.volume;
    window.speechSynthesis.speak(msg);
  }, [voiceConfig]);

  const ensureTtsFn = useCallback(async () => {
    if (!ttsFnRef.current) {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions(app, 'asia-northeast3');
      ttsFnRef.current = httpsCallable(functions, 'tts', { timeout: 30000 });
    }
    return ttsFnRef.current;
  }, []);

  // 단어 하나를 캐시에 저장 (세션 + IndexedDB)
  const fetchAndCacheAI = useCallback(async (text) => {
    if (audioCache.has(text)) return audioCache.get(text);
    if (inFlightCache.has(text)) return inFlightCache.get(text);

    const promise = (async () => {
      // IndexedDB 먼저 확인 (네트워크 불필요)
      const cached = await idbGet(text);
      if (cached) {
        const url = base64ToObjectURL(cached);
        audioCache.set(text, url);
        inFlightCache.delete(text);
        return url;
      }

      // ElevenLabs Cloud Function 호출
      const ttsFn = await ensureTtsFn();
      const result = await ttsFn({ text });
      const base64Audio = result.data.audio;

      await idbSet(text, base64Audio);

      const url = base64ToObjectURL(base64Audio);
      if (audioCache.size >= AUDIO_CACHE_MAX) {
        const firstKey = audioCache.keys().next().value;
        URL.revokeObjectURL(audioCache.get(firstKey));
        audioCache.delete(firstKey);
      }
      audioCache.set(text, url);
      inFlightCache.delete(text);
      return url;
    })();

    inFlightCache.set(text, promise);
    return promise;
  }, [ensureTtsFn]);

  const speak = useCallback(async (text) => {
    if (muted) return;
    window.speechSynthesis.cancel();

    const useAI = safeGetItem('araon_voca_use_ai', true);
    const savedVoiceName = localStorage.getItem('araon_voca_voice_name');

    if (useAI) {
      // 1순위: 세션 캐시 (즉시 재생)
      if (audioCache.has(text)) {
        const audio = new Audio(audioCache.get(text));
        audio.volume = voiceConfig.volume;
        audio.playbackRate = voiceConfig.rate;
        await audio.play();
        return;
      }

      // 2순위: IndexedDB 캐시 (로컬 읽기, ~수십ms)
      const cached = await idbGet(text);
      if (cached) {
        const url = base64ToObjectURL(cached);
        audioCache.set(text, url);
        const audio = new Audio(url);
        audio.volume = voiceConfig.volume;
        audio.playbackRate = voiceConfig.rate;
        await audio.play();
        return;
      }

      // 3순위: 캐시 없음 → 브라우저 TTS 즉시 재생 + 백그라운드 AI 캐시
      playBrowserTTS(text, savedVoiceName);
      fetchAndCacheAI(text).catch(() => {});
      return;
    }

    playBrowserTTS(text, savedVoiceName);
  }, [muted, voiceConfig, playBrowserTTS, fetchAndCacheAI]);

  // Day 선택 시 해당 day 단어 전체를 백그라운드에서 미리 캐시
  const prefetchWords = useCallback(async (words) => {
    const useAI = safeGetItem('araon_voca_use_ai', true);
    if (!useAI) return;

    const toFetch = words.filter(w => !audioCache.has(w) && !inFlightCache.has(w));
    const CONCURRENCY = 3;

    for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
      await Promise.allSettled(
        toFetch.slice(i, i + CONCURRENCY).map(w => fetchAndCacheAI(w))
      );
    }
  }, [fetchAndCacheAI]);

  return { speak, voices, muted, setMuted, voiceConfig, setVoiceConfig, prefetchWords };
};

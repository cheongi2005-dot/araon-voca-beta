import { useState, useEffect, useCallback, useRef } from 'react';
import { app } from '../firebase-config';
import { STORAGE_KEYS } from '../config/storageKeys';
import { safeGetItem, safeSetJson } from '../utils/storage';
import {
  getSessionAudio,
  hasSessionAudio,
  idbGet,
  base64ToObjectURL,
  isFetching,
  putSessionAudio,
  resolveAudioUrl,
} from '../utils/audioCache';

const FUNCTIONS_REGION = 'asia-northeast3';
const TTS_TIMEOUT_MS = 30000;
/** 미리 받기는 동시 요청 수를 제한해 학습 중 네트워크를 독점하지 않게 합니다. */
const PREFETCH_CONCURRENCY = 3;

const DEFAULT_VOICE_CONFIG = { rate: 0.9, volume: 1.0 };
/** 브라우저 TTS 목소리 선호 순위 — 위쪽일수록 원어민에 가깝습니다. */
const PREFERRED_VOICE_KEYWORDS = ['Google US English', 'English United States', 'en-US'];

const pickBrowserVoice = (voices, savedVoiceName) => {
  const saved = voices.find(voice => voice.name === savedVoiceName);
  if (saved) return saved;
  for (const keyword of PREFERRED_VOICE_KEYWORDS) {
    const matched = voices.find(voice => voice.name.includes(keyword));
    if (matched) return matched;
  }
  return voices.find(voice => voice.lang.startsWith('en')) || null;
};

/**
 * 단어 발음 재생.
 *
 * AI 음성(ElevenLabs)은 Cloud Function을 거쳐 받아오고 두 단계로 캐시합니다.
 * 캐시가 비었을 때는 기다리게 하지 않고 브라우저 TTS로 즉시 재생한 뒤,
 * 백그라운드에서 AI 음성을 받아 다음 재생부터 쓰도록 합니다.
 */
export const useSpeech = () => {
  const [muted, setMuted] = useState(false);
  const [voices, setVoices] = useState([]);
  const ttsFnRef = useRef(null);

  const [voiceConfig, setVoiceConfig] = useState(
    () => safeGetItem(STORAGE_KEYS.voiceConfig, null) || DEFAULT_VOICE_CONFIG
  );

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('en')));
    };
    loadVoices();
    // 크롬은 목소리 목록을 비동기로 채우므로 이벤트로 한 번 더 받습니다.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
    safeSetJson(STORAGE_KEYS.voiceConfig, voiceConfig);
  }, [voiceConfig]);

  const playBrowserTTS = useCallback((text, savedVoiceName) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickBrowserVoice(window.speechSynthesis.getVoices(), savedVoiceName);
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.rate = voiceConfig.rate;
    utterance.volume = voiceConfig.volume;
    window.speechSynthesis.speak(utterance);
  }, [voiceConfig]);

  /** Cloud Functions SDK는 무거우므로 실제로 필요할 때 한 번만 불러옵니다. */
  const ensureTtsFn = useCallback(async () => {
    if (!ttsFnRef.current) {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions(app, FUNCTIONS_REGION);
      ttsFnRef.current = httpsCallable(functions, 'tts', { timeout: TTS_TIMEOUT_MS });
    }
    return ttsFnRef.current;
  }, []);

  const fetchAndCacheAI = useCallback((text) => resolveAudioUrl(text, async (word) => {
    const ttsFn = await ensureTtsFn();
    const result = await ttsFn({ text: word });
    return result.data.audio;
  }), [ensureTtsFn]);

  const playUrl = useCallback(async (url) => {
    const audio = new Audio(url);
    audio.volume = voiceConfig.volume;
    audio.playbackRate = voiceConfig.rate;
    await audio.play();
  }, [voiceConfig]);

  const speak = useCallback(async (text) => {
    if (muted) return;
    window.speechSynthesis.cancel();

    const useAI = safeGetItem(STORAGE_KEYS.useAiVoice, true);
    const savedVoiceName = localStorage.getItem(STORAGE_KEYS.voiceName);

    if (!useAI) {
      playBrowserTTS(text, savedVoiceName);
      return;
    }

    // 1순위: 세션 캐시 — 지연 없이 재생됩니다.
    if (hasSessionAudio(text)) {
      await playUrl(getSessionAudio(text));
      return;
    }

    // 2순위: IndexedDB — 로컬 읽기라 수십 ms면 충분합니다.
    const cached = await idbGet(text);
    if (cached) {
      const url = base64ToObjectURL(cached);
      putSessionAudio(text, url);
      await playUrl(url);
      return;
    }

    // 3순위: 캐시 미스 — 기다리게 하지 않고 브라우저 TTS로 먼저 들려주고,
    // AI 음성은 뒤에서 받아 다음 재생부터 사용합니다.
    playBrowserTTS(text, savedVoiceName);
    fetchAndCacheAI(text).catch(() => {});
  }, [muted, playBrowserTTS, playUrl, fetchAndCacheAI]);

  /** Day를 열 때 그 날의 단어를 미리 받아둬 학습 중 지연을 없앱니다. */
  const prefetchWords = useCallback(async (words) => {
    if (!safeGetItem(STORAGE_KEYS.useAiVoice, true)) return;

    const pending = words.filter(word => !hasSessionAudio(word) && !isFetching(word));
    for (let i = 0; i < pending.length; i += PREFETCH_CONCURRENCY) {
      await Promise.allSettled(
        pending.slice(i, i + PREFETCH_CONCURRENCY).map(word => fetchAndCacheAI(word))
      );
    }
  }, [fetchAndCacheAI]);

  return { speak, voices, muted, setMuted, voiceConfig, setVoiceConfig, prefetchWords };
};

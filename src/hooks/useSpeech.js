import { useState, useEffect, useCallback, useRef } from 'react';
import { app } from '../firebase-config';
import { safeGetItem } from '../utils/storage';

// 🎯 일레븐랩스 오디오 캐시 (세션 동안 유지, 최대 100개)
const audioCache = new Map();
const AUDIO_CACHE_MAX = 100;

export const useSpeech = () => {
  const [muted, setMuted] = useState(() => safeGetItem('araon_voca_speech_muted', false));
  const [voices, setVoices] = useState([]);
  const ttsFnRef = useRef(null);
  
  // 🔊 음성 설정 (속도, 음량 등)을 기억하고 불러오는 로직
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
    localStorage.setItem('araon_voca_speech_muted', JSON.stringify(muted));
  }, [muted]);

  // 설정이 바뀔 때마다 저장
  useEffect(() => {
    localStorage.setItem('araon_voca_voice_config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  // 🎯 크롬 최적화: 가장 좋은 목소리 찾기 알고리즘
  const findBestChromeVoice = (availableVoices) => {
    const chromePriority = [
      "Google US English", // 크롬의 가장 자연스러운 목소리
      "English United States",
      "en-US"
    ];

    for (const keyword of chromePriority) {
      const voice = availableVoices.find(v => v.name.includes(keyword));
      if (voice) return voice;
    }
    return availableVoices.find(v => v.lang.startsWith('en')) || null;
  };

  const speak = useCallback(async (text) => {
    if (muted) return;
    window.speechSynthesis.cancel();

    const useAI = safeGetItem('araon_voca_use_ai', true);
    const savedVoiceName = localStorage.getItem('araon_voca_voice_name');

    try {
      // 1순위: Cloud Function을 통한 ElevenLabs TTS (API 키 서버 보관)
      if (useAI) {
        // 캐시 확인: 이미 생성된 오디오가 있다면 즉시 재생
        if (audioCache.has(text)) {
          const cachedAudio = new Audio(audioCache.get(text));
          cachedAudio.volume = voiceConfig.volume;
          cachedAudio.playbackRate = voiceConfig.rate;
          await cachedAudio.play();
          return;
        }

        // Cloud Function SDK 지연 로딩 (초기 번들 크기 최소화)
        if (!ttsFnRef.current) {
          const { getFunctions, httpsCallable } = await import('firebase/functions');
          const functions = getFunctions(app, 'asia-northeast3');
          ttsFnRef.current = httpsCallable(functions, 'tts', { timeout: 30000 });
        }

        const result = await ttsFnRef.current({ text });
        const base64Audio = result.data.audio;

        // base64 → Blob → ObjectURL
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        // 캐시에 저장 (최대 크기 초과 시 가장 오래된 항목 삭제)
        if (audioCache.size >= AUDIO_CACHE_MAX) {
          const firstKey = audioCache.keys().next().value;
          URL.revokeObjectURL(audioCache.get(firstKey));
          audioCache.delete(firstKey);
        }
        audioCache.set(text, url);

        const audio = new Audio(url);
        audio.volume = voiceConfig.volume;
        audio.playbackRate = voiceConfig.rate;
        await audio.play();
        return;
      }
      throw new Error("Use Browser Voice");

    } catch (error) {
      // 2순위: 브라우저(크롬) 엔진 폴백
      console.warn("브라우저 엔진 사용:", error.message);
      
      const msg = new SpeechSynthesisUtterance(text);
      const availableVoices = window.speechSynthesis.getVoices();

      // 🎯 매칭 우선순위: 사용자 선택 이름 -> 크롬 최적화 보이스 -> 기본 영어
      const targetVoice = 
        availableVoices.find(v => v.name === savedVoiceName) || 
        findBestChromeVoice(availableVoices);

      if (targetVoice) msg.voice = targetVoice;
      msg.lang = 'en-US';
      msg.rate = voiceConfig.rate; 
      msg.volume = voiceConfig.volume;
      window.speechSynthesis.speak(msg);
    }
  }, [muted, voiceConfig]);

  return { speak, voices, muted, setMuted, voiceConfig, setVoiceConfig };
};
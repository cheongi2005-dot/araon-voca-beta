import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [voices, setVoices] = useState([]);
  const [muted, setMuted] = useState(() => JSON.parse(localStorage.getItem('araon_voca_speech_muted') ?? 'false')); // 음소거 상태 추가 (기본값 false)

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    localStorage.setItem('araon_voca_speech_muted', JSON.stringify(muted));
  }, [muted]); // 음소거 상태 변경 시 localStorage에 저장

  const speak = (text) => {
    if (muted) return; // 음소거 상태이면 소리 재생 안함
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const voiceIdx = parseInt(localStorage.getItem('araon_voca_voice_idx') || '0');
    if (voices[voiceIdx]) msg.voice = voices[voiceIdx];
    msg.lang = 'en-US';
    msg.rate = 0.85;
    window.speechSynthesis.speak(msg);
  };

  return { speak, voices, muted, setMuted }; // muted 상태와 setMuted 함수 반환
};
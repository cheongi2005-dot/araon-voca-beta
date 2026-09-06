import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { STORAGE_KEYS } from '../config/storageKeys';
import { safeGetItem, safeSetJson } from '../utils/storage';

/**
 * 알림/퀴즈 설정을 클라우드와 동기화합니다.
 *
 * 로컬 값으로 먼저 화면을 그리고, 로그인이 확인되면 서버 값으로 덮어씁니다.
 * 기기마다 설정이 갈리지 않도록 서버를 항상 진실의 원천으로 둡니다.
 */
export const useSyncSettings = () => {
  const [settings, setSettings] = useState(() => safeGetItem(STORAGE_KEYS.settings, null));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snapshot = await getDoc(doc(db, 'users', user.email));
        const cloudSettings = snapshot.data()?.settings;
        if (!cloudSettings) return;
        setSettings(cloudSettings);
        safeSetJson(STORAGE_KEYS.settings, cloudSettings);
      } catch (error) {
        console.error('[useSyncSettings] 설정 로드 오류:', error);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    // 토글 반응이 네트워크를 기다리지 않도록 화면과 로컬을 먼저 갱신합니다.
    setSettings(newSettings);
    safeSetJson(STORAGE_KEYS.settings, newSettings);

    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.email), { settings: newSettings }, { merge: true });
    } catch (error) {
      console.error('[useSyncSettings] 설정 저장 오류:', error);
    }
  }, []);

  return [settings, updateSettings];
};

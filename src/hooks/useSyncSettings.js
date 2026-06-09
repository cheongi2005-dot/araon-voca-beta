import { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { safeGetItem } from '../utils/storage';

export const useSyncSettings = () => {
  const [settings, setSettings] = useState(() => safeGetItem('araon_voca_settings', null));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "users", user.email));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.settings) {
            const cloudSettings = userData.settings;
            setSettings(cloudSettings);
            // 🎯 로컬 스토리지도 클라우드 기준으로 동기화
            localStorage.setItem('araon_voca_settings', JSON.stringify(cloudSettings));
          }
        }
      } catch (e) {
        console.error('[useSyncSettings] 설정 로드 오류:', e);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.email), { settings: newSettings }, { merge: true });
    }
    localStorage.setItem('araon_voca_settings', JSON.stringify(newSettings));
  };

  return [settings, updateSettings];
};
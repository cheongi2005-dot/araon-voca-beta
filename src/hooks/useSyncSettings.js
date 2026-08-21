import { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { doc, setDoc } from 'firebase/firestore';
import { safeGetItem } from '../utils/storage';
import { useUserData } from '../contexts/UserDataContext';

export const useSyncSettings = () => {
  // 🎯 users/{email} 문서는 앱 전체가 공유하는 UserDataContext에서 한 번만 구독합니다.
  const { userData } = useUserData();
  const [settings, setSettings] = useState(() => safeGetItem('araon_voca_settings', null));

  useEffect(() => {
    if (userData?.settings) {
      const cloudSettings = userData.settings;
      setSettings(cloudSettings);
      // 🎯 로컬 스토리지도 클라우드 기준으로 동기화
      localStorage.setItem('araon_voca_settings', JSON.stringify(cloudSettings));
    }
  }, [userData]);

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
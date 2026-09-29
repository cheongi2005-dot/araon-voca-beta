import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { LEVEL_CONFIG } from '../config/levelConfig';
import { MISTAKES_CACHE_KEY } from '../utils/mistakes';

const UserDataContext = createContext(null);
const CACHE_KEY = 'araon_cached_user';
const OWNER_KEY = 'araon_local_owner';

// 계정별 로컬 데이터 (테마·음성 설정처럼 기기 설정은 제외)
const USER_SCOPED_KEYS = [
  ...Object.values(LEVEL_CONFIG).map(c => c.key),
  MISTAKES_CACHE_KEY, CACHE_KEY, 'araon_voca_settings', 'araon_cached_rank', 'araon_cached_rank_at'
];

// 공용 기기에서 다른 계정이 로그인하면 이전 계정의 진도·오답이 보이거나, 동기화 때 새 계정 DB로 올라가지 않도록 지운다.
// 이 키가 생기기 전부터 쓰던 기기는 캐시된 사용자 문서로 주인을 추정하고, 그것도 없으면 지금 계정 것으로 본다.
const claimLocalData = (email) => {
  const owner = localStorage.getItem(OWNER_KEY) ?? safeGetItem(CACHE_KEY, null)?.id ?? email;
  if (owner !== email) USER_SCOPED_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.setItem(OWNER_KEY, email);
};

// 개인정보(name, phone, fcmToken 등)는 localStorage에 저장하지 않음
const sanitizeForCache = (data) => {
  const { name, phone, fcmToken, lastTokenUpdate, ...safe } = data;
  return safe;
};

// users/{email} 문서를 앱 전체에서 한 번만 구독해서 공유합니다.
// (이전에는 Home/LevelHome/LevelTemplate/StudentDashboard/MyVoca/알림설정 등
//  페이지마다 각자 같은 문서를 따로 조회했습니다)
export const UserDataProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => safeGetItem(CACHE_KEY, null));
  const [isLoading, setIsLoading] = useState(() => !safeGetItem(CACHE_KEY, null));

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      // 학부모(커스텀 토큰) 세션에는 email이 없어 학생 문서를 구독하지 않는다
      if (!user?.email) {
        setUserData(null);
        setIsLoading(false);
        return;
      }

      claimLocalData(user.email);
      const cached = safeGetItem(CACHE_KEY, null);
      const mine = cached?.id === user.email ? cached : null;
      setUserData(mine);
      setIsLoading(!mine);

      unsubscribeSnapshot = onSnapshot(
        doc(db, "users", user.email),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            setUserData(data);
            try { safeSetItem(CACHE_KEY, JSON.stringify(sanitizeForCache(data))); } catch (_) {}
          } else {
            setUserData(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('[UserDataContext] 사용자 데이터 구독 오류:', error);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <UserDataContext.Provider value={{ userData, isLoading }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData는 UserDataProvider 내부에서만 사용할 수 있습니다.');
  return ctx;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { safeGetItem, safeSetItem } from '../utils/storage';

const UserDataContext = createContext(null);

// 개인정보(name, phone, fcmToken 등)는 localStorage에 저장하지 않음
const sanitizeForCache = (data) => {
  const { name, phone, fcmToken, lastTokenUpdate, ...safe } = data;
  return safe;
};

// users/{email} 문서를 앱 전체에서 한 번만 구독해서 공유합니다.
// (이전에는 Home/LevelHome/LevelTemplate/StudentDashboard/MyVoca/알림설정 등
//  페이지마다 각자 같은 문서를 따로 조회했습니다)
export const UserDataProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => safeGetItem('araon_cached_user', null));
  const [isLoading, setIsLoading] = useState(() => !safeGetItem('araon_cached_user', null));

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setUserData(null);
        setIsLoading(false);
        return;
      }

      unsubscribeSnapshot = onSnapshot(
        doc(db, "users", user.email),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            setUserData(data);
            try { safeSetItem('araon_cached_user', JSON.stringify(sanitizeForCache(data))); } catch (_) {}
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

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 모바일은 IndexedDB 초기화가 느리므로 메모리 캐시 사용, PC는 오프라인 지원을 위해 persistent 유지
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const db = initializeFirestore(app, {
  localCache: isMobile ? memoryLocalCache() : persistentLocalCache()
});

// ✅ Analytics는 첫 렌더를 막지 않도록 비동기 지연 초기화
let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(() => {});
}

// 🎯 messaging/functions는 알림 설정, 관리자 페이지 등 실제로 필요할 때만 로드합니다.
// (모든 페이지의 메인 번들에 두 SDK가 항상 포함되던 것을 막아 모바일 초기 로딩을 단축합니다.)
let messagingPromise = null;
export const getMessagingInstance = () => {
  if (!messagingPromise) {
    messagingPromise = import('firebase/messaging').then(({ getMessaging }) => {
      try {
        // messaging은 HTTPS 또는 localhost에서만 지원되므로 try-catch로 보호
        return getMessaging(app);
      } catch (e) {
        console.warn('[FCM] Firebase Messaging 초기화 실패 (지원하지 않는 환경):', e.message);
        return null;
      }
    // 청크 로드 자체가 네트워크 문제로 실패한 경우, 실패한 Promise를 캐시하지 않고 다음 호출에서 재시도
    }).catch((e) => { messagingPromise = null; throw e; });
  }
  return messagingPromise;
};

let functionsPromise = null;
export const getFunctionsInstance = () => {
  if (!functionsPromise) {
    functionsPromise = import('firebase/functions')
      .then(({ getFunctions }) => getFunctions(app, 'asia-northeast3'))
      .catch((e) => { functionsPromise = null; throw e; });
  }
  return functionsPromise;
};

export { app, auth, db, analytics };
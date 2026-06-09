import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';
import { getMessaging } from "firebase/messaging";

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

// ✅ messaging은 HTTPS 또는 localhost에서만 지원되므로 try-catch로 보호
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('[FCM] Firebase Messaging 초기화 실패 (지원하지 않는 환경):', e.message);
}

// ✅ Analytics는 첫 렌더를 막지 않도록 비동기 지연 초기화
let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(() => {});
}

export { app, auth, db, messaging, analytics };
// firebase-config.js (public/ 정적 HTML 전용)
// 주의: 이 파일은 React 빌드 시스템 밖(admin.html, study.html)에서 사용되므로
// process.env를 쓸 수 없어 설정값이 코드에 포함됩니다.
// Firebase 클라이언트 설정은 공개용이지만, Git에 올리기 전에
// Firebase Console > API 제한 > HTTP referrer를 반드시 설정하세요.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBX884NnG9CxLSa72C0lvKhSGgmONFhSi8",
  authDomain: "vocaraon.firebaseapp.com",
  projectId: "vocaraon",
  storageBucket: "vocaraon.firebasestorage.app",
  messagingSenderId: "308326880420",
  appId: "1:308326880420:web:44df6138df2111a012c231",
  measurementId: "G-M9ZJPEJFFW"
};

// 파이어베이스 시작!
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ 폰이나 예외 상황에서 앱이 뻗는 걸 막아주는 안전한 알림 초기화
export let messaging = null;

isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log("✅ Firebase 알림 지원 환경입니다.");
  } else {
    // 알림을 지원하지 않는 폰이나 브라우저에서는 그냥 넘어갑니다. (에러 발생 X)
    console.warn("🚨 현재 환경(또는 기기)에서는 Firebase 알림을 지원하지 않습니다.");
  }
});
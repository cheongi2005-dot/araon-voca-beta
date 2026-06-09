importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 주의: Service Worker는 process.env를 사용할 수 없어 설정값이 여기에 포함됩니다.
// Firebase Console > API 제한 > HTTP referrer를 설정하여 무단 사용을 방지하세요.
const firebaseConfig = {
  apiKey: "AIzaSyBX884NnG9CxLSa72C0lvKhSGgmONFhSi8",
  authDomain: "vocaraon.firebaseapp.com",
  projectId: "vocaraon",
  storageBucket: "vocaraon.firebasestorage.app",
  messagingSenderId: "308326880420",
  appId: "1:308326880420:web:44df6138df2111a012c231",
  measurementId: "G-M9ZJPEJFFW"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 백그라운드 메시지 수신:', payload);
  const notificationTitle = payload.notification.title || "ARAON VOCA";
  const notificationOptions = {
    body: payload.notification.body || "학습 알림이 도착했습니다!",
    icon: '/raon_B.webp',
    badge: '/raon_B.webp',
    tag: 'araon-voca-alarm', // 알림이 중복으로 쌓이지 않게 함
    renotify: true           // 새 알림이 오면 다시 진동/소리 발생
  };
  
  // 🎯 Promise를 반환하여 브라우저가 알림을 띄울 때까지 프로세스를 유지하게 합니다.
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
import { auth, db, getMessagingInstance } from './firebase-config';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken } from "firebase/messaging";

/**
 * 알림 권한을 요청하고 FCM 토큰을 서버에 갱신합니다.
 */
export const refreshNotificationToken = async () => {
  try {
    if (Notification.permission !== 'granted') return;
    // 학부모(커스텀 토큰) 세션은 email이 없고 학생 문서도 없다
    const user = auth.currentUser;
    if (!user?.email) return;
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('[FCM] messaging이 초기화되지 않아 토큰 갱신을 건너뜁니다.');
      return;
    }

    const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      await setDoc(doc(db, "users", user.email), {
        fcmToken: token,
        lastTokenUpdate: serverTimestamp()
      }, { merge: true });
      console.log("[Push] Token refreshed successfully.");
    }
  } catch (error) {
    console.error("[Push] Token Refresh Error:", error);
  }
};

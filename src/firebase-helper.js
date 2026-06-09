// src/firebase-helper.js (또는 src/utils/firebase-helper.js)
// ⚠️ 주의: 파일이 src/utils에 있다면 '../firebase-config'로, src에 있다면 './firebase-config'로 수정하세요.
import { auth, db, messaging } from './firebase-config'; 
import { doc, setDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";

/**
 * 알림 권한을 요청하고 FCM 토큰을 서버에 갱신합니다.
 */
export const refreshNotificationToken = async () => {
  try {
    if (Notification.permission !== 'granted') return;
    if (!messaging) {
      console.warn('[FCM] messaging이 초기화되지 않아 토큰 갱신을 건너뜁니다.');
      return;
    }

    const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (token) {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.email), { 
          fcmToken: token,
          lastTokenUpdate: serverTimestamp() 
        }, { merge: true });
        console.log("[Push] Token refreshed successfully.");
      }
    }
  } catch (error) {
    console.error("[Push] Token Refresh Error:", error);
  }
};

/**
 * 학생의 학습 데이터를 Firestore에 일괄 저장합니다.
 * @param {string} levelTitle - 현재 레벨 명칭 (예: '초등 기초 100일')
 * @param {string|number} day - 현재 학습 Day (예: 5)
 * @param {number} score - 퀴즈 정답 개수
 * @param {string} mode - 풀이 방식 (choice, letter, full)
 */
export const saveLevelProgress = async (levelTitle, day, score, mode) => {
  const user = auth.currentUser;
  
  // 로그인 상태가 아니면 실행하지 않음
  if (!user || !user.email) {
    console.warn("로그인된 사용자 정보가 없어 데이터를 저장할 수 없습니다.");
    return;
  }

  try {
    // 오늘 날짜 생성 (예: "2026-02-12")
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", user.email);

    await setDoc(userRef, {
      // 1. 현재 진도 정보
      currentLevel: levelTitle,
      currentDay: `Day ${day}`,
      
      // 2. 최근 퀴즈 결과 및 방식
      lastScore: score,
      solvingMethod: mode, 
      
      // 3. 출석 체크 (배열에 오늘 날짜 추가, 중복 방지)
      attendance: arrayUnion(today), 
      
      // 4. 시스템 정보
      lastActive: serverTimestamp() 
    }, { merge: true }); // ✅ 중요: 기존 '이름'과 '전화번호' 데이터가 지워지지 않게 병합합니다.

    console.log(`[${user.email}] 서버 진도 및 출석 저장 완료!`);
  } catch (err) {
    console.error("Firebase 저장 중 에러가 발생했습니다:", err);
  }
};
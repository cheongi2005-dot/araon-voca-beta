const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// 1. 파이어베이스 초기화
admin.initializeApp();

// 2. 지역 설정을 서울로 고정
setGlobalOptions({ region: "asia-northeast3" });

// 한국 시간 계산 함수
const getCurrentKSTTime = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 🔊 0. ElevenLabs TTS 프록시 (API 키를 서버에서만 사용)
 * 클라이언트는 이 함수를 호출하며, 실제 ElevenLabs 키는 절대 노출되지 않음
 */
exports.tts = onCall({
  region: "asia-northeast3",
  memory: "256MiB",
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const text = request.data?.text;
  if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > 300) {
    throw new HttpsError("invalid-argument", "올바르지 않은 텍스트입니다.");
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new HttpsError("unavailable", "TTS 서비스가 설정되지 않았습니다.");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.5 },
    }),
  });

  if (!response.ok) {
    console.error(`ElevenLabs API error: ${response.status}`);
    throw new HttpsError("internal", "TTS 요청에 실패했습니다.");
  }

  const audioBuffer = await response.arrayBuffer();
  return { audio: Buffer.from(audioBuffer).toString("base64") };
});

/**
 * 🏆 1. 랭킹 추월 알림 (v2 실시간 트리거)
 */
exports.checkRankingOvertake = onDocumentUpdated("users/{userEmail}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  // 🎯 마침표(.)가 포함된 평면 필드에서 데이터를 가져옵니다.
  const oldScore = beforeData["stats.weeklyWords"] || 0;
  const newScore = afterData["stats.weeklyWords"] || 0;

  if (newScore <= oldScore) return;

  const db = admin.firestore();
  try {
    // 🎯 쿼리 시에도 마침표 포함 필드를 정확히 지정합니다.
    const overtakenUsersQuery = await db.collection("users")
      .where("stats.weeklyWords", ">=", oldScore)
      .where("stats.weeklyWords", "<", newScore)
      .get();

    if (overtakenUsersQuery.empty) return;

    const messages = [];
    overtakenUsersQuery.forEach((doc) => {
      const overtakenUser = doc.data();
      if (overtakenUser.settings?.pushRanking && overtakenUser.fcmToken) {
        messages.push({
          token: overtakenUser.fcmToken,
          notification: {
            title: "🚨 랭킹 추월 비상!",
            body: `${afterData.name || "다른 학생"}님이 당신의 순위를 추월했습니다! 퀴즈를 풀어 점수를 만회하세요🔥`,
          }
        });
      }
    });

    if (messages.length > 0) await admin.messaging().sendEach(messages);
  } catch (error) {
    console.error("랭킹 알림 에러:", error);
  }
});

/**
 * ⏱️ 2. 오답 복습 시간 예약 (문제풀이 종료 후 1시간 뒤 계산)
 */
exports.setMistakeReminderTimer = onDocumentUpdated("users/{userEmail}", async (event) => {
  const afterData = event.data.after.data();
  const beforeData = event.data.before.data();
  const isQuizFinished = afterData.lastActivityType === "문제풀이" && beforeData.lastActivityType !== "문제풀이";
  const hasMistakes = (afterData.wrongCount || 0) > 0;

  if (isQuizFinished && hasMistakes) {
    const kstOffset = 9 * 60 * 60 * 1000;
    const nowKst = new Date(Date.now() + kstOffset);
    nowKst.setHours(nowKst.getHours() + 1);
    const reminderTime = `${String(nowKst.getUTCHours()).padStart(2, '0')}:${String(nowKst.getUTCMinutes()).padStart(2, '0')}`;

    try {
      await admin.firestore().collection("users").doc(event.params.userEmail).update({
        "settings.nextMistakeReminder": reminderTime
      });
      console.log(`[Timer] 오답 알림 예약: ${reminderTime}`);
    } catch (error) {
      console.error("타이머 예약 에러:", error);
    }
  }
});

/**
 * 🚀 3. 통합 알림 스케줄러 (매 1분마다 스트릭 및 오답 알림 체크)
 */
exports.scheduledStreakReminder = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Seoul",
  memory: "256MiB",
}, async (event) => {
  const currentTime = getCurrentKSTTime();
  const db = admin.firestore();
  
  try {
    const streakUsers = await db.collection("users")
      .where("settings.pushStreak", "==", true)
      .where("settings.streakTime", "==", currentTime)
      .get();

    const mistakeUsers = await db.collection("users")
      .where("settings.pushMistakes", "==", true)
      .where("settings.nextMistakeReminder", "==", currentTime)
      .where("wrongCount", ">", 0)
      .get();

    const messages = [];
    streakUsers.forEach((doc) => {
      const u = doc.data();
      if (u.fcmToken) messages.push({ token: u.fcmToken, notification: { title: "🔥 아라온 보카!", body: `${u.name || "학생"}님, 단어 공부할 시간이에요!` } });
    });

    mistakeUsers.forEach((doc) => {
      const u = doc.data();
      if (u.fcmToken) messages.push({ token: u.fcmToken, notification: { title: "🧠 오답 복습할 시간!", body: `잊기 전에 틀린 단어들, 지금 복습하면 머리에 쏙쏙 남아요!` } });
    });

    if (messages.length > 0) {
      await admin.messaging().sendEach(messages);
      console.log(`[${currentTime}] 알림 발송 완료`);
    }
  } catch (error) {
    console.error("스케줄러 실행 에러:", error);
  }
});
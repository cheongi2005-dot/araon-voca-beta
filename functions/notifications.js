/**
 * 푸시 알림 트리거 3종.
 *  - checkRankingOvertake    : 내 점수가 올라 다른 학생을 추월했을 때 그 학생에게 알림
 *  - setMistakeReminderTimer : 문제풀이 종료 시 오답 복습 알림 시각을 예약
 *  - scheduledStreakReminder : 1분마다 돌며 예약 시각이 된 알림을 발송
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { admin } = require("./config");

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** 문제풀이 후 오답 복습 알림까지의 간격. */
const MISTAKE_REMINDER_DELAY_HOURS = 1;

/** Date를 KST 기준 "HH:MM" 문자열로. 알림 예약 시각은 이 형식으로 저장·비교합니다. */
const toKstHHMM = (date) => {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const hours = String(kst.getUTCHours()).padStart(2, "0");
  const minutes = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const buildMessage = (user, title, body) =>
  (user.fcmToken ? { token: user.fcmToken, notification: { title, body } } : null);

const sendAll = async (messages) => {
  const valid = messages.filter(Boolean);
  if (valid.length > 0) await admin.messaging().sendEach(valid);
  return valid.length;
};

/** 주간 단어 점수가 올라 추월당한 학생들에게 알립니다. */
const checkRankingOvertake = onDocumentUpdated("users/{userEmail}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  // 이 필드는 마침표를 포함한 평면 필드명으로 저장돼 있어 중첩 접근이 아닌 문자열 키로 읽어야 합니다.
  const oldScore = beforeData["stats.weeklyWords"] || 0;
  const newScore = afterData["stats.weeklyWords"] || 0;
  if (newScore <= oldScore) return;

  try {
    const overtaken = await admin.firestore().collection("users")
      .where("stats.weeklyWords", ">=", oldScore)
      .where("stats.weeklyWords", "<", newScore)
      .get();

    if (overtaken.empty) return;

    const messages = overtaken.docs
      .map((doc) => doc.data())
      .filter((user) => user.settings?.pushRanking)
      .map((user) => buildMessage(
        user,
        "🚨 랭킹 추월 비상!",
        `${afterData.name || "다른 학생"}님이 당신의 순위를 추월했습니다! 퀴즈를 풀어 점수를 만회하세요🔥`
      ));

    await sendAll(messages);
  } catch (error) {
    console.error("랭킹 알림 에러:", error);
  }
});

/** 문제풀이를 막 끝냈고 오답이 남아 있으면 복습 알림 시각을 예약합니다. */
const setMistakeReminderTimer = onDocumentUpdated("users/{userEmail}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  const justFinishedQuiz = afterData.lastActivityType === "문제풀이"
    && beforeData.lastActivityType !== "문제풀이";
  const hasMistakes = (afterData.wrongCount || 0) > 0;
  if (!justFinishedQuiz || !hasMistakes) return;

  const reminderAt = new Date(Date.now() + MISTAKE_REMINDER_DELAY_HOURS * 60 * 60 * 1000);

  try {
    await admin.firestore().collection("users").doc(event.params.userEmail).update({
      "settings.nextMistakeReminder": toKstHHMM(reminderAt),
    });
  } catch (error) {
    console.error("타이머 예약 에러:", error);
  }
});

/** 1분마다 돌면서 지금 시각에 예약된 스트릭/오답 알림을 발송합니다. */
const scheduledStreakReminder = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Seoul",
  memory: "256MiB",
}, async () => {
  const currentTime = toKstHHMM(new Date());
  const db = admin.firestore();

  try {
    const [streakUsers, mistakeUsers] = await Promise.all([
      db.collection("users")
        .where("settings.pushStreak", "==", true)
        .where("settings.streakTime", "==", currentTime)
        .get(),
      db.collection("users")
        .where("settings.pushMistakes", "==", true)
        .where("settings.nextMistakeReminder", "==", currentTime)
        .where("wrongCount", ">", 0)
        .get(),
    ]);

    const messages = [
      ...streakUsers.docs.map((doc) => {
        const user = doc.data();
        return buildMessage(user, "🔥 아라온 보카!", `${user.name || "학생"}님, 단어 공부할 시간이에요!`);
      }),
      ...mistakeUsers.docs.map((doc) => buildMessage(
        doc.data(),
        "🧠 오답 복습할 시간!",
        "잊기 전에 틀린 단어들, 지금 복습하면 머리에 쏙쏙 남아요!"
      )),
    ];

    const sent = await sendAll(messages);
    if (sent > 0) console.log(`[${currentTime}] 알림 ${sent}건 발송 완료`);
  } catch (error) {
    console.error("스케줄러 실행 에러:", error);
  }
});

module.exports = { checkRankingOvertake, setMistakeReminderTimer, scheduledStreakReminder };

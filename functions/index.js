/**
 * Cloud Functions 진입점.
 * 실제 구현은 역할별 모듈에 있고 여기서는 내보내기만 모읍니다.
 * (./config를 먼저 불러 admin 초기화와 리전 설정을 마칩니다.)
 */
require("./config");

const { adminDeleteStudent, adminSendReply } = require("./admin-actions");
const { tts } = require("./tts");
const {
  checkRankingOvertake,
  setMistakeReminderTimer,
  scheduledStreakReminder,
} = require("./notifications");

module.exports = {
  adminDeleteStudent,
  adminSendReply,
  tts,
  checkRankingOvertake,
  setMistakeReminderTimer,
  scheduledStreakReminder,
};

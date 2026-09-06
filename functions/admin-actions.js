/** 관리자 전용 호출 함수 — Firestore 보안 규칙을 우회해야 하므로 Admin SDK로 처리합니다. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { admin, REGION } = require("./config");

/** 학생 계정 완전 삭제 (Auth + Firestore). */
const adminDeleteStudent = onCall({ region: REGION }, async (request) => {
  const { studentId } = request.data;
  if (!studentId) {
    throw new HttpsError("invalid-argument", "학생 ID가 없습니다.");
  }

  try {
    const user = await admin.auth().getUserByEmail(studentId);
    await admin.auth().deleteUser(user.uid);
  } catch (error) {
    // Auth 계정이 이미 없는 경우도 있으므로 Firestore 삭제는 계속 진행합니다.
    console.warn("[adminDeleteStudent] Auth 삭제 건너뜀:", error.message);
  }

  await admin.firestore().collection("users").doc(studentId).delete();
  return { success: true };
});

/** 문의 답변 저장. */
const adminSendReply = onCall({ region: REGION }, async (request) => {
  const { inquiryId, replyText } = request.data;
  if (!inquiryId || !replyText?.trim()) {
    throw new HttpsError("invalid-argument", "필수 정보가 없습니다.");
  }

  try {
    await admin.firestore().collection("inquiries").doc(inquiryId).update({
      adminReply: replyText.trim(),
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("답변 저장 오류:", error);
    throw new HttpsError("internal", "답변 저장에 실패했습니다.");
  }
});

module.exports = { adminDeleteStudent, adminSendReply };

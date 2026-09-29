const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

// 1. 파이어베이스 초기화
admin.initializeApp();

// 2. 지역 설정을 서울로 고정
setGlobalOptions({ region: "asia-northeast3" });

// 관리자 전용 함수 호출 검증: 로그인 여부 + ADMIN_EMAILS 허용목록 대조
// (ADMIN_EMAILS는 Cloud Functions 서버 환경에만 존재하므로 클라이언트 번들에 노출되지 않음)
const assertIsAdmin = (request) => {
  if (!request.auth?.token?.email) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }
  const allowedEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowedEmails.includes(request.auth.token.email.toLowerCase())) {
    throw new HttpsError("permission-denied", "관리자 권한이 없습니다.");
  }
};

// 한국 시간 계산 함수
const getCurrentKSTTime = () => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// 🏆 랭킹 리더보드 (leaderboard 컬렉션) 관련 유틸
// KST 기준 월요일 시작 주(週) 키 계산 — 클라이언트의 getWeekKey()와 반드시 동일한 로직이어야 함
const getWeekKey = (date) => {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(date.getTime() + kstOffset);
  const dayOfWeek = kst.getUTCDay(); // KST 기준 요일 (0=일 ~ 6=토)
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() + offsetToMonday);
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
};

// attendance 레코드 목록을 주(週)별 버킷에 누적 반영
const applyAttendanceEntriesToWeeks = (weeks, entries) => {
  entries.forEach((record) => {
    if (!record || typeof record === 'string' || !record.date) return;
    const d = new Date(record.date);
    if (isNaN(d.getTime())) return;

    const weekKey = getWeekKey(d);
    const bucket = weeks[weekKey] || { words: 0, time: 0, levelWords: {} };

    const isQuiz = String(record.type || '').includes('문제풀이');
    const score = Number(record.score || 0);
    const time = Number(record.studyTime || 1);

    bucket.time += time;
    if (isQuiz) {
      bucket.words += score;
      const levelKey = String(record.levelId || '').toLowerCase().replace(/-/g, '_');
      if (levelKey) bucket.levelWords[levelKey] = (bucket.levelWords[levelKey] || 0) + score;
    }
    weeks[weekKey] = bucket;
  });
  return weeks;
};

// 이번 주 + 지난주만 남기고 오래된 주는 정리 (문서 크기를 작게 유지)
const pruneOldWeeks = (weeks) => {
  const currentWeekKey = getWeekKey(new Date());
  const lastWeekKey = getWeekKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  Object.keys(weeks).forEach((k) => {
    if (k !== currentWeekKey && k !== lastWeekKey) delete weeks[k];
  });
  return weeks;
};

/**
 * 🗑️ 0-b. 관리자 학생 계정 완전 삭제 (Auth + Firestore)
 */
exports.adminDeleteStudent = onCall({
  region: "asia-northeast3",
}, async (request) => {
  assertIsAdmin(request);

  const { studentId } = request.data;

  if (!studentId) {
    throw new HttpsError("invalid-argument", "학생 ID가 없습니다.");
  }

  try {
    const user = await admin.auth().getUserByEmail(studentId);
    await admin.auth().deleteUser(user.uid);
  } catch (error) {
    // Auth 계정이 없는 경우 무시하고 Firestore만 삭제
    console.warn("[adminDeleteStudent] Auth 삭제 건너뜀:", error.message);
  }

  await deleteStudentData(studentId);

  return { success: true };
});

// 학생 데이터 전부 삭제: users 문서 + 랭킹(leaderboard) + 본인 문의. 관리자 삭제와 본인 탈퇴가 같이 쓴다.
// (예전에는 users 문서만 지워서 삭제된 학생 이름이 랭킹에 계속 남았다)
async function deleteStudentData(email) {
  const db = admin.firestore();
  const batch = db.batch();
  const inquiries = await db.collection("inquiries").where("studentAuthEmail", "==", email).get();
  inquiries.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection("users").doc(email));
  batch.delete(db.collection("leaderboard").doc(email));
  await batch.commit();
}

/**
 * 🗑️ 0-b2. 본인 회원 탈퇴
 * firestore.rules상 users 문서 삭제는 관리자만 가능해서 클라이언트의 deleteDoc이 항상 거부됐다.
 * 문서를 먼저 지우고 계정을 지운다 — 계정 삭제가 실패해도 다시 시도하면 이어서 처리된다.
 */
exports.deleteMyAccount = onCall({
  region: "asia-northeast3",
}, async (request) => {
  const email = request.auth?.token?.email;
  if (!email) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  await deleteStudentData(email);
  await admin.auth().deleteUser(request.auth.uid);
  return { success: true };
});

/**
 * 💬 0-a. 관리자 문의 답변 전송 (Firestore 보안 규칙 우회용 Admin SDK)
 */
exports.adminSendReply = onCall({
  region: "asia-northeast3",
}, async (request) => {
  assertIsAdmin(request);

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

/**
 * 🔊 0. ElevenLabs TTS 프록시 (API 키를 서버에서만 사용)
 * 클라이언트는 이 함수를 호출하며, 실제 ElevenLabs 키는 절대 노출되지 않음
 * 같은 문장은 ElevenLabs로 한 번만 만들고 Firestore ttsCache에 저장해 모든 학생이 같이 쓴다 (학생 수만큼 과금되지 않게).
 * ttsCache는 보안 규칙에 없어서 클라이언트는 못 읽고 Admin SDK(이 함수)만 쓴다. 문서 1MB 한도 < 300자 음성(base64 약 0.4MB).
 */
const crypto = require("crypto");
const TTS_MODEL = "eleven_multilingual_v2";

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

  // 목소리·모델이 바뀌면 키가 달라져 새로 만든다. 캐시 읽기/쓰기가 실패해도 음성은 그대로 돌려준다.
  const clean = text.trim();
  const cacheRef = admin.firestore().collection("ttsCache")
    .doc(crypto.createHash("sha256").update(`${voiceId}|${TTS_MODEL}|${clean}`).digest("hex"));
  const cached = await cacheRef.get().catch((e) => { console.error("ttsCache read failed:", e.message); return null; });
  if (cached?.exists) return { audio: cached.get("audio") };

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: clean,
      model_id: TTS_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.5 },
    }),
  });

  if (!response.ok) {
    console.error(`ElevenLabs API error: ${response.status}`);
    throw new HttpsError("internal", "TTS 요청에 실패했습니다.");
  }

  const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
  await cacheRef.set({ text: clean, audio, createdAt: admin.firestore.FieldValue.serverTimestamp() })
    .catch((e) => console.error("ttsCache write failed:", e.message));
  return { audio };
});

/**
 * 👪 0-e. 학부모 전화번호 로그인
 * 학부모는 Firebase Auth 계정이 없으므로, 전화번호로 학생을 찾아 그 학생 전용
 * Custom Token을 발급합니다. 클라이언트는 이 토큰으로 signInWithCustomToken 하여
 * 이후 users/inquiries 컬렉션을 "로그인한 사용자"로서 정상적으로 읽습니다.
 * (전화번호 조회 자체는 Admin SDK로 서버에서만 수행 — users 컬렉션을 공개 read로 열어둘 필요가 없어집니다)
 */
exports.parentLogin = onCall({
  region: "asia-northeast3",
}, async (request) => {
  // 전화번호만으로는 번호를 아는 누구나 학생 기록을 열람할 수 있어서 학생 이름도 함께 확인한다.
  // (형제가 같은 번호로 가입한 경우도 이름으로 구분된다)
  // ponytail: 이름+번호를 아는 사람은 여전히 열람 가능. 막으려면 문자 인증 또는 시도 횟수 제한 필요.
  const rawPhone = String(request.data?.phone || "").trim();
  const name = String(request.data?.name || "").trim();
  if (!rawPhone || !name) {
    throw new HttpsError("invalid-argument", "학생 이름과 전화번호를 입력해주세요.");
  }

  const digitsOnly = rawPhone.replace(/\D/g, "");
  const formatted = digitsOnly.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
  const candidates = Array.from(new Set([digitsOnly, formatted, rawPhone].filter(Boolean)));

  const db = admin.firestore();
  let studentDoc = null;
  for (const candidate of candidates) {
    const snap = await db.collection("users").where("phone", "==", candidate).get();
    studentDoc = snap.docs.find((d) => String(d.data().name || "").trim() === name) || null;
    if (studentDoc) break;
  }

  if (!studentDoc) {
    throw new HttpsError("not-found", "등록된 학생을 찾을 수 없습니다.");
  }

  const studentEmail = studentDoc.id;
  const studentData = studentDoc.data();

  const customToken = await admin.auth().createCustomToken(`parent-${studentEmail}`, {
    role: "parent",
    studentEmail,
  });

  return { customToken, studentEmail, studentPhone: studentData.phone || null };
});

/**
 * 🔎 0-f. 이름+전화번호로 이메일 찾기 (로그인 화면의 "이메일 찾기")
 * users 컬렉션을 클라이언트가 직접 쿼리하지 않고, 마스킹된 이메일만 반환합니다.
 */
exports.findEmailByNameAndPhone = onCall({
  region: "asia-northeast3",
}, async (request) => {
  const name = String(request.data?.name || "").trim();
  const phone = String(request.data?.phone || "").trim();
  if (!name || !phone) {
    throw new HttpsError("invalid-argument", "이름과 전화번호를 입력해주세요.");
  }

  const db = admin.firestore();
  const snap = await db.collection("users")
    .where("name", "==", name)
    .where("phone", "==", phone)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new HttpsError("not-found", "일치하는 계정을 찾을 수 없습니다.");
  }

  const email = snap.docs[0].data().email || snap.docs[0].id;
  const [local, domain] = String(email).split("@");
  const maskedEmail = (!domain)
    ? email
    : (local.length <= 3
      ? `${local[0]}***@${domain}`
      : `${local.slice(0, 2)}${"*".repeat(local.length - 3)}${local.slice(-1)}@${domain}`);

  return { maskedEmail };
});

/**
 * 🏆 0-c. 랭킹 리더보드 동기화 (users 문서가 바뀔 때마다 leaderboard/{email}를 최신화)
 * 클라이언트가 랭킹 계산을 위해 users 컬렉션 전체(무거운 attendance 배열 포함)를
 * 내려받지 않고, 이 가벼운 leaderboard 컬렉션만 읽도록 하기 위한 백엔드 집계입니다.
 */
exports.syncLeaderboardOnUserUpdate = onDocumentUpdated("users/{userEmail}", async (event) => {
  const beforeData = event.data.before.data() || {};
  const afterData = event.data.after.data() || {};
  const email = event.params.userEmail;

  const beforeAttendance = Array.isArray(beforeData.attendance) ? beforeData.attendance : [];
  const afterAttendance = Array.isArray(afterData.attendance) ? afterData.attendance : [];
  // attendance는 항상 arrayUnion으로 끝에 추가되므로, 길이 차이만큼이 새로 추가된 항목입니다.
  const newEntries = afterAttendance.length > beforeAttendance.length
    ? afterAttendance.slice(beforeAttendance.length)
    : [];

  const profileChanged = beforeData.name !== afterData.name || beforeData.currentLevel !== afterData.currentLevel;
  if (newEntries.length === 0 && !profileChanged) return; // 랭킹과 무관한 변경이면 스킵

  const db = admin.firestore();
  const leaderboardRef = db.collection("leaderboard").doc(email);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(leaderboardRef);
      const weeks = (snap.exists && snap.data().weeks) ? snap.data().weeks : {};

      applyAttendanceEntriesToWeeks(weeks, newEntries);
      pruneOldWeeks(weeks);

      tx.set(leaderboardRef, {
        name: afterData.name || null,
        currentLevel: afterData.currentLevel || null,
        weeks,
      });
    });
  } catch (error) {
    console.error("[syncLeaderboardOnUserUpdate] 리더보드 동기화 에러:", error);
  }
});

/**
 * 🔔 0-c2. 같은 기기(FCM 토큰)는 마지막으로 등록한 계정 하나에만 남긴다.
 * 공용 기기에서 계정을 바꾸면 이전 계정 문서에도 같은 토큰이 남아, 이전 학생 알림이 다음 학생 기기로 갔다.
 */
exports.dedupeFcmToken = onDocumentUpdated("users/{userEmail}", async (event) => {
  const token = event.data.after.data()?.fcmToken;
  if (!token || token === event.data.before.data()?.fcmToken) return;

  const snap = await admin.firestore().collection("users").where("fcmToken", "==", token).get();
  await Promise.all(snap.docs
    .filter((d) => d.id !== event.params.userEmail)
    .map((d) => d.ref.update({ fcmToken: admin.firestore.FieldValue.delete() })));
});

/**
 * 🧹 0-c3. 이름에 점(.)이 든 최상위 필드 정리 (관리자 전용, 1회성)
 * LevelTemplate가 setDoc(merge)에 "levelProgress.키.Day", "stats.weeklyWords" 같은 점 표기 키를 넘겨서
 * 중첩 필드 대신 이름에 점이 든 최상위 필드가 쌓였다(2026-06 ~ 2026-09).
 * levelProgress Day 기록은 중첩 levelProgress에 그 Day가 없을 때만 옮기고, 나머지는 지운다.
 * 중첩 lastUpdated는 건드리지 않는다 — 기기의 로컬 기록이 더 최신이면 그대로 이기고, 옮긴 Day는 합쳐진다.
 */
exports.migrateDottedFields = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 300,
}, async (request) => {
  assertIsAdmin(request);

  const { FieldPath, FieldValue } = admin.firestore;
  const usersSnap = await admin.firestore().collection("users").get();
  let updated = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const dotted = Object.keys(data).filter((k) => k.includes("."));
    if (dotted.length === 0) continue;

    // update(FieldPath, 값, ...) 형태: 문자열 키를 쓰면 점이 다시 경로로 해석되므로 FieldPath로 한 칸짜리 이름을 지정한다
    const args = [];
    dotted.forEach((k) => {
      const [root, levelKey, day, ...rest] = k.split(".");
      if (root === "levelProgress" && levelKey && day && day !== "lastUpdated" && rest.length === 0
        && !data.levelProgress?.[levelKey]?.[day]) {
        args.push(new FieldPath("levelProgress", levelKey, day), data[k]);
      }
      args.push(new FieldPath(k), FieldValue.delete());
    });
    await userDoc.ref.update(...args);
    updated++;
  }

  return { success: true, updated };
});

/**
 * 🛠️ 0-d. 리더보드 최초 백필 (관리자 전용, 1회성)
 * leaderboard 컬렉션 도입 이전부터 있던 기존 유저들의 attendance 전체 이력을 훑어
 * 이번 주/지난주 집계를 최초 생성합니다. 이후로는 위 트리거가 실시간으로 유지합니다.
 */
exports.backfillLeaderboard = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 300,
}, async (request) => {
  assertIsAdmin(request);

  const db = admin.firestore();
  const usersSnap = await db.collection("users").get();

  let batch = db.batch();
  let opCount = 0;
  let processed = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const attendance = Array.isArray(userData.attendance) ? userData.attendance : [];

    const weeks = applyAttendanceEntriesToWeeks({}, attendance);
    pruneOldWeeks(weeks);

    const leaderboardRef = db.collection("leaderboard").doc(userDoc.id);
    batch.set(leaderboardRef, {
      name: userData.name || null,
      currentLevel: userData.currentLevel || null,
      weeks,
    });
    opCount++;
    processed++;

    if (opCount >= 400) { // Firestore batch 최대 500건 한도 내 여유
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();

  return { success: true, processed };
});

/**
 * 🛠️ 0-g. 기존 문의(inquiries) 문서에 studentAuthEmail 백필 (관리자 전용, 1회성)
 * studentAuthEmail(작성자의 users 문서 ID)이 없으면 firestore.rules가 본인 열람을 허용하지 않으므로,
 * 필드 도입 이전에 저장된 문의들을 studentPhone 기준으로 users 컬렉션과 매칭해 채워 넣습니다.
 * (전화번호가 유일하지 않을 수 있어, 일치하는 첫 사용자를 사용합니다 — parentLogin과 동일한 방식)
 */
exports.backfillInquiryOwners = onCall({
  region: "asia-northeast3",
  timeoutSeconds: 300,
}, async (request) => {
  assertIsAdmin(request);

  const db = admin.firestore();
  const inquiriesSnap = await db.collection("inquiries").get();

  let batch = db.batch();
  let opCount = 0;
  let updated = 0;
  let skipped = 0;
  const phoneToEmail = new Map();

  for (const inquiryDoc of inquiriesSnap.docs) {
    const data = inquiryDoc.data();
    if (data.studentAuthEmail) { skipped++; continue; }

    const phone = String(data.studentPhone || "").trim();
    if (!phone) { skipped++; continue; }

    let email = phoneToEmail.get(phone);
    if (email === undefined) {
      const userSnap = await db.collection("users").where("phone", "==", phone).limit(1).get();
      email = userSnap.empty ? null : userSnap.docs[0].id;
      phoneToEmail.set(phone, email);
    }

    if (!email) { skipped++; continue; }

    batch.update(inquiryDoc.ref, { studentAuthEmail: email });
    opCount++;
    updated++;

    if (opCount >= 400) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();

  return { success: true, updated, skipped };
});

/**
 * 🏆 1. 랭킹 추월 알림 (v2 실시간 트리거)
 */
exports.checkRankingOvertake = onDocumentUpdated("users/{userEmail}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  const oldScore = beforeData.stats?.weeklyWords || 0;
  const newScore = afterData.stats?.weeklyWords || 0;

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
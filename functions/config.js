/** 모든 함수가 공유하는 리전과 Firebase Admin 초기화. */
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");

const REGION = "asia-northeast3";

admin.initializeApp();
setGlobalOptions({ region: REGION });

module.exports = { admin, REGION };

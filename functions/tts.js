/**
 * ElevenLabs TTS 프록시.
 * API 키가 클라이언트로 나가지 않도록 반드시 서버를 거치게 합니다.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { REGION } = require("./config");

const ELEVEN_LABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.5 };
/** 단어 발음용이므로 긴 문장은 받지 않습니다(비용/남용 방지). */
const MAX_TEXT_LENGTH = 300;

const tts = onCall({
  region: REGION,
  memory: "256MiB",
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const text = request.data?.text;
  if (typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
    throw new HttpsError("invalid-argument", "올바르지 않은 텍스트입니다.");
  }

  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    throw new HttpsError("unavailable", "TTS 서비스가 설정되지 않았습니다.");
  }

  const response = await fetch(`${ELEVEN_LABS_ENDPOINT}/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim(), model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
  });

  if (!response.ok) {
    console.error(`ElevenLabs API error: ${response.status}`);
    throw new HttpsError("internal", "TTS 요청에 실패했습니다.");
  }

  const audioBuffer = await response.arrayBuffer();
  return { audio: Buffer.from(audioBuffer).toString("base64") };
});

module.exports = { tts };

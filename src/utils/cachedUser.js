/**
 * `araon_cached_user`(STORAGE_KEYS.cachedUser)에 쓰기 전에 항상 거쳐야 하는 필터.
 *
 * 이 키는 Home / StudentDashboard / LevelHome 여러 화면이 같이 쓰는데,
 * 개인정보(이름/전화번호/FCM 토큰)는 localStorage에 남기지 않기로 되어 있습니다.
 * 화면마다 각자 걸러내면 한 곳이라도 빠뜨리는 순간 개인정보가 새어나가므로
 * 사용자 문서를 이 캐시에 쓰는 모든 곳은 반드시 이 함수를 거쳐야 합니다.
 */
export const sanitizeUserForCache = ({ name, phone, fcmToken, lastTokenUpdate, ...safe }) => safe;

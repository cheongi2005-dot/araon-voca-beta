/**
 * localStorage / sessionStorage 키 모음.
 *
 * 키 문자열이 여러 파일에 흩어져 있으면 오타 하나로 조용히 캐시가 갈라지므로
 * 모든 키는 여기를 통해서만 참조합니다.
 * 레벨별 학습 기록 키(`araon_voca_*`)는 LEVEL_CONFIG[levelId].key에 있습니다.
 */
export const STORAGE_KEYS = {
  /** 홈/대시보드용 사용자 문서 캐시 (개인정보 제외) */
  cachedUser: 'araon_cached_user',
  /** 홈 화면에 표시할 내 랭킹 요약 + 저장 시각 */
  cachedRank: 'araon_cached_rank',
  cachedRankAt: 'araon_cached_rank_at',
  /** 랭킹 페이지가 받아둔 전체 유저 목록 + 저장 시각 (홈에서 재사용) */
  rankingUsers: 'araon_ranking_users',
  rankingUsersAt: 'araon_ranking_users_at',
  /** 가입 도중 이탈 대비 임시 입력값 */
  tempSignup: 'araon_temp_signup',
  /** 클라우드와 동기화되는 알림/퀴즈 설정 */
  settings: 'araon_voca_settings',
  /** AI(ElevenLabs) 음성 사용 여부 */
  useAiVoice: 'araon_voca_use_ai',
  /** 브라우저 TTS 목소리 이름 / 속도·볼륨 설정 */
  voiceName: 'araon_voca_voice_name',
  voiceConfig: 'araon_voca_voice_config',
  /** 전체 오답 단어 수 캐시 (홈 배지용, O(1) 읽기) */
  totalMistakes: 'APP_totalMistakes',
  /** 라이트/다크 모드 */
  theme: 'theme',
};

/** sessionStorage 키 (탭을 닫으면 사라져야 하는 값) */
export const SESSION_KEYS = {
  isAdmin: 'isAdmin',
  parentViewPhone: 'parentViewPhone',
};

/** 로그아웃 시 비워야 하는 사용자 종속 캐시 */
export const USER_SCOPED_KEYS = [
  STORAGE_KEYS.cachedUser,
  STORAGE_KEYS.cachedRank,
  STORAGE_KEYS.cachedRankAt,
  STORAGE_KEYS.totalMistakes,
];

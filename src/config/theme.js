/**
 * 앱 전역에서 쓰이는 색상 및 표시 상수.
 *
 * 인라인 style이나 JS 로직에서 참조하는 값만 여기에 둡니다.
 * Tailwind 클래스로 표현되는 색은 tailwind.config.js의 semantic 컬러를 사용하세요.
 */

/** 오답노트 / 나의 단어장 브랜드 컬러 (와인) */
export const BRAND_COLOR = '#70011D';
/** 다크 모드에서 쓰는 브랜드 컬러 대체값 */
export const BRAND_COLOR_DARK = '#FF4D4D';

/** 레벨을 특정할 수 없을 때 쓰는 기본 강조색 */
export const DEFAULT_ACCENT_COLOR = '#4F46E5';
/** 주간 그래프의 '학습 시간' 막대 색 */
export const STUDY_TIME_COLOR = '#34D399';
/** 활동 레벨을 알 수 없을 때 쓰는 중립 점 색 */
export const NEUTRAL_DOT_COLOR = '#cbd5e1';

/** useTheme이 html/body/theme-color meta에 직접 적용하는 배경색 */
export const SURFACE = {
  lightRoot: '#ffffff',
  darkRoot: '#1E1E1E',
  lightPage: '#F8F9FA',
  darkPage: '#0A0A0B',
};

/** 오답노트 활동을 그래프에서 구분하기 위한 가상 레벨 ID */
export const MISTAKE_LEVEL_ID = 'mistake';

/** 퀴즈 풀이 방식. id는 Firestore의 `method` 필드에 그대로 저장됩니다. */
export const QUIZ_MODES = [
  { id: 'choice', title: '4지선다형', label: '4지선다', icon: 'ph-list-numbers', color: 'bg-amber-100 text-amber-600' },
  { id: 'letter', title: '철자 채우기', label: '철자 채우기', icon: 'ph-textbox', color: 'bg-blue-100 text-blue-600' },
  { id: 'full', title: '전체 받아쓰기', label: '전체 받아쓰기', icon: 'ph-keyboard', color: 'bg-purple-100 text-purple-600' },
];

/** Firestore attendance 레코드의 `type` 값. 부분 문자열 매칭에 쓰이므로 값이 곧 계약입니다. */
export const ACTIVITY_TYPE = {
  study: '단어학습',
  quiz: '문제풀이',
  /** 오답노트 문제풀이 — `quiz`를 부분 문자열로 포함한다는 점에 주의 */
  mistakeQuiz: '오답노트',
};

/** 주간 그래프의 요일 라벨 (일요일 시작) */
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
/** 홈 화면 주간 그래프의 요일 라벨 (월요일 시작) */
export const WEEKDAY_LABELS_MON = ['월', '화', '수', '목', '금', '토', '일'];

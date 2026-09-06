/**
 * 학습 레벨 단일 소스.
 *
 * 이전에는 LevelHome.js가 별도의 LEVEL_MAP을 들고 있어 레벨 정의가 두 벌이었고
 * Level 5의 색이 두 곳에서 서로 달랐습니다. 이제 아래 표가 유일한 정의입니다.
 *
 * - key   : 학습 기록을 저장하는 localStorage 키이자 Firestore levelProgress의 필드명
 * - path  : 라우터 경로
 * - days  : 진도율 계산에 쓰는 전체 Day(파닉스는 Stage) 수
 * - title : Firestore `currentLevel`에 저장되는 영문 레벨명
 */
export const LEVEL_CONFIG = {
  'phonics': {
    id: '00',
    title: 'Phonics',
    subTitle: '파닉스 (소리의 규칙)',
    shortTitle: '파닉스',
    color: '#4F46E5',
    key: 'araon_voca_phonics',
    path: '/phonics',
    days: 1,
    unit: 'Stage',
  },
  'elementary-100': {
    id: '01',
    title: 'Foundation',
    subTitle: '초등 기초 100일 완성',
    shortTitle: '초등 기초 100',
    color: '#FFD000',
    key: 'araon_voca_elementary_100',
    path: '/elementary-100',
    days: 100,
    unit: 'Day',
    loadData: () => import('../data/Elementary100')
  },
  'level-1': {
    id: '02',
    title: 'Essential',
    subTitle: 'Level 1 (초등 필수)',
    shortTitle: '초등 필수',
    color: '#E29526',
    key: 'araon_voca_level_1',
    path: '/level-1',
    days: 30,
    unit: 'Day',
    loadData: () => import('../data/Level1')
  },
  'level-2': {
    id: '03',
    title: 'Intermediate',
    subTitle: 'Level 2 (중등 기초)',
    shortTitle: '중등 기초',
    color: '#9CAF88',
    key: 'araon_voca_level_2',
    path: '/level-2',
    days: 30,
    unit: 'Day',
    loadData: () => import('../data/Level2')
  },
  'level-3': {
    id: '04',
    title: 'Advanced',
    subTitle: 'Level 3 (중등 심화)',
    shortTitle: '중등 심화',
    color: '#006039',
    key: 'araon_voca_level_3',
    path: '/level-3',
    days: 30,
    unit: 'Day',
    loadData: () => import('../data/Level3')
  },
  'level-4': {
    id: '05',
    title: 'Expert',
    subTitle: 'Level 4 (고등 기초)',
    shortTitle: '고등 기초',
    color: '#151E3D',
    key: 'araon_voca_level_4',
    path: '/level-4',
    days: 25,
    unit: 'Day',
    loadData: () => import('../data/Level4')
  },
  'level-5': {
    id: '06',
    title: 'Academic',
    subTitle: 'Level 5 (고등 심화)',
    shortTitle: '고등 심화',
    color: '#000080',
    key: 'araon_voca_level_5',
    path: '/level-5',
    days: 30,
    unit: 'Day',
    loadData: () => import('../data/Level5')
  }
};

/** 정의된 순서대로의 [levelId, config] 쌍 */
export const LEVEL_ENTRIES = Object.entries(LEVEL_CONFIG);
/** 정의된 순서대로의 config 목록 */
export const LEVELS = Object.values(LEVEL_CONFIG);
/** 모든 레벨의 localStorage 키 */
export const LEVEL_STORAGE_KEYS = LEVELS.map(config => config.key);

/** 첫 번째 레벨(파닉스)이 아닌, 레벨을 특정 못했을 때의 기본 코스 */
export const DEFAULT_LEVEL_ID = 'elementary-100';

/**
 * levelId를 Firestore stats 필드용 키로 변환합니다. (`level-1` -> `level_1`)
 * Firestore 필드명에는 하이픈보다 언더스코어가 관례적으로 쓰입니다.
 */
export const toDbLevelKey = (levelId) => String(levelId || '').replace(/-/g, '_');

/** `level_1` / `araon_voca_level_1` 같은 값을 levelId(`level-1`)로 되돌립니다. */
export const toLevelId = (value) =>
  String(value || '').replace(/^araon_voca_/, '').replace(/_/g, '-').toLowerCase();

/**
 * 어떤 형태의 식별자든 레벨 config를 찾습니다.
 * levelId(`level-1`), DB 키(`level_1`), 스토리지 키(`araon_voca_level_1`),
 * 영문 title(`Essential`), 한글 subTitle 모두 받습니다.
 */
export const findLevel = (value) => {
  if (!value) return null;
  const raw = String(value);
  const normalized = toLevelId(raw);
  return (
    LEVEL_CONFIG[normalized] ||
    LEVELS.find(level =>
      level.title === raw ||
      level.subTitle === raw ||
      level.key === raw ||
      level.id === raw
    ) ||
    null
  );
};

/** 활동 기록의 levelId를 사람이 읽는 한글 이름으로. 못 찾으면 원래 값을 그대로 돌려줍니다. */
export const getLevelDisplayName = (value) => {
  if (!value || String(value).toLowerCase() === 'all') return '전체 레벨';
  return findLevel(value)?.shortTitle || String(value);
};

/** Firestore `currentLevel`(영문 title)을 한글 코스명으로. */
export const getCurrentLevelDisplay = (levelName) => {
  if (!levelName || levelName === 'Level 미정') return 'Level 미정';
  return findLevel(levelName)?.subTitle || String(levelName);
};

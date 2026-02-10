// 각 레벨의 데이터 파일 임포트 (경로를 ../pages/에서 ../data/로 수정)
import * as ElementaryData from '../data/Elementary100';
import * as Level1Data from '../data/Level1';
import * as Level2Data from '../data/Level2';
import * as Level3Data from '../data/Level3';
import * as Level4Data from '../data/Level4';
import * as Level5Data from '../data/Level5';

/**
 * 앱 전체 레벨 설정 구성
 * App.js의 라우트 매개변수(levelId)와 일치하도록 키를 설정했습니다.
 */
export const LEVEL_CONFIG = {
  'elementary-100': {
    id: '01',
    title: 'Foundation',
    subTitle: '초등 기초 100일 완성',
    color: '#FFD000', // Home.js의 메뉴 컬러와 일치
    key: 'araon_voca_elementary_100', // localStorage 키
    data: ElementaryData.DATA_BY_DAY,
    titles: ElementaryData.DAY_TITLES
  },
  'level-1': {
    id: '02',
    title: 'Essential',
    subTitle: 'Level 1 (초등 필수)',
    color: '#E29526',
    key: 'araon_voca_level_1',
    data: Level1Data.DATA_BY_DAY,
    titles: Level1Data.DAY_TITLES
  },
  'level-2': {
    id: '03',
    title: 'Intermediate',
    subTitle: 'Level 2 (중등 기초)',
    color: '#9CAF88',
    key: 'araon_voca_level_2',
    data: Level2Data.DATA_BY_DAY,
    titles: Level2Data.DAY_TITLES
  },
  'level-3': {
    id: '04',
    title: 'Advanced',
    subTitle: 'Level 3 (중등 심화)',
    color: '#006039',
    key: 'araon_voca_level_3',
    data: Level3Data.DATA_BY_DAY,
    titles: Level3Data.DAY_TITLES
  },
  'level-4': {
    id: '05',
    title: 'Expert',
    subTitle: 'Level 4 (고등 기초)',
    color: '#151E3D',
    key: 'araon_voca_level_4',
    data: Level4Data.DATA_BY_DAY,
    titles: Level4Data.DAY_TITLES
  },
  'level-5': {
    id: '06',
    title: 'Academic',
    subTitle: 'Level 5 (고등 심화)',
    color: '#000080',
    key: 'araon_voca_level_5',
    data: Level5Data.DATA_BY_DAY,
    titles: Level5Data.DAY_TITLES
  }
};
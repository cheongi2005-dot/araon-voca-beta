export const LEVEL_CONFIG = {
  'phonics': {
    id: '00',
    title: 'Phonics',
    subTitle: '파닉스 (소리의 규칙)',
    color: '#4F46E5',
    key: 'araon_voca_phonics',
    path: '/phonics'
  },
  'elementary-100': {
    id: '01',
    title: 'Foundation',
    subTitle: '초등 기초 100일 완성',
    color: '#FFD000',
    key: 'araon_voca_elementary_100',
    loadData: () => import('../data/Elementary100')
  },
  'level-1': {
    id: '02',
    title: 'Essential',
    subTitle: 'Level 1 (초등 필수)',
    color: '#E29526',
    key: 'araon_voca_level_1',
    loadData: () => import('../data/Level1')
  },
  'level-2': {
    id: '03',
    title: 'Intermediate',
    subTitle: 'Level 2 (중등 기초)',
    color: '#9CAF88',
    key: 'araon_voca_level_2',
    loadData: () => import('../data/Level2')
  },
  'level-3': {
    id: '04',
    title: 'Advanced',
    subTitle: 'Level 3 (중등 심화)',
    color: '#006039',
    key: 'araon_voca_level_3',
    loadData: () => import('../data/Level3')
  },
  'level-4': {
    id: '05',
    title: 'Expert',
    subTitle: 'Level 4 (고등 기초)',
    color: '#151E3D',
    key: 'araon_voca_level_4',
    loadData: () => import('../data/Level4')
  },
  'level-5': {
    id: '06',
    title: 'Academic',
    subTitle: 'Level 5 (고등 심화)',
    color: '#000080',
    key: 'araon_voca_level_5',
    loadData: () => import('../data/Level5')
  }
};
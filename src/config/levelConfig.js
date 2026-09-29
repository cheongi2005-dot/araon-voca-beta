// id·key·title·subTitle은 저장된 진도/학생 문서(currentLevel)와 연결돼 있어 바꾸면 안 됨. 화면의 레벨 번호는 level을 쓴다(id 아님).
export const LEVEL_CONFIG = {
  'phonics': {
    id: '00',
    title: 'Phonics',
    icon: 'help',
    iconTone: 'navy',
    subTitle: '파닉스 (소리의 규칙)',
    color: '#4F46E5',
    key: 'araon_voca_phonics',
    days: 1, // 전체 Day(파닉스는 Stage) 수
    path: '/phonics'
  },
  'elementary-100': {
    id: '01',
    title: 'Foundation',
    icon: 'book',
    iconTone: 'amber',
    subTitle: '초등 기초 100일 완성',
    color: '#FFD000',
    ink: '#3D3100', // 밝은 배경 위 글자색 (기본은 흰색)
    key: 'araon_voca_elementary_100',
    days: 100, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Elementary100')
  },
  'level-1': {
    level: 1, // 화면에 'Level 1'로 표시 (id와 다름)
    id: '02',
    title: 'Essential',
    icon: 'sprout',
    iconTone: 'green',
    subTitle: 'Level 1 (초등 필수)',
    color: '#E29526',
    key: 'araon_voca_level_1',
    days: 30, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Level1')
  },
  'level-2': {
    level: 2, // 화면에 'Level 2'로 표시 (id와 다름)
    id: '03',
    title: 'Intermediate',
    icon: 'compass',
    iconTone: 'green',
    subTitle: 'Level 2 (중등 기초)',
    color: '#9CAF88',
    ink: '#1F2A18',
    key: 'araon_voca_level_2',
    days: 30, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Level2')
  },
  'level-3': {
    level: 3, // 화면에 'Level 3'로 표시 (id와 다름)
    id: '04',
    title: 'Advanced',
    icon: 'mountain',
    iconTone: 'green',
    subTitle: 'Level 3 (중등 심화)',
    color: '#006039',
    key: 'araon_voca_level_3',
    days: 30, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Level3')
  },
  'level-4': {
    level: 4, // 화면에 'Level 4'로 표시 (id와 다름)
    id: '05',
    title: 'Expert',
    icon: 'rocket',
    iconTone: 'navy',
    subTitle: 'Level 4 (고등 기초)',
    color: '#151E3D',
    key: 'araon_voca_level_4',
    days: 25, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Level4')
  },
  'level-5': {
    level: 5, // 화면에 'Level 5'로 표시 (id와 다름)
    id: '06',
    title: 'Academic',
    icon: 'level',
    iconTone: 'navy',
    subTitle: 'Level 5 (고등 심화)',
    color: '#000080',
    key: 'araon_voca_level_5',
    days: 30, // 전체 Day(파닉스는 Stage) 수
    loadData: () => import('../data/Level5')
  }
};

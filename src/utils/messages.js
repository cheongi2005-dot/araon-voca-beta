/** 랭킹 순위에 따른 응원 문구. 홈과 랭킹 화면이 같은 문구를 써야 해서 한 곳에 둡니다. */
const DEFAULT_MESSAGE = '오늘의 도전이 내일의 순위를 바꿔요! 🌱';

const MESSAGES_BY_RANK = [
  [1, '넘볼 수 없는 1위! 압도적이에요! 👑'],
  [2, '정상까지 단 한 걸음! 당신은 할 수 있어요! 🥈'],
  [3, '시상대에 올랐습니다! 훌륭해요! 🎖️'],
  [10, '명예의 전당 TOP10! 이 기세 계속 가요! 🔥'],
  [30, '한 계단씩 오르는 중! 멈추지 마요! 🚀'],
];

/**
 * @param {number|null} rank            내 순위
 * @param {number}      maxRankedTier   이 순위까지만 특별 문구를 보여줍니다.
 *                                      홈은 TOP10까지, 랭킹 화면은 TOP30까지 씁니다.
 */
export const getCheeringMessage = (rank, maxRankedTier = 30) => {
  if (!rank) return DEFAULT_MESSAGE;
  const matched = MESSAGES_BY_RANK.find(([tier]) => rank <= tier && tier <= maxRankedTier);
  return matched ? matched[1] : DEFAULT_MESSAGE;
};

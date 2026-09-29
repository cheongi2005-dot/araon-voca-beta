import React from 'react';
import SpeakerIcon from './SpeakerIcon';

const cap = (w) => w[0].toUpperCase() + w.slice(1);

// 예문의 ___ 자리에 들어갈 단어: 문장 맨 앞이면 대문자로 시작하고, 문장 중간이면 Level 1처럼 첫 글자만 대문자인 단어(Name)를 소문자로.
// 그래서 고유명사(Monday, Korea)는 예문 맨 앞에 둔다 (scripts/check-sentences.cjs가 확인).
const blankWord = (word, atStart) => (atStart ? cap(word) : /^[A-Z][a-z]+$/.test(word) ? word.toLowerCase() : word);

// 예문의 ___ 자리에 단어를 채운 문장 (읽어 주기용)
export const fillSentence = (sentence, word) =>
  sentence.replace(/___/g, (_, i) => blankWord(word, i === 0));

// 예문에서 단어 자리만 형광펜으로 강조
export const SentenceText = ({ sentence, word, color }) => {
  const parts = sentence.split('___');
  return parts.map((p, i) => (
    <React.Fragment key={i}>
      {i > 0 && <mark className="px-1 rounded font-bold text-inherit" style={{ backgroundColor: `${color}33` }}>{blankWord(word, i === 1 && !parts[0])}</mark>}
      {p}
    </React.Fragment>
  ));
};

// 즐겨찾기 별 (사전 카드 오른쪽 위, 초등 단어 목록 줄에서 같이 씀)
export const FavoriteButton = ({ on, onClick, className = '' }) => (
  <button type="button" onClick={onClick} aria-pressed={on} aria-label={on ? '즐겨찾기 해제' : '즐겨찾기에 저장'}
    className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-2xl active:scale-90 transition-transform ${on ? 'text-[#70011D] dark:text-[#FF6B81]' : 'text-zinc-500 dark:text-zinc-400'} ${className}`}>
    <i className={`${on ? 'ph-fill' : 'ph-bold'} ph-star`} aria-hidden="true" />
  </button>
);

// 긴 단어도 한 줄에 들어가게 글자 크기를 줄인다 (카드 폭 기준)
const wordSize = (word) => {
  const n = word.length; // 가장 긴 단어: Level 4 'have difficulty (in) ing' (24자)
  return n <= 8 ? 'text-5xl' : n <= 11 ? 'text-4xl' : n <= 14 ? 'text-3xl' : n <= 18 ? 'text-2xl' : n <= 22 ? 'text-xl' : 'text-lg';
};

// 단어 학습·내 단어장 카드: (이모지) → 큰 단어 → 발음 → 뜻 → (있으면) 예문. onToggleFavorite를 주면 오른쪽 위에 즐겨찾기 별.
// uniform = { emoji, sentence }: 넘겨보는 카드들의 높이를 맞출 때. 목록에 하나라도 있으면 그 자리를 모든 카드에 비워 두고,
// 뜻은 2줄·예문은 5줄·해석은 3줄로 자른다 (폭 375px에서 가장 긴 중고등 예문+해석이 248px에 들어감).
export default function WordCard({ item, color, speak, centered = false, favorite = false, onToggleFavorite, uniform }) {
  return (
    <article className={`relative p-6 ${onToggleFavorite ? 'pt-14' : ''} bg-white dark:bg-[#1E1E1E] border border-zinc-200 dark:border-zinc-800 rounded-lg ${centered ? 'text-center' : ''}`}>
      {onToggleFavorite && <FavoriteButton on={favorite} onClick={onToggleFavorite} className="absolute top-2 right-2" />}
      {(item.emoji || uniform?.emoji) && <div className="h-12 mb-3 text-5xl leading-none" aria-hidden="true">{item.emoji}</div>}
      <h2 className={`h-12 leading-[3rem] truncate ${wordSize(item.word)} font-semibold tracking-tight text-zinc-900 dark:text-white`} lang="en" title={item.word}>{item.word}</h2>
      <button type="button" onClick={() => speak(item.word)} className="mt-3 h-11 px-4 inline-flex items-center gap-2 rounded-full text-sm font-bold text-zinc-800 dark:text-zinc-100 active:opacity-70" style={{ backgroundColor: `${color}26` }}>
        <SpeakerIcon size={20} />발음 듣기
      </button>
      <p className={`mt-5 text-xl leading-7 font-bold text-zinc-800 dark:text-zinc-100 ${uniform ? 'h-14 line-clamp-2' : ''}`}>{item.meaning}</p>
      {item.sentence ? (
        <div className={`mt-6 py-4 pl-4 pr-3 border-l-4 bg-zinc-50 dark:bg-white/5 rounded-r-lg text-left flex items-start gap-3 ${uniform ? 'h-[248px]' : ''}`} style={{ borderColor: color }}>
          <div className="flex-1 min-w-0">
            <p className={`text-lg leading-relaxed text-zinc-800 dark:text-zinc-100 ${uniform ? 'line-clamp-5' : ''}`} lang="en">
              <SentenceText sentence={item.sentence} word={item.word} color={color} />
            </p>
            {item.sentenceKo && <p className={`mt-2 text-[15px] leading-snug text-zinc-500 dark:text-zinc-400 ${uniform ? 'line-clamp-3' : ''}`}>{item.sentenceKo}</p>}
          </div>
          <button type="button" onClick={() => speak(fillSentence(item.sentence, item.word))} aria-label="예문 듣기" className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-white dark:bg-[#1E1E1E] border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 active:opacity-70">
            <SpeakerIcon size={20} />
          </button>
        </div>
      ) : uniform?.sentence && <div className="mt-6 h-[248px]" aria-hidden="true" />}
    </article>
  );
}

import React, { useState, useMemo, useCallback } from 'react';

/** 문장 가운데에서도 대문자를 유지해야 하는 단어(요일·월) */
const KEEP_CAPITALIZED = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|January|February|March|April|May|June|July|August|September|October|November|December)$/;

const wordForSentence = (word, atStart) => {
  if (atStart) return word.charAt(0).toUpperCase() + word.slice(1);
  // 'TV'처럼 대문자가 두 글자 이상이면 약어로 보고 그대로 둡니다.
  if (KEEP_CAPITALIZED.test(word) || /[A-Z].*[A-Z]/.test(word)) return word;
  return word.toLowerCase();
};

/** 예문의 `___`를 단어로 채웁니다. 빈칸이 없으면 예문을 그대로 돌려줍니다. */
const splitSentence = (sentence, word) => {
  const blank = sentence.indexOf('___');
  if (blank === -1) return { before: sentence, filled: '', after: '' };
  return {
    before: sentence.slice(0, blank),
    filled: wordForSentence(word, sentence.slice(0, blank).trim() === ''),
    after: sentence.slice(blank + 3),
  };
};

/** 홈 화면 카드와 같은 박스 스타일 (각진 모서리) */
const CARD = 'bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 rounded-none shadow-sm';

/** 홈 화면 '주간 학습 리포트'의 작은 통계 타일과 같은 모양 */
const StatTile = ({ label, value, icon, iconClassName = '', iconStyle }) => (
  <div className={`${CARD} p-4 flex items-center gap-3`}>
    <div className={`w-9 h-9 rounded-none flex items-center justify-center flex-shrink-0 ${iconClassName}`} style={iconStyle}>
      <i className={`ph-fill ${icon} text-lg`}></i>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black dark:text-white tracking-tight tabular-nums">{value}</span>
        <span className="text-[11px] font-bold text-zinc-400">개</span>
      </div>
    </div>
  </div>
);

const faceStyle = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

/**
 * 한 화면에 한 단어씩 보여주는 뒤집기 카드 학습.
 *
 * 앞면은 단어, 탭하면 뒷면에 뜻과 예문이 나옵니다. 학생이 '외웠어요 / 다시 볼래요'로
 * 스스로 평가하고, 한 바퀴가 끝나면 '다시 볼래요' 단어만 한 번 더 돌 수 있습니다.
 */
const WordFlashcards = ({ words, themeColor, title, onSpeak, onComplete }) => {
  const allIndexes = useMemo(() => words.map((_, i) => i), [words]);
  const [queue, setQueue] = useState(allIndexes);
  const [pos, setPos] = useState(0);
  const [known, setKnown] = useState([]);
  const [again, setAgain] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [round, setRound] = useState(1);

  const isDone = pos >= queue.length;
  const item = isDone ? null : words[queue[pos]];

  const rate = useCallback((isKnown) => {
    const index = queue[pos];
    if (isKnown) setKnown(prev => [...prev, index]);
    else setAgain(prev => [...prev, index]);
    setFlipped(false);
    setPos(prev => prev + 1);
  }, [queue, pos]);

  const startRound = useCallback((indexes) => {
    setQueue(indexes);
    setPos(0);
    setKnown([]);
    setAgain([]);
    setFlipped(false);
    setRound(prev => prev + 1);
  }, []);

  const speakFrom = (text) => (e) => {
    e.stopPropagation();
    onSpeak(text);
  };

  if (words.length === 0) {
    return <div className="py-20 text-center text-zinc-400 font-bold">학습할 단어가 없어요.</div>;
  }

  const sentence = item?.sentence ? splitSentence(item.sentence, item.word) : null;
  const sentenceText = sentence ? `${sentence.before}${sentence.filled}${sentence.after}` : '';
  const wordSize = item && item.word.length > 10 ? 'text-3xl' : 'text-4xl';

  return (
    <div className="animate-rise-in flex flex-col gap-3">
      <div className="flex items-center justify-between px-2 mb-1">
        <h2 className="text-sm font-black text-zinc-800 dark:text-zinc-200 tracking-tight truncate">
          {round > 1 ? '다시 보기 · ' : ''}{title}
        </h2>
        <span className="text-xs font-black text-zinc-400 tabular-nums shrink-0 ml-3">
          {Math.min(pos + 1, queue.length)} / {queue.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="외웠어요"
          value={known.length}
          icon="ph-check-circle"
          iconClassName="bg-[#F2FAF7] dark:bg-[#1B2D26] text-[#34D399]"
        />
        <StatTile
          label="다시 볼래요"
          value={again.length}
          icon="ph-arrow-counter-clockwise"
          iconStyle={{ backgroundColor: `${themeColor}20`, color: themeColor }}
        />
      </div>

      {isDone ? (
        <div className="animate-rise-in flex flex-col gap-3">
          <div className={`${CARD} p-6 flex flex-col items-center text-center`}>
            <span className="text-6xl mt-4 mb-5">{again.length === 0 ? '🎉' : '💪'}</span>
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: themeColor }}>
              {again.length === 0 ? 'All Clear' : 'Almost There'}
            </h3>
            <p className="text-xl font-black tracking-tight dark:text-white mb-1">
              {again.length === 0 ? '모두 외웠어요!' : '거의 다 왔어요'}
            </p>
            <p className="text-xs font-bold text-zinc-400 mb-4">
              {again.length === 0 ? '이제 퀴즈로 확인해볼까요?' : `다시 볼 단어 ${again.length}개만 한 번 더 넘겨봐요.`}
            </p>
          </div>
          {again.length > 0 && (
            <button
              onClick={() => startRound(again)}
              className="press w-full h-14 rounded-none font-black text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              다시 볼 단어만 보기
            </button>
          )}
          <button
            onClick={onComplete}
            className={`press w-full h-14 font-black ${again.length > 0 ? `${CARD} text-zinc-700 dark:text-zinc-200` : 'rounded-none text-white shadow-sm'}`}
            style={again.length > 0 ? undefined : { backgroundColor: themeColor }}
          >
            퀴즈 도전
          </button>
        </div>
      ) : (
        <>
          {/* 등장 애니메이션은 바깥에 둡니다. 뒤집히는 요소에 opacity 애니메이션이 걸리면
              3D가 평면화되어 뒷면 대신 좌우 반전된 앞면이 보입니다. */}
          <div key={`${round}-${pos}`} className="animate-rise-in" style={{ perspective: '1200px' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label={flipped ? '앞면 보기' : '뜻 보기'}
              onClick={() => setFlipped(prev => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(prev => !prev); }
              }}
              className="relative w-full cursor-pointer transition-transform duration-500 motion-reduce:transition-none"
              style={{
                height: 'clamp(300px, calc(100dvh - 380px - env(safe-area-inset-top)), 460px)',
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'none',
              }}
            >
              {/* 앞면: 단어 */}
              <div className={`${CARD} absolute inset-0 flex flex-col items-center justify-center text-center px-6`} style={faceStyle}>
                {item.emoji && <span className="text-7xl mb-5 leading-none">{item.emoji}</span>}
                <p className={`${wordSize} font-black tracking-tight dark:text-white break-all`}>{item.word}</p>
                <button
                  onClick={speakFrom(item.word)}
                  className="press mt-6 h-11 pl-2 pr-4 rounded-none flex items-center gap-2 text-sm font-black"
                  style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                >
                  <span className="w-7 h-7 rounded-none bg-white/60 dark:bg-black/20 flex items-center justify-center">
                    <i className="ph-fill ph-speaker-high"></i>
                  </span>
                  발음 듣기
                </button>
                <span className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-400">
                  <i className="ph-bold ph-arrows-clockwise"></i>카드를 탭하면 뜻이 보여요
                </span>
              </div>

              {/* 뒷면: 뜻 + 예문 */}
              <div
                className={`${CARD} absolute inset-0 flex flex-col items-center justify-center text-center px-5 pt-6 pb-12 overflow-y-auto`}
                style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
              >
                <h3 className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: themeColor }}>{item.word}</h3>
                <p className="text-3xl font-black tracking-tight dark:text-white mb-6 break-keep">{item.meaning}</p>
                {sentence && (
                  <div className="w-full p-4 rounded-none border border-zinc-100 dark:border-zinc-800 bg-[#F8F9FA] dark:bg-[#0A0A0B] flex items-center gap-3 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Example</p>
                      <p className="text-base font-bold leading-snug dark:text-white">
                        {sentence.before}
                        {sentence.filled && <span className="font-black" style={{ color: themeColor }}>{sentence.filled}</span>}
                        {sentence.after}
                      </p>
                    </div>
                    <button
                      onClick={speakFrom(sentenceText)}
                      aria-label="예문 듣기"
                      className="press shrink-0 w-11 h-11 rounded-none flex items-center justify-center"
                      style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                    >
                      <i className="ph-fill ph-speaker-high text-lg"></i>
                    </button>
                  </div>
                )}
                <span className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 text-[11px] font-bold text-zinc-400">
                  <i className="ph-bold ph-arrows-clockwise"></i>다시 탭하면 앞면
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => rate(false)}
              className={`press ${CARD} h-14 font-black text-zinc-700 dark:text-zinc-200`}
            >
              다시 볼래요
            </button>
            <button
              onClick={() => rate(true)}
              className="press h-14 rounded-none font-black text-white bg-emerald-600 shadow-sm"
            >
              외웠어요
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WordFlashcards;

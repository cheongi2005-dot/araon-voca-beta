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
    <div className="animate__animated animate__fadeIn flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
          {round > 1 ? '다시 보기 · ' : ''}{title}
        </p>
        <span className="text-sm font-bold text-zinc-400 tabular-nums shrink-0 ml-3">
          {Math.min(pos + 1, queue.length)} / {queue.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 rounded-2xl flex items-center justify-between px-4 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <span className="flex items-center gap-1.5 text-sm font-bold"><i className="ph-bold ph-check"></i>외웠어요</span>
          <span className="text-lg font-black tabular-nums">{known.length}</span>
        </div>
        <div className="h-12 rounded-2xl flex items-center justify-between px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 text-sm font-bold"><i className="ph-bold ph-arrow-counter-clockwise"></i>다시 볼래요</span>
          <span className="text-lg font-black tabular-nums">{again.length}</span>
        </div>
      </div>

      {isDone ? (
        <div className="animate__animated animate__fadeIn flex flex-col items-center text-center pt-12 pb-6">
          <span className="text-7xl mb-6">{again.length === 0 ? '🎉' : '💪'}</span>
          <h2 className="text-2xl font-black dark:text-white mb-2">
            {again.length === 0 ? '모두 외웠어요!' : '거의 다 왔어요'}
          </h2>
          <p className="text-zinc-400 font-bold mb-10">
            {again.length === 0 ? '이제 퀴즈로 확인해볼까요?' : `다시 볼 단어 ${again.length}개만 한 번 더 넘겨봐요.`}
          </p>
          <div className="w-full space-y-3">
            {again.length > 0 && (
              <button
                onClick={() => startRound(again)}
                className="w-full h-14 rounded-2xl font-bold text-lg text-white active:scale-[0.98] transition-transform"
                style={{ backgroundColor: themeColor }}
              >
                다시 볼 단어만 보기
              </button>
            )}
            <button
              onClick={onComplete}
              className={`w-full h-14 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform ${again.length > 0 ? 'bg-zinc-100 dark:bg-zinc-800 dark:text-white' : 'text-white'}`}
              style={again.length > 0 ? undefined : { backgroundColor: themeColor }}
            >
              퀴즈 도전
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ perspective: '1200px' }}>
            <div
              key={`${round}-${pos}`}
              role="button"
              tabIndex={0}
              aria-label={flipped ? '앞면 보기' : '뜻 보기'}
              onClick={() => setFlipped(prev => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(prev => !prev); }
              }}
              className="relative w-full cursor-pointer transition-transform duration-500 motion-reduce:transition-none animate__animated animate__fadeIn"
              style={{
                height: 'clamp(300px, calc(100dvh - 360px - env(safe-area-inset-top)), 480px)',
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'none',
              }}
            >
              {/* 앞면: 단어 */}
              <div
                className="absolute inset-0 rounded-[1.8rem] bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center px-6"
                style={faceStyle}
              >
                {item.emoji && <span className="text-7xl mb-5 leading-none">{item.emoji}</span>}
                <p className={`${wordSize} font-black tracking-tight dark:text-white break-all`}>{item.word}</p>
                <button
                  onClick={speakFrom(item.word)}
                  className="mt-6 h-11 px-5 rounded-full flex items-center gap-1.5 font-bold active:scale-95 transition-transform"
                  style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}
                >
                  <i className="ph-bold ph-speaker-high text-lg"></i>발음 듣기
                </button>
                <span className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-400">
                  <i className="ph-bold ph-arrows-clockwise"></i>카드를 탭하면 뜻이 보여요
                </span>
              </div>

              {/* 뒷면: 뜻 + 예문 */}
              <div
                className="absolute inset-0 rounded-[1.8rem] bg-white dark:bg-[#1E1E1E] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center px-5 pt-6 pb-12 overflow-y-auto"
                style={{ ...faceStyle, transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm font-bold text-zinc-400 mb-1">{item.word}</p>
                <p className="text-3xl font-black tracking-tight dark:text-white mb-6 break-keep">{item.meaning}</p>
                {sentence && (
                  <div className="w-full flex items-center gap-3 pl-4 pr-2 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black tracking-widest text-zinc-400 mb-0.5">EXAMPLE</p>
                      <p className="text-base leading-snug dark:text-white">
                        {sentence.before}
                        {sentence.filled && <span className="font-bold" style={{ color: themeColor }}>{sentence.filled}</span>}
                        {sentence.after}
                      </p>
                    </div>
                    <button
                      onClick={speakFrom(sentenceText)}
                      aria-label="예문 듣기"
                      className="shrink-0 w-11 h-11 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center active:scale-95 transition-transform"
                      style={{ color: themeColor }}
                    >
                      <i className="ph-bold ph-speaker-high text-lg"></i>
                    </button>
                  </div>
                )}
                <span className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-400">
                  <i className="ph-bold ph-arrows-clockwise"></i>다시 탭하면 앞면
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => rate(false)}
              className="h-14 rounded-2xl font-bold text-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 active:scale-[0.97] transition-transform"
            >
              다시 볼래요
            </button>
            <button
              onClick={() => rate(true)}
              className="h-14 rounded-2xl font-bold text-lg text-white bg-emerald-600 active:scale-[0.97] transition-transform"
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

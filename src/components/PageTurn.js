import React, { useLayoutEffect, useRef, useState } from 'react';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 카드 더미 넘김.
//  - 'next': 지금 카드가 왼쪽으로 날아가고, 아래 깔려 있던 다음 카드가 떠오른다.
//  - 'prev': 앞 카드가 왼쪽에서 날아와 지금 카드를 덮고, 지금 카드는 아래로 가라앉는다.
// pageKey가 바뀔 때만 넘긴다. 앞뒤 카드의 높이가 같아야 자연스럽다(WordCard uniform).
// '동작 줄이기' 설정이면 애니메이션 없이 바로 바뀐다.
export default function PageTurn({ pageKey, dir, children }) {
  const [turning, setTurning] = useState(null); // { dir, page: 날아가는/날아오는 카드, under: 'prev'일 때 아래 깔린 카드 }
  const last = useRef({ key: pageKey, page: children });

  useLayoutEffect(() => {
    if (last.current.key !== pageKey && dir && !reduceMotion()) {
      setTurning(dir === 'next'
        ? { dir, page: last.current.page }
        : { dir, page: children, under: last.current.page });
    }
    last.current = { key: pageKey, page: children };
  }, [pageKey, dir, children]);

  return (
    <div className="relative">
      <div aria-hidden={turning?.dir === 'prev' || undefined}
        className={turning ? (turning.dir === 'next' ? 'animate-card-rise' : 'animate-card-sink') : undefined}>
        {turning?.dir === 'prev' ? turning.under : children}
      </div>
      {turning && (
        <div aria-hidden="true" onAnimationEnd={() => setTurning(null)}
          className={`absolute inset-0 pointer-events-none origin-bottom-left ${turning.dir === 'next' ? 'animate-card-fly-out' : 'animate-card-fly-in'}`}>
          {turning.page}
        </div>
      )}
    </div>
  );
}

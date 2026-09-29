import { useRef } from 'react';

// 스와이프(터치·마우스). 더 많이 움직인 축 하나만 본다.
// 핸들러를 단 요소가 스크롤되는 영역이면 스크롤과 겹치지 않게
//   위로(onUp)는 맨 아래까지 내려온 상태에서, 아래로(onDown)는 맨 위에서 시작했을 때만 인정한다.
//   (스크롤되지 않는 요소는 항상 맨 위이자 맨 아래라 그냥 동작)
// 터치는 touch 이벤트를 쓴다: 브라우저가 스크롤을 가져가도 touchend는 온다(pointer는 cancel됨).
// 대상 요소 touch-action: 좌우만 쓰거나 스크롤 영역이면 pan-y(touch-pan-y), 스크롤 없이 위아래도 쓰면 none(touch-none).
export const useSwipe = ({ onLeft, onRight, onUp, onDown }, threshold = 50) => {
  const start = useRef(null);

  const begin = (x, y, el) => {
    start.current = { x, y, atTop: el.scrollTop <= 0, atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 };
  };
  const end = (x, y) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = x - s.x;
    const dy = y - s.y;
    const handler = Math.abs(dx) >= Math.abs(dy)
      ? Math.abs(dx) >= threshold && (dx < 0 ? onLeft : onRight)
      : Math.abs(dy) >= threshold && (dy < 0 ? s.atBottom && onUp : s.atTop && onDown);
    if (handler) handler(); // 탭·짧은 움직임·스크롤 중간은 무시
  };

  return {
    onTouchStart: (e) => begin(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget),
    onTouchEnd: (e) => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    onPointerDown: (e) => { if (e.pointerType === 'mouse') begin(e.clientX, e.clientY, e.currentTarget); },
    onPointerUp: (e) => { if (e.pointerType === 'mouse') end(e.clientX, e.clientY); },
  };
};

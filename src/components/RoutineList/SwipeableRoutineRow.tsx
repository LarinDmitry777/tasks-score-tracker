import { useRef, useState } from 'react';
import s from './SwipeableRoutineRow.module.css';

interface Props {
  onCancel: () => void;
  children: React.ReactNode;
}

const THRESHOLD = 60;
const MAX_DRAG = 96;

export function SwipeableRoutineRow({ onCancel, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDxRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  // Whether we determined this is a horizontal swipe (and locked it in)
  const lockedRef = useRef<'horizontal' | 'vertical' | null>(null);

  const applyTransform = (dx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = `translateX(${dx}px)`;
  };

  const animateReturn = () => {
    const el = containerRef.current;
    if (!el) return;
    el.animate(
      [{ transform: el.style.transform }, { transform: 'translateX(0)' }],
      { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
    ).onfinish = () => {
      el.style.transform = '';
    };
  };

  const animateExit = () => {
    const el = containerRef.current;
    if (!el) return;
    el.animate(
      [{ transform: el.style.transform }, { transform: `translateX(-120%)` }],
      { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    ).onfinish = () => {
      onCancel();
    };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentDxRef.current = 0;
    lockedRef.current = null;
    setDragging(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    if (lockedRef.current === null) {
      // Determine direction after 10px of movement
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      lockedRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (lockedRef.current === 'vertical') return;

    // Only swipe left (negative dx)
    if (dx >= 0) return;

    e.preventDefault();
    const clamped = Math.max(dx, -MAX_DRAG);
    currentDxRef.current = clamped;
    setDragging(true);
    applyTransform(clamped);
  };

  const onTouchEnd = () => {
    if (lockedRef.current !== 'horizontal') return;
    setDragging(false);
    if (currentDxRef.current < -THRESHOLD) {
      animateExit();
    } else {
      animateReturn();
    }
    currentDxRef.current = 0;
  };

  return (
    <div className={s.wrapper}>
      <div className={`${s.cancelZone} ${dragging ? s.visible : ''}`}>
        <span className={s.cancelIcon}>✕</span>
      </div>
      <div
        ref={containerRef}
        className={s.row}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

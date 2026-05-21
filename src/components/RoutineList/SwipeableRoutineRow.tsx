import { useEffect, useRef, useState } from 'react';
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
  const lockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const [dragging, setDragging] = useState(false);

  const applyTransform = (dx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = `translateX(${dx}px)`;
  };

  const animateReturn = () => {
    const el = containerRef.current;
    if (!el) return;
    const current = el.style.transform;
    el.animate(
      [{ transform: current }, { transform: 'translateX(0)' }],
      { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' },
    ).onfinish = () => {
      el.style.transform = '';
    };
  };

  const animateExit = (cb: () => void) => {
    const el = containerRef.current;
    if (!el) { cb(); return; }
    el.animate(
      [{ transform: el.style.transform }, { transform: 'translateX(-120%)' }],
      { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
    ).onfinish = cb;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      currentDxRef.current = 0;
      lockedRef.current = null;
      setDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startXRef.current;
      const dy = e.touches[0].clientY - startYRef.current;

      if (lockedRef.current === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        lockedRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (lockedRef.current === 'vertical') return;
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
        animateExit(onCancel);
      } else {
        animateReturn();
      }
      currentDxRef.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onCancel]);

  return (
    <div className={s.wrapper}>
      <div className={`${s.cancelZone} ${dragging ? s.visible : ''}`}>
        <span className={s.cancelIcon}>✕</span>
      </div>
      <div ref={containerRef} className={s.row}>
        {children}
      </div>
    </div>
  );
}

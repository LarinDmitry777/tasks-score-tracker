import { useLayoutEffect, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { ROUTINE_BONUSES } from '../../types';
import { isVisibleToday } from '../../utils/routine';
import s from './RoutineList.module.css';

function getNextBonus(doneCount: number): number {
  const idx = doneCount;
  if (idx >= ROUTINE_BONUSES.length) return ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1];
  return ROUTINE_BONUSES[idx];
}

export function RoutineList() {
  const routine = useStore((st) => st.routine);
  const today = useStore((st) => st.today);
  const toggleRoutine = useStore((st) => st.toggleRoutine);

  const doneCountTotal = useMemo(
    () =>
      routine.filter(
        (r) => !r.archivedAt && isVisibleToday(r, today) && r.done && r.skippedOnDate !== today,
      ).length,
    [routine, today],
  );

  const visible = useMemo(
    () =>
      routine.filter(
        (r) => !r.archivedAt && isVisibleToday(r, today) && !r.done && r.skippedOnDate !== today,
      ),
    [routine, today],
  );

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());
  const exitingIds = useRef<Set<string>>(new Set());

  const handleComplete = (id: string) => {
    if (exitingIds.current.has(id)) return;
    const el = itemRefs.current.get(id);
    if (!el) {
      toggleRoutine(id);
      return;
    }
    exitingIds.current.add(id);
    const height = el.offsetHeight;
    const anim = el.animate(
      [
        { opacity: 1, height: `${height}px`, paddingTop: '14px', paddingBottom: '14px' },
        { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      exitingIds.current.delete(id);
      prevPositions.current.delete(id);
      itemRefs.current.forEach((siblingEl, siblingId) => {
        if (siblingId !== id) {
          prevPositions.current.set(siblingId, siblingEl.getBoundingClientRect().top);
        }
      });
      toggleRoutine(id);
    };
  };

  useLayoutEffect(() => {
    itemRefs.current.forEach((el, id) => {
      const currTop = el.getBoundingClientRect().top;
      const prevTop = prevPositions.current.get(id);
      if (prevTop !== undefined && prevTop !== currTop) {
        const dy = prevTop - currTop;
        el.animate(
          [
            { transform: `translateY(${dy}px)` },
            { transform: 'translateY(0)' },
          ],
          { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      }
      prevPositions.current.set(id, currTop);
    });
    for (const id of prevPositions.current.keys()) {
      if (!itemRefs.current.has(id)) prevPositions.current.delete(id);
    }
  });

  const setItemRef = (id: string) => (el: HTMLLIElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <p className={s.sectionTitle}>Рутина</p>
      </div>

      {visible.length === 0 ? (
        <p className={s.emptyHint}>На сегодня рутины нет</p>
      ) : (
        <ul className={s.list}>
          {visible.map((item) => {
            const bonus = getNextBonus(doneCountTotal);
            return (
              <li
                key={item.id}
                ref={setItemRef(item.id)}
                className={`${s.item} ${item.intervalDays > 1 ? s.periodic : ''}`}
              >
                <button
                  className={s.checkbox}
                  onClick={() => handleComplete(item.id)}
                  type="button"
                  aria-label="Отметить выполненным"
                />
                <span className={s.label}>{item.label}</span>
                <span className={s.bonus}>+{bonus.toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

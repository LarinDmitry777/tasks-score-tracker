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

  const visible = useMemo(
    () => routine.filter((r) => isVisibleToday(r, today)),
    [routine, today],
  );

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());

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

  const doneCount = visible.filter((r) => r.done).length;

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <p className={s.sectionTitle}>Рутина</p>
      </div>

      {visible.length === 0 ? (
        <p className={s.emptyHint}>На сегодня рутины нет</p>
      ) : (
        <ul className={s.list}>
          {visible.map((item, i) => {
            const bonus = item.done
              ? (i < ROUTINE_BONUSES.length ? ROUTINE_BONUSES[i] : ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1])
              : getNextBonus(doneCount);

            return (
              <li
                key={item.id}
                ref={setItemRef(item.id)}
                className={`${s.item} ${item.done ? s.done : ''}`}
              >
                <button
                  className={`${s.checkbox} ${item.done ? s.checked : ''}`}
                  onClick={() => toggleRoutine(item.id)}
                  type="button"
                  aria-label={item.done ? 'Снять отметку' : 'Отметить выполненным'}
                >
                  {item.done && <span className={s.checkmark}>✓</span>}
                </button>
                <span className={s.label}>{item.label}</span>
                <span className={`${s.bonus} ${item.done ? s.earned : ''}`}>
                  {item.done ? '✓' : '+'}{bonus.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { isVisibleToday } from '../../utils/routine';
import { SwipeableRoutineRow } from './SwipeableRoutineRow';
import s from './RoutineList.module.css';

function statusOrder(done: boolean, skipped: boolean): number {
  if (done) return 2;
  if (skipped) return 1;
  return 0;
}

export function RoutineList() {
  const routine = useStore((st) => st.routine);
  const today = useStore((st) => st.today);
  const toggleRoutine = useStore((st) => st.toggleRoutine);
  const skipRoutineToday = useStore((st) => st.skipRoutineToday);
  const unskipRoutineToday = useStore((st) => st.unskipRoutineToday);

  // Все активные рутины на сегодня, отсортированные: активные → отменённые → выполненные
  // Внутри каждой группы — порядок из настроек (индекс в массиве routine)
  const visible = useMemo(() => {
    const items = routine
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => !r.archivedAt && isVisibleToday(r, today));

    return items
      .sort((a, b) => {
        const aStatus = statusOrder(a.r.done, a.r.skippedOnDate === today);
        const bStatus = statusOrder(b.r.done, b.r.skippedOnDate === today);
        if (aStatus !== bStatus) return aStatus - bStatus;
        return a.idx - b.idx;
      })
      .map(({ r }) => r);
  }, [routine, today]);

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());

  // Снимаем позиции ДО рендера, чтобы потом анимировать FLIP
  const snapshotPositions = () => {
    itemRefs.current.forEach((el, id) => {
      prevPositions.current.set(id, el.getBoundingClientRect().top);
    });
  };

  useLayoutEffect(() => {
    itemRefs.current.forEach((el, id) => {
      const currTop = el.getBoundingClientRect().top;
      const prevTop = prevPositions.current.get(id);
      if (prevTop !== undefined && prevTop !== currTop) {
        const dy = prevTop - currTop;
        el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
          { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
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

  const handleToggle = (id: string) => {
    snapshotPositions();
    toggleRoutine(id);
  };

  const handleSkip = (id: string) => {
    snapshotPositions();
    skipRoutineToday(id);
  };

  const handleUnskip = (id: string) => {
    snapshotPositions();
    unskipRoutineToday(id);
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
            const isOptional = item.kind === 'optional';
            const isSkipped = item.skippedOnDate === today;

            const rowContent = (
              <li
                key={item.id}
                ref={setItemRef(item.id)}
                className={[
                  s.item,
                  item.intervalDays > 1 ? s.periodic : '',
                  item.done ? s.done : '',
                  isSkipped ? s.skipped : '',
                ].filter(Boolean).join(' ')}
              >
                <button
                  className={`${s.checkbox} ${item.done ? s.checked : ''}`}
                  onClick={() => !isSkipped && handleToggle(item.id)}
                  type="button"
                  aria-label={item.done ? 'Снять отметку' : 'Отметить выполненным'}
                  disabled={isSkipped}
                >
                  {item.done && <span className={s.checkmark}>✓</span>}
                </button>
                <span className={s.label}>{item.label}</span>
                {isSkipped && (
                  <button
                    className={s.unskipBtn}
                    onClick={() => handleUnskip(item.id)}
                    type="button"
                    aria-label="Вернуть"
                  >
                    ↩
                  </button>
                )}
                {isOptional && !isSkipped && (
                  <span className={s.kindBadge} title="Опциональная">○</span>
                )}
                {isSkipped && (
                  <span className={s.skippedMark}>⊘</span>
                )}
              </li>
            );

            if (isOptional && !isSkipped && !item.done) {
              return (
                <SwipeableRoutineRow
                  key={item.id}
                  onCancel={() => handleSkip(item.id)}
                >
                  {rowContent}
                </SwipeableRoutineRow>
              );
            }

            return rowContent;
          })}
        </ul>
      )}
    </section>
  );
}

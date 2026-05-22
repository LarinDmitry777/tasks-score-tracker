import { useLayoutEffect, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import type { RoutineItem } from '../../types';
import { isVisibleToday } from '../../utils/routine';
import { SwipeableRoutineRow } from './SwipeableRoutineRow';
import s from './RoutineList.module.css';

function sortByTimeAndOrder(items: { r: RoutineItem; idx: number }[]): RoutineItem[] {
  return items
    .sort((a, b) => {
      const aTime = a.r.timeOfDay === 'evening' ? 1 : 0;
      const bTime = b.r.timeOfDay === 'evening' ? 1 : 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.idx - b.idx;
    })
    .map(({ r }) => r);
}

interface RoutineRowProps {
  item: RoutineItem;
  today: string;
  setItemRef: (id: string) => (el: HTMLLIElement | null) => void;
  onToggle: (id: string) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
}

function RoutineRow({ item, today, setItemRef, onToggle, onSkip, onUnskip }: RoutineRowProps) {
  const isSkipped = item.skippedOnDate === today;
  const isOptional = item.kind === 'optional';

  const li = (
    <li
      ref={setItemRef(item.id)}
      className={[
        s.item,
        item.intervalDays > 1 ? s.periodic : '',
        item.timeOfDay === 'evening' ? s.evening : '',
        item.done ? s.done : '',
        isSkipped ? s.skipped : '',
      ].filter(Boolean).join(' ')}
    >
      <button
        className={`${s.checkbox} ${item.done ? s.checked : ''}`}
        onClick={() => !isSkipped && onToggle(item.id)}
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
          onClick={() => onUnskip(item.id)}
          type="button"
          aria-label="Вернуть"
        >
          ↩
        </button>
      )}
      {isSkipped && !isOptional && <span className={s.cancelledMark}>✕</span>}
      {isSkipped && isOptional && <span className={s.skippedMark}>⊘</span>}
    </li>
  );

  if (!isSkipped && !item.done) {
    return (
      <SwipeableRoutineRow key={item.id} onCancel={() => onSkip(item.id)}>
        {li}
      </SwipeableRoutineRow>
    );
  }

  return li;
}

export function RoutineList() {
  const routine = useStore((st) => st.routine);
  const today = useStore((st) => st.today);
  const toggleRoutine = useStore((st) => st.toggleRoutine);
  const skipRoutineToday = useStore((st) => st.skipRoutineToday);
  const unskipRoutineToday = useStore((st) => st.unskipRoutineToday);

  const { mandatory, optional, completed } = useMemo(() => {
    const indexed = routine
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => !r.archivedAt && isVisibleToday(r, today));

    const isActive = (r: RoutineItem) => !r.done && r.skippedOnDate !== today;

    return {
      mandatory: sortByTimeAndOrder(indexed.filter(({ r }) => r.kind === 'mandatory' && isActive(r))),
      optional: sortByTimeAndOrder(indexed.filter(({ r }) => r.kind === 'optional' && isActive(r))),
      completed: sortByTimeAndOrder(indexed.filter(({ r }) => r.done || r.skippedOnDate === today)),
    };
  }, [routine, today]);

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevPositions = useRef<Map<string, number>>(new Map());

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

  const handleToggle = (id: string) => { snapshotPositions(); toggleRoutine(id); };
  const handleSkip = (id: string) => { snapshotPositions(); skipRoutineToday(id); };
  const handleUnskip = (id: string) => { snapshotPositions(); unskipRoutineToday(id); };

  const total = mandatory.length + optional.length + completed.length;

  const rowProps = { today, setItemRef, onToggle: handleToggle, onSkip: handleSkip, onUnskip: handleUnskip };

  return (
    <section className={s.section}>
      {total === 0 ? (
        <p className={s.emptyHint}>На сегодня рутины нет</p>
      ) : (
        <div className={s.groups}>
          {mandatory.length > 0 && (
            <div className={s.group}>
              <p className={s.groupLabel}>Обязательные</p>
              <ul className={s.list}>
                {mandatory.map((item) => (
                  <RoutineRow key={item.id} item={item} {...rowProps} />
                ))}
              </ul>
            </div>
          )}

          {optional.length > 0 && (
            <div className={s.group}>
              <p className={s.groupLabel}>Опциональные</p>
              <ul className={s.list}>
                {optional.map((item) => (
                  <RoutineRow key={item.id} item={item} {...rowProps} />
                ))}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div className={s.group}>
              <p className={s.groupLabel}>Выполненные</p>
              <ul className={s.list}>
                {completed.map((item) => (
                  <RoutineRow key={item.id} item={item} {...rowProps} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

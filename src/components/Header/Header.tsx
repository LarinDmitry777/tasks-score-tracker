import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { isVisibleToday } from '../../utils/routine';
import s from './Header.module.css';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function Header() {
  const routine = useStore((st) => st.routine);
  const habits = useStore((st) => st.habits);
  const today = useStore((st) => st.today);

  const { routineDone, routineTotal, habitsDone, habitsTotal } = useMemo(() => {
    const visible = routine.filter(
      (r) => !r.archivedAt && isVisibleToday(r, today) && r.skippedOnDate !== today,
    );
    const activeHabits = habits.filter((h) => !h.archivedAt);
    return {
      routineDone: visible.filter((r) => r.done).length,
      routineTotal: visible.length,
      habitsDone: activeHabits.filter((h) => h.doneToday).length,
      habitsTotal: activeHabits.length,
    };
  }, [routine, habits, today]);

  return (
    <header className={s.header}>
      <p className={s.date}>{formatDate(today)}</p>
      <div className={s.counters}>
        {routineTotal > 0 && (
          <span className={s.counter}>
            Рутины <strong>{routineDone}/{routineTotal}</strong>
          </span>
        )}
        {habitsTotal > 0 && (
          <span className={s.counter}>
            Привычки <strong>{habitsDone}/{habitsTotal}</strong>
          </span>
        )}
      </div>
    </header>
  );
}

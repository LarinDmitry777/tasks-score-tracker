import { useMemo } from 'react';
import type { CalendarTarget } from '../../store/useStore';
import type { DayRecord, Habit, UndesiredTask } from '../../types';
import { getDayStatus, type DayStatus } from '../../utils/calendar';
import { DAY_NAMES, getMonthMatrix } from '../../utils/week';
import s from './Calendar.module.css';

interface CalendarProps {
  year: number;
  month0: number;
  today: string;
  target: NonNullable<CalendarTarget>;
  history: DayRecord[];
  habits: Habit[];
  undesired: UndesiredTask[];
  onDayClick?: (date: string, status: DayStatus, note: string | undefined) => void;
}

const STATUS_CLASS: Record<DayStatus, string> = {
  done: s.dotDone,
  fail: s.dotFail,
  empty: s.dotEmpty,
  none: '',
};

function getFailNote(
  date: string,
  target: NonNullable<CalendarTarget>,
  today: string,
  historyByDate: Map<string, DayRecord>,
  undesired: UndesiredTask[],
): string | undefined {
  if (target.kind !== 'undesired') return undefined;
  if (date === today) {
    return undesired.find((u) => u.id === target.id)?.todayNote;
  }
  const rec = historyByDate.get(date);
  return rec?.undesired.find((u) => u.id === target.id)?.note;
}

export function Calendar({ year, month0, today, target, history, habits, undesired, onDayClick }: CalendarProps) {
  const matrix = useMemo(() => getMonthMatrix(year, month0), [year, month0]);

  const historyByDate = useMemo(() => {
    const m = new Map<string, DayRecord>();
    for (const r of history) m.set(r.date, r);
    return m;
  }, [history]);

  return (
    <div className={s.grid}>
      {DAY_NAMES.map((d) => (
        <div key={d} className={s.weekdayHeader}>{d}</div>
      ))}
      {matrix.flatMap((week, rowIdx) =>
        week.map((date, colIdx) => {
          const key = `${rowIdx}-${colIdx}`;
          if (date === null) {
            return <div key={key} className={s.cellEmpty} />;
          }
          const status = getDayStatus(date, target, { today, historyByDate, habits, undesired });
          const dayNum = parseInt(date.slice(8, 10), 10);
          const isToday = date === today;
          const isTappable = onDayClick && status !== 'none';
          return (
            <div
              key={key}
              className={`${s.cell} ${isToday ? s.cellToday : ''} ${isTappable ? s.cellTappable : ''}`}
              onClick={
                isTappable
                  ? () => onDayClick(date, status, getFailNote(date, target, today, historyByDate, undesired))
                  : undefined
              }
            >
              <span className={s.dayNum}>{dayNum}</span>
              <span className={`${s.dot} ${STATUS_CLASS[status]}`} aria-hidden />
            </div>
          );
        }),
      )}
    </div>
  );
}

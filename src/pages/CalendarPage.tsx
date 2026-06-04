import { useMemo, useState } from 'react';
import { Calendar } from '../components/Calendar/Calendar';
import { CalendarTargetSheet } from '../components/CalendarTargetSheet/CalendarTargetSheet';
import { useStore } from '../store/useStore';
import { MONTH_NAMES } from '../utils/week';
import s from './CalendarPage.module.css';

export function CalendarPage() {
  const today = useStore((st) => st.today);
  const habits = useStore((st) => st.habits);
  const undesired = useStore((st) => st.undesired);
  const history = useStore((st) => st.history);
  const calendarTarget = useStore((st) => st.calendarTarget);
  const setCalendarTarget = useStore((st) => st.setCalendarTarget);

  const [todayYear, todayMonth0] = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return [y, m - 1] as const;
  }, [today]);

  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0);

  const targetLabel = useMemo(() => {
    if (!calendarTarget) return null;
    const arr = calendarTarget.kind === 'habit' ? habits : undesired;
    return arr.find((x) => x.id === calendarTarget.id)?.label ?? null;
  }, [calendarTarget, habits, undesired]);

  const [sheetOpen, setSheetOpen] = useState(false);

  const goPrev = () => {
    if (month0 === 0) {
      setMonth0(11);
      setYear((y) => y - 1);
    } else {
      setMonth0((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month0 === 11) {
      setMonth0(0);
      setYear((y) => y + 1);
    } else {
      setMonth0((m) => m + 1);
    }
  };

  const monthLabel = `${MONTH_NAMES[month0]} ${year}`;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Календарь</h1>
        <p className={s.subtitle}>Статистика привычек и срывов</p>
      </div>

      <button
        type="button"
        className={s.targetBtn}
        onClick={() => setSheetOpen(true)}
      >
        <span className={s.targetLabel}>
          {targetLabel ?? 'Выберите привычку или срыв'}
        </span>
        <span className={s.chevron}>▾</span>
      </button>

      <div className={s.monthNav}>
        <button
          type="button"
          className={s.navBtn}
          onClick={goPrev}
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className={s.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          className={s.navBtn}
          onClick={goNext}
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>

      {calendarTarget ? (
        <Calendar
          year={year}
          month0={month0}
          today={today}
          target={calendarTarget}
          history={history}
          habits={habits}
          undesired={undesired}
        />
      ) : (
        <div className={s.empty}>
          <span className={s.emptyIcon}>📅</span>
          <p className={s.emptyText}>
            Выберите привычку или срыв, чтобы увидеть статистику за месяц.
          </p>
        </div>
      )}

      {calendarTarget && (
        <div className={s.legend}>
          {calendarTarget.kind === 'habit' ? (
            <>
              <span className={s.legendItem}>
                <span className={`${s.legendDot} ${s.legendDone}`} />
                Выполнено
              </span>
              <span className={s.legendItem}>
                <span className={`${s.legendDot} ${s.legendEmpty}`} />
                Не выполнено
              </span>
            </>
          ) : (
            <>
              <span className={s.legendItem}>
                <span className={`${s.legendDot} ${s.legendFail}`} />
                Срыв
              </span>
              <span className={s.legendItem}>
                <span className={`${s.legendDot} ${s.legendEmpty}`} />
                Чисто
              </span>
            </>
          )}
        </div>
      )}

      <CalendarTargetSheet
        open={sheetOpen}
        habits={habits}
        undesired={undesired}
        current={calendarTarget}
        onPick={setCalendarTarget}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}

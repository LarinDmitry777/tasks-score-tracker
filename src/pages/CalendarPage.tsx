import { useMemo, useState } from 'react';
import { Calendar } from '../components/Calendar/Calendar';
import { CalendarTargetSheet } from '../components/CalendarTargetSheet/CalendarTargetSheet';
import { Modal } from '../components/Modal/Modal';
import { useStore } from '../store/useStore';
import type { DayRecord, UndesiredTask } from '../types';
import type { DayStatus } from '../utils/calendar';
import { DAY_NAMES, MONTH_NAMES, MONTH_NAMES_SHORT } from '../utils/week';
import s from './CalendarPage.module.css';

interface DayFail {
  id: string;
  label: string;
  markedToday: boolean;
  note: string | undefined;
}

function formatFailDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const jsDow = d.getDay();
  const dayName = DAY_NAMES[jsDow === 0 ? 6 : jsDow - 1];
  return `${dayName}, ${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayFails(
  date: string,
  today: string,
  history: DayRecord[],
  undesired: UndesiredTask[],
): DayFail[] {
  const active = undesired.filter((u) => !u.archivedAt);
  if (date === today) {
    return active.map((u) => ({ id: u.id, label: u.label, markedToday: u.markedToday, note: u.todayNote }));
  }
  const rec = history.find((r) => r.date === date);
  return active.map((u) => {
    const hist = rec?.undesired.find((h) => h.id === u.id);
    return { id: u.id, label: u.label, markedToday: hist?.markedToday ?? false, note: hist?.note };
  });
}

export function CalendarPage() {
  const today = useStore((st) => st.today);
  const habits = useStore((st) => st.habits);
  const undesired = useStore((st) => st.undesired);
  const history = useStore((st) => st.history);
  const calendarTarget = useStore((st) => st.calendarTarget);
  const setCalendarTarget = useStore((st) => st.setCalendarTarget);
  const toggleHistoryFail = useStore((st) => st.toggleHistoryFail);

  const [todayYear, todayMonth0] = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return [y, m - 1] as const;
  }, [today]);

  const [year, setYear] = useState(todayYear);
  const [month0, setMonth0] = useState(todayMonth0);

  const targetLabel = useMemo(() => {
    if (!calendarTarget) return null;
    if (calendarTarget.kind === 'all-habits') return 'Все привычки';
    if (calendarTarget.kind === 'all-undesired') return 'Все срывы';
    const arr = calendarTarget.kind === 'habit' ? habits : undesired;
    return arr.find((x) => x.id === calendarTarget.id)?.label ?? null;
  }, [calendarTarget, habits, undesired]);

  const [sheetOpen, setSheetOpen] = useState(false);

  // Day fails sheet + pending add item (shared for single-item and all-undesired modes)
  const [dayEditDate, setDayEditDate] = useState<string | null>(null);
  const [pendingAddItem, setPendingAddItem] = useState<{ date: string; undesiredId: string } | null>(null);

  const handleDayClick = (date: string, _status: DayStatus, _note: string | undefined) => {
    if (!calendarTarget) return;
    if (calendarTarget.kind === 'undesired' || calendarTarget.kind === 'all-undesired') {
      setDayEditDate(date);
    }
  };

  const highlightId =
    calendarTarget?.kind === 'undesired' ? calendarTarget.id : undefined;

  const goPrev = () => {
    if (month0 === 0) { setMonth0(11); setYear((y) => y - 1); }
    else setMonth0((m) => m - 1);
  };

  const goNext = () => {
    if (month0 === 11) { setMonth0(0); setYear((y) => y + 1); }
    else setMonth0((m) => m + 1);
  };

  const monthLabel = `${MONTH_NAMES[month0]} ${year}`;

  const isUndesiredMode =
    calendarTarget?.kind === 'undesired' || calendarTarget?.kind === 'all-undesired';

  const dayFails = dayEditDate
    ? getDayFails(dayEditDate, today, history, undesired)
    : [];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Календарь</h1>
        <p className={s.subtitle}>Статистика привычек и срывов</p>
      </div>

      <button type="button" className={s.targetBtn} onClick={() => setSheetOpen(true)}>
        <span className={s.targetLabel}>{targetLabel ?? 'Выберите привычку или срыв'}</span>
        <span className={s.chevron}>▾</span>
      </button>

      <div className={s.monthNav}>
        <button type="button" className={s.navBtn} onClick={goPrev} aria-label="Предыдущий месяц">‹</button>
        <span className={s.monthLabel}>{monthLabel}</span>
        <button type="button" className={s.navBtn} onClick={goNext} aria-label="Следующий месяц">›</button>
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
          onDayClick={isUndesiredMode ? handleDayClick : undefined}
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
          {calendarTarget.kind === 'habit' || calendarTarget.kind === 'all-habits' ? (
            <>
              <span className={s.legendItem}><span className={`${s.legendDot} ${s.legendDone}`} />Выполнено</span>
              <span className={s.legendItem}><span className={`${s.legendDot} ${s.legendEmpty}`} />Не выполнено</span>
            </>
          ) : (
            <>
              <span className={s.legendItem}><span className={`${s.legendDot} ${s.legendFail}`} />Срыв (тап — изменить)</span>
              <span className={s.legendItem}><span className={`${s.legendDot} ${s.legendEmpty}`} />Чисто (тап — добавить)</span>
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

      {/* Day fails sheet (single-item and all-undesired modes) */}
      {dayEditDate && (
        <div className={s.noteOverlay} onClick={() => setDayEditDate(null)}>
          <div className={s.noteSheet} onClick={(e) => e.stopPropagation()}>
            <div className={s.noteHandle} />
            <div className={s.noteDate}>{formatFailDate(dayEditDate)}</div>
            <div className={s.dayFailsTitle}>Срывы за день</div>
            <div className={s.dayFailsList}>
              {dayFails.length === 0 ? (
                <p className={s.noteEmpty}>Нет отслеживаемых срывов</p>
              ) : (
                dayFails.map((item) => (
                  <div
                    key={item.id}
                    className={`${s.dayFailRow} ${item.markedToday ? s.dayFailRowActive : ''} ${item.id === highlightId ? s.dayFailRowHighlight : ''}`}
                  >
                    <div className={s.dayFailInfo}>
                      <span className={s.dayFailLabel}>{item.label}</span>
                      {item.markedToday && item.note && (
                        <span className={s.dayFailNote}>{item.note}</span>
                      )}
                    </div>
                    {item.markedToday ? (
                      <button
                        type="button"
                        className={s.dayFailRemoveBtn}
                        onClick={() => toggleHistoryFail(dayEditDate, item.id)}
                      >
                        Удалить
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={s.dayFailAddBtn}
                        onClick={() => {
                          setDayEditDate(null);
                          setPendingAddItem({ date: dayEditDate, undesiredId: item.id });
                        }}
                      >
                        Отметить
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <button type="button" className={s.noteDismiss} onClick={() => setDayEditDate(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* All-undesired: add fail note modal */}
      <Modal
        open={pendingAddItem !== null}
        title="Причина срыва"
        placeholder="Что произошло? (необязательно)"
        saveLabel="Отметить срыв"
        allowEmpty
        onSave={(note) => {
          if (pendingAddItem) {
            toggleHistoryFail(pendingAddItem.date, pendingAddItem.undesiredId, note || undefined);
          }
          setPendingAddItem(null);
        }}
        onClose={() => setPendingAddItem(null)}
      />
    </div>
  );
}

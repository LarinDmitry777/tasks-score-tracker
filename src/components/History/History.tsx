import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { DayRecord } from '../../types';
import s from './History.module.css';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function HistoryCard({ record }: { record: DayRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={s.card}>
      <div className={s.cardHeader} onClick={() => setOpen((v) => !v)}>
        <span className={s.cardDate}>{formatDate(record.date)}</span>
        <div className={s.cardCounters}>
          <span className={s.counterChip}>
            Рутины: {record.routineCompleted}/{record.routineTotal}
          </span>
          <span className={s.counterChip}>
            Привычки: {record.habitsDone}/{record.habitsTotal}
          </span>
          {record.negativeFails > 0 && (
            <span className={`${s.counterChip} ${s.failChip}`}>
              Срывы: {record.negativeFails}
            </span>
          )}
        </div>
        <span className={`${s.expandIcon} ${open ? s.open : ''}`}>▼</span>
      </div>

      {open && (
        <div className={s.details}>
          {/* Routines */}
          {record.routine.length > 0 && (
            <div className={s.detailSection}>
              <span className={s.detailLabel}>Рутины</span>
              {record.routine.map((r) => (
                <div key={r.id} className={s.habitRow}>
                  <span className={s.habitStatus}>
                    {r.done ? '✓' : r.skipped ? '⊘' : '·'}
                  </span>
                  <span className={s.habitName}>{r.label}</span>
                  {r.kind === 'optional' && (
                    <span className={s.kindMark}>○</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Habits */}
          {record.habits.length > 0 && (
            <div className={s.detailSection}>
              <span className={s.detailLabel}>Привычки</span>
              {record.habits.map((h) => (
                <div key={h.id} className={s.habitRow}>
                  <span className={s.habitStatus}>{h.doneToday ? '✓' : '✗'}</span>
                  <span className={s.habitName}>{h.label}</span>
                  <span className={s.habitInfo}>🔥{h.streak}</span>
                </div>
              ))}
            </div>
          )}

          {/* Undesired */}
          {record.undesired.length > 0 && (
            <div className={s.detailSection}>
              <span className={s.detailLabel}>Нежелательное</span>
              {record.undesired.map((u) => (
                <div key={u.id} className={s.habitRow}>
                  <span className={s.habitStatus}>{u.markedToday ? '⚠️' : '✓'}</span>
                  <span className={s.habitName}>{u.label}</span>
                  {u.failStreak > 0 && (
                    <span className={s.habitInfo}>{u.failStreak} дн.</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function History() {
  const history = useStore((st) => st.history);

  return (
    <div className={s.page}>
      {history.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>📅</span>
          <p className={s.emptyText}>История пока пуста.<br />Завершите первый день!</p>
        </div>
      ) : (
        <ul className={s.list} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {history.map((record) => (
            <li key={record.date}>
              <HistoryCard record={record} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

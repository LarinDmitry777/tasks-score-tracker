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

  const sCount = record.tasks.filter((t) => t.size === 'S').length;
  const mCount = record.tasks.filter((t) => t.size === 'M').length;
  const lCount = record.tasks.filter((t) => t.size === 'L').length;

  return (
    <div className={s.card}>
      <div className={s.cardHeader} onClick={() => setOpen((v) => !v)}>
        <span className={s.cardDate}>{formatDate(record.date)}</span>
        <span className={s.cardScore}>{record.totalScore}</span>
        <span className={`${s.expandIcon} ${open ? s.open : ''}`}>▼</span>
      </div>

      {open && (
        <div className={s.details}>
          {/* Tasks */}
          <div className={s.detailRow}>
            <span className={s.detailLabel}>Задачи</span>
            <div className={s.tasksRow}>
              {sCount > 0 && <span className={`${s.taskChip} ${s.S}`}>S×{sCount}</span>}
              {mCount > 0 && <span className={`${s.taskChip} ${s.M}`}>M×{mCount}</span>}
              {lCount > 0 && <span className={`${s.taskChip} ${s.L}`}>L×{lCount}</span>}
              {sCount + mCount + lCount === 0 && <span style={{ color: 'var(--text-muted)' }}>—</span>}
            </div>
          </div>

          {/* Base points */}
          <div className={s.detailRow}>
            <span className={s.detailLabel}>Базовые очки</span>
            <span className={`${s.detailValue}`}>{record.basePoints} BP</span>
          </div>

          {/* Routine */}
          <div className={s.detailRow}>
            <span className={s.detailLabel}>Рутина</span>
            <span className={`${s.detailValue} ${s.accent}`}>
              {record.routineDoneCount} дел · +{record.routineMultiplier.toFixed(2)}
            </span>
          </div>

          {/* Habits */}
          {record.habits.length > 0 && (
            <div className={s.detailRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className={s.detailLabel}>Привычки (+{record.habitMultiplier.toFixed(2)})</span>
              {record.habits.map((h) => (
                <div key={h.id} className={s.habitRow}>
                  <span className={s.habitName}>{h.label}</span>
                  <span className={s.habitInfo}>
                    🔥{h.streak} · +{h.bonus.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Formula */}
          <div className={s.formulaBox}>
            {record.basePoints} BP × {record.totalMultiplier.toFixed(2)}
            {' = '}
            <strong>{record.totalScore}</strong>
          </div>
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

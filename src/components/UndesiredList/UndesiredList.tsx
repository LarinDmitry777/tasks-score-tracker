import { useStore } from '../../store/useStore';
import { calcUndesiredPenalty } from '../../utils/score';
import { UNDESIRED_PENALTY_CAP } from '../../types';
import s from './UndesiredList.module.css';

function cleanLabel(days: number): string {
  if (days === 0) return 'Сегодня ещё чисто';
  if (days === 1) return '1 день без срыва';
  if (days >= 2 && days <= 4) return `${days} дня без срыва`;
  return `${days} дней без срыва`;
}

export function UndesiredList() {
  const undesired = useStore((st) => st.undesired).filter((u) => !u.archivedAt);
  const toggleUndesired = useStore((st) => st.toggleUndesired);

  if (undesired.length === 0) return null;

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <p className={s.sectionTitle}>Нежелательное</p>
      </div>

      <div className={s.cards}>
        {undesired.map((item) => {
          const currentPenalty = item.markedToday ? calcUndesiredPenalty(item.failStreak) : 0;
          const nextPenalty = item.markedToday
            ? currentPenalty
            : calcUndesiredPenalty(item.failStreak + 1);
          const atCap = nextPenalty >= UNDESIRED_PENALTY_CAP;

          return (
            <div key={item.id} className={`${s.card} ${item.markedToday ? s.marked : ''}`}>
              <div className={s.cardTop}>
                <div className={`${s.streakBadge} ${item.markedToday ? s.danger : ''}`}>
                  <span className={s.streakIcon}>{item.markedToday ? '⚠️' : '✓'}</span>
                  <span className={s.streakNum}>
                    {item.markedToday ? item.failStreak : item.cleanStreak}
                  </span>
                  <span className={s.streakLabel}>дней</span>
                </div>

                <div className={s.cardInfo}>
                  <div className={s.cardLabel}>{item.label}</div>
                  <div className={s.cardMeta}>
                    {item.markedToday ? (
                      <span className={`${s.penaltyBadge} ${s.applied}`}>
                        −{currentPenalty.toFixed(2)}
                      </span>
                    ) : (
                      <span className={s.penaltyBadge}>−{nextPenalty.toFixed(2)}</span>
                    )}
                    <span className={s.hint}>
                      {item.markedToday
                        ? `срыв ${item.failStreak}-й день подряд`
                        : cleanLabel(item.cleanStreak)}
                      {atCap ? ' · максимум' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className={`${s.markBtn} ${item.markedToday ? s.active : ''}`}
                onClick={() => toggleUndesired(item.id)}
                type="button"
              >
                {item.markedToday ? '✗ Отмечен срыв' : 'Отметить срыв'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

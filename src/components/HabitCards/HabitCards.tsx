import { useStore } from '../../store/useStore';
import s from './HabitCards.module.css';

export function HabitCards() {
  const habits = useStore((st) => st.habits).filter((h) => !h.archivedAt);
  const toggleHabit = useStore((st) => st.toggleHabit);

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <p className={s.sectionTitle}>Позитивные</p>
      </div>

      {habits.length === 0 ? (
        <p className={s.emptyHint}>Добавьте привычки в настройках</p>
      ) : (
        <div className={s.cards}>
          {habits.map((habit) => {
            const skipsLeft = Math.max(0, habit.skipsAllowed - habit.skipsUsed);

            return (
              <div key={habit.id} className={`${s.card} ${habit.doneToday ? s.done : ''}`}>
                <div className={s.cardTop}>
                  <div className={`${s.streakBadge} ${habit.streak > 0 ? s.active : ''}`}>
                    <span className={s.streakFire}>{habit.streak >= 11 ? '🔥' : habit.streak >= 4 ? '⚡' : '○'}</span>
                    <span className={s.streakNum}>{habit.streak}</span>
                    <span className={s.streakLabel}>дней</span>
                  </div>

                  <div className={s.cardInfo}>
                    <div className={s.cardLabel}>{habit.label}</div>
                    <div className={s.cardMeta}>
                      {habit.skipsAllowed > 0 && (
                        <span className={s.streakHint}>
                          пропусков: {skipsLeft}/{habit.skipsAllowed} на неделю
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className={`${s.doneBtn} ${habit.doneToday ? s.active : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                  type="button"
                >
                  {habit.doneToday ? '✓ Выполнено сегодня' : 'Отметить выполненным'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

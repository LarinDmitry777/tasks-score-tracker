import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { calcHabitBonus } from '../../utils/score';
import { Modal } from '../Modal/Modal';
import s from './HabitCards.module.css';

function streakHint(streak: number): string {
  if (streak === 0) return 'Начни сегодня!';
  if (streak < 4) return `ещё ${4 - streak} дн. до +0.10`;
  if (streak < 11) return `ещё ${11 - streak} дн. до +0.20`;
  return 'Максимальный бонус!';
}

export function HabitCards() {
  const habits = useStore((st) => st.habits);
  const toggleHabit = useStore((st) => st.toggleHabit);
  const addHabit = useStore((st) => st.addHabit);
  const editHabit = useStore((st) => st.editHabit);
  const deleteHabit = useStore((st) => st.deleteHabit);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; label: string } | null>(null);

  const handleSave = (label: string) => {
    if (editTarget) {
      editHabit(editTarget.id, label);
    } else {
      addHabit(label);
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleEdit = (id: string, label: string) => {
    setEditTarget({ id, label });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  return (
    <section className={s.section}>
      <div className={s.sectionHeader}>
        <p className={s.sectionTitle}>Привычки</p>
        <button
          id="add-habit-btn"
          className={s.addBtn}
          onClick={() => setModalOpen(true)}
          type="button"
        >
          + Добавить
        </button>
      </div>

      {habits.length === 0 ? (
        <p className={s.emptyHint}>Добавьте привычки для отслеживания</p>
      ) : (
        <div className={s.cards}>
          {habits.map((habit) => {
            const bonus = calcHabitBonus(habit.streak + (habit.doneToday ? 0 : 1));
            const currentBonus = habit.doneToday ? calcHabitBonus(habit.streak) : 0;

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
                      {habit.doneToday ? (
                        <span className={`${s.bonusBadge} ${s.earned}`}>+{currentBonus.toFixed(2)}</span>
                      ) : (
                        <span className={s.bonusBadge}>+{bonus.toFixed(2)}</span>
                      )}
                      <span className={s.streakHint}>{streakHint(habit.streak)}</span>
                    </div>
                  </div>

                  <div className={s.cardActions}>
                    <button
                      className={s.iconBtn}
                      onClick={() => handleEdit(habit.id, habit.label)}
                      type="button"
                      aria-label="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      className={`${s.iconBtn} ${s.danger}`}
                      onClick={() => deleteHabit(habit.id)}
                      type="button"
                      aria-label="Удалить"
                    >
                      🗑
                    </button>
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

      <Modal
        open={modalOpen}
        title={editTarget ? 'Редактировать привычку' : 'Новая привычка'}
        placeholder="Например: Медитация"
        initialValue={editTarget?.label}
        onSave={handleSave}
        onClose={handleClose}
      />
    </section>
  );
}

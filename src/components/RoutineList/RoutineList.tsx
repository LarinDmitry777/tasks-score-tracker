import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ROUTINE_BONUSES } from '../../types';
import { Modal } from '../Modal/Modal';
import s from './RoutineList.module.css';

function getNextBonus(doneCount: number): number {
  const idx = doneCount;
  if (idx >= ROUTINE_BONUSES.length) return ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1];
  return ROUTINE_BONUSES[idx];
}

export function RoutineList() {
  const routine = useStore((st) => st.routine);
  const toggleRoutine = useStore((st) => st.toggleRoutine);
  const addRoutine = useStore((st) => st.addRoutine);
  const editRoutine = useStore((st) => st.editRoutine);
  const deleteRoutine = useStore((st) => st.deleteRoutine);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; label: string } | null>(null);

  const doneCount = routine.filter((r) => r.done).length;

  const handleSave = (label: string) => {
    if (editTarget) {
      editRoutine(editTarget.id, label);
    } else {
      addRoutine(label);
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
        <p className={s.sectionTitle}>Рутина</p>
        <button
          id="add-routine-btn"
          className={s.addBtn}
          onClick={() => setModalOpen(true)}
          type="button"
        >
          + Добавить
        </button>
      </div>

      {routine.length === 0 ? (
        <p className={s.emptyHint}>Добавьте пункты рутины</p>
      ) : (
        <ul className={s.list}>
          {routine.map((item, i) => {
            const bonus = item.done
              ? (i < ROUTINE_BONUSES.length ? ROUTINE_BONUSES[i] : ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1])
              : getNextBonus(doneCount);

            return (
              <li key={item.id} className={`${s.item} ${item.done ? s.done : ''}`}>
                <button
                  className={`${s.checkbox} ${item.done ? s.checked : ''}`}
                  onClick={() => toggleRoutine(item.id)}
                  type="button"
                  aria-label={item.done ? 'Снять отметку' : 'Отметить выполненным'}
                >
                  {item.done && <span className={s.checkmark}>✓</span>}
                </button>
                <span className={s.label}>{item.label}</span>
                <span className={`${s.bonus} ${item.done ? s.earned : ''}`}>
                  {item.done ? '✓' : '+'}{bonus.toFixed(2)}
                </span>
                <div className={s.actions}>
                  <button
                    className={s.iconBtn}
                    onClick={() => handleEdit(item.id, item.label)}
                    type="button"
                    aria-label="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className={`${s.iconBtn} ${s.danger}`}
                    onClick={() => deleteRoutine(item.id)}
                    type="button"
                    aria-label="Удалить"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title={editTarget ? 'Редактировать рутину' : 'Новый пункт рутины'}
        placeholder="Например: Зарядка"
        initialValue={editTarget?.label}
        onSave={handleSave}
        onClose={handleClose}
      />
    </section>
  );
}

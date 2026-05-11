import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Habit } from '../types';
import s from './RoutineSettingsPage.module.css';

interface Props {
  onBack: () => void;
}

interface DraftValues {
  label: string;
  skipsAllowed: number;
}

function skipsLabel(n: number): string {
  if (n === 0) return 'без пропусков';
  if (n === 1) return '1 пропуск в неделю';
  return `${n} пропусков в неделю`;
}

export function HabitSettingsPage({ onBack }: Props) {
  const habits = useStore((st) => st.habits);
  const addHabit = useStore((st) => st.addHabit);
  const editHabit = useStore((st) => st.editHabit);
  const deleteHabit = useStore((st) => st.deleteHabit);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Habit | null>(null);
  const [draft, setDraft] = useState<DraftValues>({ label: '', skipsAllowed: 0 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...habits].sort((a, b) => a.label.localeCompare(b.label, 'ru')),
    [habits],
  );

  const openAdd = () => {
    setEditTarget(null);
    setDraft({ label: '', skipsAllowed: 0 });
    setEditorOpen(true);
  };

  const openEdit = (h: Habit) => {
    setEditTarget(h);
    setDraft({ label: h.label, skipsAllowed: h.skipsAllowed });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditTarget(null);
  };

  const saveDraft = () => {
    const label = draft.label.trim();
    if (!label) return;
    const skips = Math.max(0, Math.min(7, Math.floor(draft.skipsAllowed || 0)));
    if (editTarget) {
      editHabit(editTarget.id, { label, skipsAllowed: skips });
    } else {
      addHabit(label, skips);
    }
    closeEditor();
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    setConfirmDelete(null);
  };

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} type="button" aria-label="Назад">
          ← Назад
        </button>
        <h1 className={s.title}>Привычки</h1>
        <button className={s.addBtn} onClick={openAdd} type="button">+ Добавить</button>
      </div>

      {sorted.length === 0 ? (
        <p className={s.emptyHint}>Список пуст. Добавьте первую привычку.</p>
      ) : (
        <ul className={s.list}>
          {sorted.map((h) => {
            const skipsLeft = Math.max(0, h.skipsAllowed - h.skipsUsed);
            return (
              <li key={h.id} className={s.item}>
                <div className={s.itemMain}>
                  <p className={s.itemLabel}>{h.label}</p>
                  <div className={s.badges}>
                    <span className={s.badge}>стрик: {h.streak}</span>
                    <span className={s.badge}>{skipsLabel(h.skipsAllowed)}</span>
                    {h.skipsAllowed > 0 && (
                      <span className={`${s.badge} ${s.dueBadge}`}>
                        осталось: {skipsLeft}/{h.skipsAllowed}
                      </span>
                    )}
                  </div>
                </div>
                <div className={s.itemActions}>
                  <button
                    className={s.iconBtn}
                    onClick={() => openEdit(h)}
                    type="button"
                    aria-label="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className={`${s.iconBtn} ${s.danger}`}
                    onClick={() => setConfirmDelete(h.id)}
                    type="button"
                    aria-label="Удалить"
                  >
                    🗑
                  </button>
                </div>
                {confirmDelete === h.id && (
                  <div className={s.confirmBox}>
                    <p className={s.confirmText}>Удалить «{h.label}»?</p>
                    <div className={s.confirmBtns}>
                      <button
                        className={s.btnSecondary}
                        onClick={() => setConfirmDelete(null)}
                        type="button"
                      >
                        Отмена
                      </button>
                      <button
                        className={s.btnDanger}
                        onClick={() => handleDelete(h.id)}
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editorOpen && (
        <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && closeEditor()}>
          <div className={s.sheet}>
            <div className={s.handle} />
            <p className={s.sheetTitle}>
              {editTarget ? 'Редактировать привычку' : 'Новая привычка'}
            </p>

            <label className={s.field}>
              <span className={s.fieldLabel}>Название</span>
              <input
                className={s.input}
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Например: Спорт"
                maxLength={60}
                autoFocus
              />
            </label>

            <label className={s.field}>
              <span className={s.fieldLabel}>Допустимо пропусков в неделю</span>
              <input
                className={s.input}
                type="number"
                min={0}
                max={7}
                value={draft.skipsAllowed}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, skipsAllowed: Number(e.target.value) || 0 }))
                }
              />
              <span className={s.hint}>
                {skipsLabel(Math.max(0, Math.min(7, Math.floor(draft.skipsAllowed || 0))))}.
                Счётчик пропусков обнуляется в понедельник.
              </span>
            </label>

            <div className={s.sheetActions}>
              <button className={s.btnSecondary} onClick={closeEditor} type="button">
                Отмена
              </button>
              <button
                className={s.saveBtn}
                onClick={saveDraft}
                disabled={!draft.label.trim()}
                type="button"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import type { UndesiredTask } from '../types';
import s from './RoutineSettingsPage.module.css';

interface Props {
  onBack: () => void;
}

interface DraftValues {
  label: string;
}

export function UndesiredSettingsPage({ onBack }: Props) {
  const undesired = useStore((st) => st.undesired);
  const addUndesired = useStore((st) => st.addUndesired);
  const editUndesired = useStore((st) => st.editUndesired);
  const deleteUndesired = useStore((st) => st.deleteUndesired);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UndesiredTask | null>(null);
  const [draft, setDraft] = useState<DraftValues>({ label: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...undesired].sort((a, b) => a.label.localeCompare(b.label, 'ru')),
    [undesired],
  );

  const openAdd = () => {
    setEditTarget(null);
    setDraft({ label: '' });
    setEditorOpen(true);
  };

  const openEdit = (u: UndesiredTask) => {
    setEditTarget(u);
    setDraft({ label: u.label });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditTarget(null);
  };

  const saveDraft = () => {
    const label = draft.label.trim();
    if (!label) return;
    if (editTarget) {
      editUndesired(editTarget.id, { label });
    } else {
      addUndesired(label);
    }
    closeEditor();
  };

  const handleDelete = (id: string) => {
    deleteUndesired(id);
    setConfirmDelete(null);
  };

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} type="button" aria-label="Назад">
          ← Назад
        </button>
        <h1 className={s.title}>Нежелательное</h1>
        <button className={s.addBtn} onClick={openAdd} type="button">+ Добавить</button>
      </div>

      {sorted.length === 0 ? (
        <p className={s.emptyHint}>
          Список пуст. Добавьте задачу, отметка которой будет уменьшать множитель
          (например: «Переел»).
        </p>
      ) : (
        <ul className={s.list}>
          {sorted.map((u) => (
            <li key={u.id} className={s.item}>
              <div className={s.itemMain}>
                <p className={s.itemLabel}>{u.label}</p>
                <div className={s.badges}>
                  <span className={s.badge}>срывы подряд: {u.failStreak}</span>
                  <span className={s.badge}>чистая серия: {u.cleanStreak}</span>
                </div>
              </div>
              <div className={s.itemActions}>
                <button
                  className={s.iconBtn}
                  onClick={() => openEdit(u)}
                  type="button"
                  aria-label="Редактировать"
                >
                  ✏️
                </button>
                <button
                  className={`${s.iconBtn} ${s.danger}`}
                  onClick={() => setConfirmDelete(u.id)}
                  type="button"
                  aria-label="Удалить"
                >
                  🗑
                </button>
              </div>
              {confirmDelete === u.id && (
                <div className={s.confirmBox}>
                  <p className={s.confirmText}>Удалить «{u.label}»?</p>
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
                      onClick={() => handleDelete(u.id)}
                      type="button"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && closeEditor()}>
          <div className={s.sheet}>
            <div className={s.handle} />
            <p className={s.sheetTitle}>
              {editTarget ? 'Редактировать задачу' : 'Новая нежелательная задача'}
            </p>

            <label className={s.field}>
              <span className={s.fieldLabel}>Название</span>
              <input
                className={s.input}
                value={draft.label}
                onChange={(e) => setDraft({ label: e.target.value })}
                placeholder="Например: Переел"
                maxLength={60}
                autoFocus
              />
              <span className={s.hint}>
                За каждую отметку срыва множитель уменьшается на 0.05 ×
                (длина серии срывов), максимум −0.50.
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

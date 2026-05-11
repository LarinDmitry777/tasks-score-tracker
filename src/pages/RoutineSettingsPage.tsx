import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import type { RoutineItem, RoutineScheduleMode } from '../types';
import s from './RoutineSettingsPage.module.css';

interface Props {
  onBack: () => void;
}

interface DraftValues {
  label: string;
  intervalDays: number;
  mode: RoutineScheduleMode;
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function formatDueLabel(due: string, today: string): string {
  if (due <= today) return 'сегодня';
  const d = new Date(due + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function modeLabel(mode: RoutineScheduleMode): string {
  return mode === 'sinceLastDone' ? 'от выполнения' : 'по сетке';
}

function intervalLabel(n: number): string {
  if (n === 1) return 'каждый день';
  if (n === 7) return 'раз в неделю';
  return `раз в ${n} дн.`;
}

export function RoutineSettingsPage({ onBack }: Props) {
  const routine = useStore((st) => st.routine);
  const today = useStore((st) => st.today);
  const addRoutine = useStore((st) => st.addRoutine);
  const editRoutine = useStore((st) => st.editRoutine);
  const deleteRoutine = useStore((st) => st.deleteRoutine);
  const toggleRoutine = useStore((st) => st.toggleRoutine);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoutineItem | null>(null);
  const [draft, setDraft] = useState<DraftValues>({
    label: '',
    intervalDays: 1,
    mode: 'sinceLastDone',
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...routine].sort((a, b) => a.label.localeCompare(b.label, 'ru')),
    [routine],
  );

  const openAdd = () => {
    setEditTarget(null);
    setDraft({ label: '', intervalDays: 1, mode: 'sinceLastDone' });
    setEditorOpen(true);
  };

  const openEdit = (item: RoutineItem) => {
    setEditTarget(item);
    setDraft({ label: item.label, intervalDays: item.intervalDays, mode: item.mode });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditTarget(null);
  };

  const saveDraft = () => {
    const label = draft.label.trim();
    if (!label) return;
    const interval = Math.max(1, Math.floor(draft.intervalDays || 1));
    if (editTarget) {
      editRoutine(editTarget.id, { label, intervalDays: interval, mode: draft.mode });
    } else {
      addRoutine(label, interval, draft.mode);
    }
    closeEditor();
  };

  const handleDelete = (id: string) => {
    deleteRoutine(id);
    setConfirmDelete(null);
  };

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} type="button" aria-label="Назад">
          ← Назад
        </button>
        <h1 className={s.title}>Рутина</h1>
        <button className={s.addBtn} onClick={openAdd} type="button">+ Добавить</button>
      </div>

      {sorted.length === 0 ? (
        <p className={s.emptyHint}>Список пуст. Добавьте первое рутинное дело.</p>
      ) : (
        <ul className={s.list}>
          {sorted.map((item) => (
            <li key={item.id} className={s.item}>
              <div className={s.itemMain}>
                <p className={s.itemLabel}>{item.label}</p>
                <div className={s.badges}>
                  <span className={s.badge}>{intervalLabel(item.intervalDays)}</span>
                  <span className={s.badge}>{modeLabel(item.mode)}</span>
                  <span className={`${s.badge} ${s.dueBadge}`}>
                    след.: {formatDueLabel(item.dueDate, today)}
                  </span>
                  {item.done && (
                    <span className={`${s.badge} ${s.doneBadge}`}>✓ сегодня</span>
                  )}
                </div>
              </div>
              <div className={s.itemActions}>
                {item.done && (
                  <button
                    className={s.iconBtn}
                    onClick={() => toggleRoutine(item.id)}
                    type="button"
                    aria-label="Вернуть на главный экран"
                    title="Вернуть на главный экран"
                  >
                    ↩
                  </button>
                )}
                <button
                  className={s.iconBtn}
                  onClick={() => openEdit(item)}
                  type="button"
                  aria-label="Редактировать"
                >
                  ✏️
                </button>
                <button
                  className={`${s.iconBtn} ${s.danger}`}
                  onClick={() => setConfirmDelete(item.id)}
                  type="button"
                  aria-label="Удалить"
                >
                  🗑
                </button>
              </div>
              {confirmDelete === item.id && (
                <div className={s.confirmBox}>
                  <p className={s.confirmText}>Удалить «{item.label}»?</p>
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
                      onClick={() => handleDelete(item.id)}
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
              {editTarget ? 'Редактировать дело' : 'Новое рутинное дело'}
            </p>

            <label className={s.field}>
              <span className={s.fieldLabel}>Название</span>
              <input
                className={s.input}
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Например: Зарядка"
                maxLength={60}
                autoFocus
              />
            </label>

            <label className={s.field}>
              <span className={s.fieldLabel}>Частота (раз в N дней)</span>
              <input
                className={s.input}
                type="number"
                min={1}
                max={365}
                value={draft.intervalDays}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, intervalDays: Number(e.target.value) || 1 }))
                }
              />
              <span className={s.hint}>
                {intervalLabel(Math.max(1, Math.floor(draft.intervalDays || 1)))}
              </span>
            </label>

            <div className={s.field}>
              <span className={s.fieldLabel}>Режим расписания</span>
              <div className={s.modeOptions}>
                <button
                  type="button"
                  className={`${s.modeBtn} ${draft.mode === 'sinceLastDone' ? s.modeActive : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, mode: 'sinceLastDone' }))}
                >
                  <span className={s.modeTitle}>От последнего выполнения</span>
                  <span className={s.modeDesc}>
                    Следующее появление = дата выполнения + N дней
                  </span>
                </button>
                <button
                  type="button"
                  className={`${s.modeBtn} ${draft.mode === 'fixedGrid' ? s.modeActive : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, mode: 'fixedGrid' }))}
                >
                  <span className={s.modeTitle}>По фиксированной сетке</span>
                  <span className={s.modeDesc}>
                    Каждые N дней от даты создания, независимо от выполнения
                  </span>
                </button>
              </div>
            </div>

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

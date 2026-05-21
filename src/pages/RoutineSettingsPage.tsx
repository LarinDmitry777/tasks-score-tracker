import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { RoutineItem, RoutineKind, RoutineScheduleMode } from '../types';
import s from './RoutineSettingsPage.module.css';

interface Props {
  onBack: () => void;
}

interface DraftValues {
  label: string;
  intervalDays: string;
  mode: RoutineScheduleMode;
  kind: RoutineKind;
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
  const routine = useStore((st) => st.routine).filter((r) => !r.archivedAt);
  const today = useStore((st) => st.today);
  const addRoutine = useStore((st) => st.addRoutine);
  const editRoutine = useStore((st) => st.editRoutine);
  const deleteRoutine = useStore((st) => st.deleteRoutine);
  const toggleRoutine = useStore((st) => st.toggleRoutine);
  const skipRoutineToday = useStore((st) => st.skipRoutineToday);
  const unskipRoutineToday = useStore((st) => st.unskipRoutineToday);
  const moveRoutine = useStore((st) => st.moveRoutine);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoutineItem | null>(null);
  const [draft, setDraft] = useState<DraftValues>({
    label: '',
    intervalDays: '1',
    mode: 'sinceLastDone',
    kind: 'mandatory',
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => {
    setEditTarget(null);
    setDraft({ label: '', intervalDays: '1', mode: 'sinceLastDone', kind: 'mandatory' });
    setEditorOpen(true);
  };

  const openEdit = (item: RoutineItem) => {
    setEditTarget(item);
    setDraft({
      label: item.label,
      intervalDays: String(item.intervalDays),
      mode: item.mode,
      kind: item.kind,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditTarget(null);
  };

  const saveDraft = () => {
    const label = draft.label.trim();
    if (!label) return;
    const interval = Math.max(1, Math.floor(Number(draft.intervalDays) || 1));
    if (editTarget) {
      editRoutine(editTarget.id, { label, intervalDays: interval, mode: draft.mode, kind: draft.kind });
    } else {
      addRoutine(label, interval, draft.mode, draft.kind);
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

      {routine.length === 0 ? (
        <p className={s.emptyHint}>Список пуст. Добавьте первое рутинное дело.</p>
      ) : (
        <ul className={s.list}>
          {routine.map((item, idx) => {
            const skippedToday = item.skippedOnDate === today;
            const dueToday = item.dueDate <= today;
            const onMain = dueToday && !item.done && !skippedToday;
            return (
            <li key={item.id} className={s.item}>
              <div className={s.itemMain}>
                <p className={s.itemLabel}>
                  {item.label}
                  <span className={`${s.kindBadge} ${item.kind === 'optional' ? s.optional : s.mandatory}`}>
                    {item.kind === 'optional' ? 'опц.' : 'обяз.'}
                  </span>
                </p>
                <div className={s.badges}>
                  <span className={s.badge}>{intervalLabel(item.intervalDays)}</span>
                  <span className={s.badge}>{modeLabel(item.mode)}</span>
                  <span className={`${s.badge} ${s.dueBadge}`}>
                    след.: {formatDueLabel(item.dueDate, today)}
                  </span>
                  {item.done && (
                    <span className={`${s.badge} ${s.doneBadge}`}>✓ сегодня</span>
                  )}
                  {skippedToday && (
                    <span className={`${s.badge} ${s.skipBadge}`}>⊘ не сегодня</span>
                  )}
                </div>
                {onMain && (
                  <button
                    className={s.skipBtn}
                    onClick={() => skipRoutineToday(item.id)}
                    type="button"
                  >
                    ⊘ Не сегодня
                  </button>
                )}
              </div>
              <div className={s.itemActions}>
                <button
                  className={s.iconBtn}
                  onClick={() => moveRoutine(item.id, 'up')}
                  type="button"
                  aria-label="Переместить выше"
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  className={s.iconBtn}
                  onClick={() => moveRoutine(item.id, 'down')}
                  type="button"
                  aria-label="Переместить ниже"
                  disabled={idx === routine.length - 1}
                >
                  ↓
                </button>
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
                {skippedToday && (
                  <button
                    className={s.iconBtn}
                    onClick={() => unskipRoutineToday(item.id)}
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
            );
          })}
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

            <div className={s.field}>
              <span className={s.fieldLabel}>Тип</span>
              <div className={s.modeOptions}>
                <button
                  type="button"
                  className={`${s.modeBtn} ${draft.kind === 'mandatory' ? s.modeActive : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, kind: 'mandatory' }))}
                >
                  <span className={s.modeTitle}>Обязательная</span>
                  <span className={s.modeDesc}>Всегда учитывается в статистике дня</span>
                </button>
                <button
                  type="button"
                  className={`${s.modeBtn} ${draft.kind === 'optional' ? s.modeActive : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, kind: 'optional' }))}
                >
                  <span className={s.modeTitle}>Опциональная</span>
                  <span className={s.modeDesc}>Можно отменить свайпом — не учитывается в статистике</span>
                </button>
              </div>
            </div>

            <label className={s.field}>
              <span className={s.fieldLabel}>Частота (раз в N дней)</span>
              <input
                className={s.input}
                type="number"
                min={1}
                max={365}
                value={draft.intervalDays}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, intervalDays: e.target.value }))
                }
              />
              <span className={s.hint}>
                {intervalLabel(Math.max(1, Math.floor(Number(draft.intervalDays) || 1)))}
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

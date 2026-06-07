import { useEffect } from 'react';
import type { CalendarTarget } from '../../store/useStore';
import type { Habit, UndesiredTask } from '../../types';
import s from './CalendarTargetSheet.module.css';

interface CalendarTargetSheetProps {
  open: boolean;
  habits: Habit[];
  undesired: UndesiredTask[];
  current: CalendarTarget;
  onPick: (target: NonNullable<CalendarTarget>) => void;
  onClose: () => void;
}

interface Section {
  title: string;
  kind: 'habit' | 'undesired';
  items: { id: string; label: string }[];
}

export function CalendarTargetSheet({
  open,
  habits,
  undesired,
  current,
  onPick,
  onClose,
}: CalendarTargetSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const allSections: Section[] = [
    {
      title: 'Привычки',
      kind: 'habit',
      items: habits.filter((h) => !h.archivedAt).map((h) => ({ id: h.id, label: h.label })),
    },
    {
      title: 'Срывы',
      kind: 'undesired',
      items: undesired.filter((u) => !u.archivedAt).map((u) => ({ id: u.id, label: u.label })),
    },
    {
      title: 'Архив · привычки',
      kind: 'habit',
      items: habits.filter((h) => h.archivedAt).map((h) => ({ id: h.id, label: h.label })),
    },
    {
      title: 'Архив · срывы',
      kind: 'undesired',
      items: undesired.filter((u) => u.archivedAt).map((u) => ({ id: u.id, label: u.label })),
    },
  ];
  const sections = allSections.filter((sec) => sec.items.length > 0);

  const hasHabits = habits.some((h) => !h.archivedAt);
  const hasUndesired = undesired.some((u) => !u.archivedAt);

  return (
    <div
      className={s.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={s.sheet}>
        <div className={s.handle} />
        <p className={s.title}>Выберите привычку или срыв</p>
        {sections.length === 0 ? (
          <div className={s.empty}>
            Сначала создайте привычку или нежелательное действие в Настройках.
          </div>
        ) : (
          <div className={s.scroll}>
            {hasHabits && (
              <div className={s.section}>
                <div className={s.sectionTitle}>Привычки</div>
                <button
                  type="button"
                  className={`${s.row} ${s.rowAll} ${current?.kind === 'all-habits' ? s.rowSelected : ''}`}
                  onClick={() => { onPick({ kind: 'all-habits' }); onClose(); }}
                >
                  <span className={s.rowLabel}>Все привычки</span>
                  {current?.kind === 'all-habits' && <span className={s.check}>✓</span>}
                </button>
                {habits.filter((h) => !h.archivedAt).map((h) => {
                  const selected = current?.kind === 'habit' && current.id === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      className={`${s.row} ${selected ? s.rowSelected : ''}`}
                      onClick={() => { onPick({ kind: 'habit', id: h.id }); onClose(); }}
                    >
                      <span className={s.rowLabel}>{h.label}</span>
                      {selected && <span className={s.check}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {hasUndesired && (
              <div className={s.section}>
                <div className={s.sectionTitle}>Срывы</div>
                <button
                  type="button"
                  className={`${s.row} ${s.rowAll} ${current?.kind === 'all-undesired' ? s.rowSelected : ''}`}
                  onClick={() => { onPick({ kind: 'all-undesired' }); onClose(); }}
                >
                  <span className={s.rowLabel}>Все срывы</span>
                  {current?.kind === 'all-undesired' && <span className={s.check}>✓</span>}
                </button>
                {undesired.filter((u) => !u.archivedAt).map((u) => {
                  const selected = current?.kind === 'undesired' && current.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`${s.row} ${selected ? s.rowSelected : ''}`}
                      onClick={() => { onPick({ kind: 'undesired', id: u.id }); onClose(); }}
                    >
                      <span className={s.rowLabel}>{u.label}</span>
                      {selected && <span className={s.check}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {sections.filter((sec) => sec.title.startsWith('Архив')).map((sec) => (
              <div key={`${sec.title}-${sec.kind}`} className={s.section}>
                <div className={s.sectionTitle}>{sec.title}</div>
                {sec.items.map((it) => {
                  const selected =
                    (current?.kind === 'habit' || current?.kind === 'undesired') &&
                    current.kind === sec.kind && current.id === it.id;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      className={`${s.row} ${selected ? s.rowSelected : ''}`}
                      onClick={() => { onPick({ kind: sec.kind, id: it.id }); onClose(); }}
                    >
                      <span className={s.rowLabel}>{it.label}</span>
                      {selected && <span className={s.check}>✓</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <button className={s.closeBtn} onClick={onClose} type="button">
          Закрыть
        </button>
      </div>
    </div>
  );
}

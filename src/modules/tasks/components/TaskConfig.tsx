import { useState } from 'react';
import type { Schedule, Task, TaskDraft, TimeOfDay } from '../model.ts';
import { TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER } from '../model.ts';
import { pluralDays } from '../describe.ts';
import type { DayKey } from '../../../core/time.ts';

type ScheduleKind = Schedule['kind'];

const KIND_LABELS: Record<ScheduleKind, string> = {
  daily: 'Каждый день',
  everyNDays: 'Раз в N дней',
  weekdays: 'По дням недели',
};

const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // соответствуют подписям выше

interface Props {
  today: DayKey;
  /** Существующая задача для редактирования; отсутствует — создание. */
  task?: Task;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TaskConfig({ today, task, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(task?.timeOfDay ?? 'morning');
  const [kind, setKind] = useState<ScheduleKind>(task?.schedule.kind ?? 'daily');

  const [n, setN] = useState(
    task?.schedule.kind === 'everyNDays' ? task.schedule.n : 3,
  );
  const [anchor, setAnchor] = useState<'calendar' | 'completion'>(
    task?.schedule.kind === 'everyNDays' ? task.schedule.anchor : 'completion',
  );
  const [days, setDays] = useState<number[]>(
    task?.schedule.kind === 'weekdays' ? task.schedule.days : [1, 3, 5],
  );
  const [startDay, setStartDay] = useState<DayKey>(task?.startDay ?? today);

  const canSave = title.trim().length > 0 && !(kind === 'weekdays' && days.length === 0);

  function buildSchedule(): Schedule {
    if (kind === 'daily') return { kind: 'daily' };
    if (kind === 'weekdays') return { kind: 'weekdays', days };
    return { kind: 'everyNDays', n: Math.max(1, n), anchor };
  }

  function handleSave() {
    if (!canSave) return;
    onSave({ title, timeOfDay, schedule: buildSchedule(), startDay });
  }

  function toggleDay(value: number) {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    );
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" />
        <h2 className="sheet__title">{task ? 'Настройка задачи' : 'Новая задача'}</h2>

        <div className="field">
          <label className="field__label">Название</label>
          <input
            className="text-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, помыть лоток"
            autoFocus={!task}
          />
        </div>

        <div className="field">
          <label className="field__label">Время суток</label>
          <div className="segmented">
            {TIME_OF_DAY_ORDER.map((t) => (
              <button
                key={t}
                className={
                  'segmented__btn' + (timeOfDay === t ? ' segmented__btn--active' : '')
                }
                onClick={() => setTimeOfDay(t)}
              >
                {TIME_OF_DAY_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label">Периодичность</label>
          <div className="segmented">
            {(Object.keys(KIND_LABELS) as ScheduleKind[]).map((k) => (
              <button
                key={k}
                className={'segmented__btn' + (kind === k ? ' segmented__btn--active' : '')}
                onClick={() => setKind(k)}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {kind === 'everyNDays' && (
          <div className="field">
            <div className="inline-row">
              <span>Раз в</span>
              <div className="step-input">
                <button onClick={() => setN((v) => Math.max(1, v - 1))} aria-label="Меньше">
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={n}
                  onChange={(e) => setN(Math.max(1, Number(e.target.value) || 1))}
                />
                <button onClick={() => setN((v) => v + 1)} aria-label="Больше">
                  +
                </button>
              </div>
              <span>{pluralDays(n)}</span>
            </div>

            <label className="field__label" style={{ marginTop: 16 }}>
              Отсчёт
            </label>
            <div className="segmented">
              <button
                className={
                  'segmented__btn' + (anchor === 'completion' ? ' segmented__btn--active' : '')
                }
                onClick={() => setAnchor('completion')}
              >
                От выполнения
              </button>
              <button
                className={
                  'segmented__btn' + (anchor === 'calendar' ? ' segmented__btn--active' : '')
                }
                onClick={() => setAnchor('calendar')}
              >
                По календарю
              </button>
            </div>
            <p className="field__hint">
              {anchor === 'completion'
                ? 'Следующее появление — через N дней после того, как отметишь выполнение.'
                : 'Появляется строго по графику от даты старта, даже если пропустил.'}
            </p>
          </div>
        )}

        {kind === 'weekdays' && (
          <div className="field">
            <div className="weekday-chips">
              {WEEKDAY_SHORT.map((label, i) => {
                const value = WEEKDAY_VALUES[i];
                return (
                  <button
                    key={value}
                    className={
                      'weekday-chip' + (days.includes(value) ? ' weekday-chip--active' : '')
                    }
                    onClick={() => toggleDay(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(kind === 'weekdays' ||
          (kind === 'everyNDays' && anchor === 'calendar')) && (
          <div className="field">
            <label className="field__label">Дата старта</label>
            <input
              className="date-input"
              type="date"
              value={startDay}
              onChange={(e) => setStartDay(e.target.value || today)}
            />
          </div>
        )}

        <div className="sheet__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={!canSave}>
            {task ? 'Сохранить' : 'Создать'}
          </button>
        </div>

        {task && onDelete && (
          <button className="btn--danger" onClick={onDelete}>
            Удалить задачу
          </button>
        )}
      </div>
    </div>
  );
}

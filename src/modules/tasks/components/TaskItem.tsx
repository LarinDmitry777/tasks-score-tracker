import type { TaskView } from '../useTasksView.ts';
import { describeSchedule } from '../describe.ts';

interface Props {
  view: TaskView;
  onToggle: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  onEdit: () => void;
}

export function TaskItem({ view, onToggle, onSkip, onUnskip, onEdit }: Props) {
  const { task, status, overdue } = view;
  const done = status === 'done';
  const skipped = status === 'skipped';
  const muted = done || skipped;

  return (
    <div
      className={
        'task-item' +
        (done ? ' task-item--done' : '') +
        (skipped ? ' task-item--skipped' : '') +
        (overdue && !muted ? ' task-item--overdue' : '')
      }
      onClick={skipped ? onUnskip : onToggle}
      role="button"
      aria-pressed={done}
    >
      <span className="task-check" aria-hidden>
        {skipped ? (
          <span className="task-check__skip">↷</span>
        ) : (
          <svg viewBox="0 0 24 24">
            <polyline points="4 12 10 18 20 6" />
          </svg>
        )}
      </span>

      <span className="task-body">
        <span className="task-title">{task.title}</span>
        <span className={'task-meta' + (overdue && !muted ? ' task-meta--overdue' : '')}>
          {skipped
            ? 'Отложено · вернётся завтра'
            : (overdue && !done ? 'Просрочено · ' : '') + describeSchedule(task.schedule)}
        </span>
      </span>

      {status === 'pending' && (
        <button
          className="task-later"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          aria-label="Отложить на завтра"
        >
          Позже
        </button>
      )}

      <button
        className="task-edit"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label="Настроить задачу"
      >
        ⋯
      </button>
    </div>
  );
}

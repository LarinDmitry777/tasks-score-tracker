import type { DayKey } from '../../../core/time.ts';
import type { Task } from '../model.ts';
import { CATEGORY_LABELS, useAllTasksView } from '../useTasksView.ts';
import { describeSchedule } from '../describe.ts';

interface Props {
  today: DayKey;
  onEdit: (task: Task) => void;
}

export function AllTasksList({ today, onEdit }: Props) {
  const groups = useAllTasksView(today);

  if (groups.length === 0) {
    return (
      <div className="tasks-empty">
        <p>Задач пока нет.</p>
        <p style={{ marginTop: 8, fontSize: 14 }}>Нажми «+», чтобы добавить.</p>
      </div>
    );
  }

  return (
    <div className="tasks-groups">
      {groups.map((group) => (
        <section key={group.category}>
          <div className="tasks-group__head">
            <h2 className="tasks-group__title">{CATEGORY_LABELS[group.category]}</h2>
            <span className="tasks-group__count">{group.tasks.length}</span>
          </div>
          <div className="tasks-list">
            {group.tasks.map(({ task, activeToday, nextLabel }) => (
              <button key={task.id} className="task-row" onClick={() => onEdit(task)}>
                <span
                  className={'task-row__dot' + (activeToday ? ' task-row__dot--active' : '')}
                  aria-hidden
                />
                <span className="task-row__body">
                  <span className="task-row__title">{task.title}</span>
                  <span className="task-row__next">
                    {describeSchedule(task.schedule)} · {nextLabel}
                  </span>
                </span>
                <span className="task-row__chevron" aria-hidden>
                  ›
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

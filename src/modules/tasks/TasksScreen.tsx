import { useState } from 'react';
import './tasks.css';
import './config.css';
import { useToday } from '../../core/useToday.ts';
import { useTasks } from './store.ts';
import { useTasksView } from './useTasksView.ts';
import { TIME_OF_DAY_LABELS } from './model.ts';
import type { Task, TaskDraft } from './model.ts';
import { TaskItem } from './components/TaskItem.tsx';
import { TaskConfig } from './components/TaskConfig.tsx';
import { AllTasksList } from './components/AllTasksList.tsx';

type Editor = { mode: 'create' } | { mode: 'edit'; task: Task } | null;
type Tab = 'today' | 'all';

export function TasksScreen() {
  const today = useToday();
  const groups = useTasksView(today);
  const { addTask, updateTask, removeTask, complete, uncomplete, skip, unskip } =
    useTasks();
  const [editor, setEditor] = useState<Editor>(null);
  const [tab, setTab] = useState<Tab>('today');

  const totalVisible = groups.reduce((sum, g) => sum + g.tasks.length, 0);

  function handleSave(draft: TaskDraft) {
    if (editor?.mode === 'edit') {
      updateTask(editor.task.id, draft);
    } else {
      addTask(draft, today);
    }
    setEditor(null);
  }

  function handleDelete() {
    if (editor?.mode === 'edit') removeTask(editor.task.id);
    setEditor(null);
  }

  return (
    <>
      <div className="tasks-tabs" role="tablist">
        <button
          className={'tasks-tab' + (tab === 'today' ? ' tasks-tab--active' : '')}
          onClick={() => setTab('today')}
          role="tab"
          aria-selected={tab === 'today'}
        >
          Сегодня
        </button>
        <button
          className={'tasks-tab' + (tab === 'all' ? ' tasks-tab--active' : '')}
          onClick={() => setTab('all')}
          role="tab"
          aria-selected={tab === 'all'}
        >
          Все
        </button>
      </div>

      {tab === 'all' ? (
        <AllTasksList
          today={today}
          onEdit={(task) => setEditor({ mode: 'edit', task })}
        />
      ) : totalVisible === 0 ? (
        <div className="tasks-empty">
          <p>На сегодня задач нет.</p>
          <p style={{ marginTop: 8, fontSize: 14 }}>
            Нажми «+», чтобы добавить первую.
          </p>
        </div>
      ) : (
        <div className="tasks-groups">
          {groups.map((group) =>
            group.tasks.length === 0 ? null : (
              <section key={group.timeOfDay}>
                <div className="tasks-group__head">
                  <h2 className="tasks-group__title">
                    {TIME_OF_DAY_LABELS[group.timeOfDay]}
                  </h2>
                  <span className="tasks-group__count">
                    {group.tasks.filter((t) => t.status === 'done').length}/
                    {group.tasks.filter((t) => t.status !== 'skipped').length}
                  </span>
                </div>
                <div className="tasks-list">
                  {group.tasks.map((view) => (
                    <TaskItem
                      key={view.task.id}
                      view={view}
                      onToggle={() =>
                        view.status === 'done'
                          ? uncomplete(view.task.id)
                          : complete(view.task.id, today)
                      }
                      onSkip={() => skip(view.task.id, today)}
                      onUnskip={() => unskip(view.task.id)}
                      onEdit={() => setEditor({ mode: 'edit', task: view.task })}
                    />
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      <button
        className="fab"
        onClick={() => setEditor({ mode: 'create' })}
        aria-label="Добавить задачу"
      >
        +
      </button>

      {editor && (
        <TaskConfig
          today={today}
          task={editor.mode === 'edit' ? editor.task : undefined}
          onSave={handleSave}
          onDelete={editor.mode === 'edit' ? handleDelete : undefined}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}

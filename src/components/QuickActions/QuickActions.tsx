import { useCallback, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import type { TaskSize } from '../../types';
import { TASK_POINTS } from '../../types';
import s from './QuickActions.module.css';

const SIZES: TaskSize[] = ['S', 'M', 'L'];

export function QuickActions() {
  const tasks = useStore((st) => st.tasks);
  const addTask = useStore((st) => st.addTask);
  const undoLastTask = useStore((st) => st.undoLastTask);

  const [flashId, setFlashId] = useState<TaskSize | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdd = useCallback(
    (size: TaskSize) => {
      addTask(size);
      setFlashId(size);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlashId(null), 400);
    },
    [addTask],
  );

  const countOf = (size: TaskSize) => tasks.filter((t) => t.size === size).length;

  return (
    <section className={s.section}>
      <p className={s.sectionTitle}>Задачи</p>
      <div className={s.grid}>
        {SIZES.map((size) => (
          <button
            key={size}
            id={`task-btn-${size.toLowerCase()}`}
            className={`${s.taskBtn} ${flashId === size ? s.flash : ''}`}
            onClick={() => handleAdd(size)}
            type="button"
          >
            <span className={`${s.taskSize} ${s[`size${size}`]}`}>{size}</span>
            <span className={s.taskPts}>+{TASK_POINTS[size]}</span>
            <span className={s.taskCount}>{countOf(size)}×</span>
          </button>
        ))}
      </div>

      <div className={s.undoRow}>
        <div className={s.taskLog}>
          {tasks.map((t) => (
            <span key={t.id} className={`${s.logDot} ${s[t.size]}`} title={t.size} />
          ))}
        </div>
        <button
          id="undo-task-btn"
          className={s.undoBtn}
          onClick={undoLastTask}
          disabled={tasks.length === 0}
          type="button"
        >
          ↩ Отмена
        </button>
      </div>
    </section>
  );
}

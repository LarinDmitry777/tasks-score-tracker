/**
 * Состояние модуля задач (Zustand + persist в localStorage).
 *
 * Храним только текущее состояние задач, без истории выполнений.
 * Для возможности снять галочку в течение дня держим предыдущее значение
 * lastCompletedDay (prevCompletedDay) — этого достаточно для отката, не
 * заводя полноценную историю.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskDraft } from './model.ts';
import type { DayKey } from '../../core/time.ts';

interface TasksState {
  tasks: Task[];
  /** Откатное значение lastCompletedDay на случай снятия галочки. */
  prevCompletedDay: Record<string, DayKey | null>;

  addTask: (draft: TaskDraft, createdDay: DayKey) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  removeTask: (id: string) => void;
  /** Отметить задачу выполненной сегодня. */
  complete: (id: string, today: DayKey) => void;
  /** Снять отметку (откат к предыдущему состоянию). */
  uncomplete: (id: string) => void;
  /** Отложить задачу на сегодня — всплывёт снова на следующий день. */
  skip: (id: string, today: DayKey) => void;
  /** Вернуть отложенную задачу в сегодняшний список. */
  unskip: (id: string) => void;
}

function makeId(): string {
  return `t_${Math.random().toString(36).slice(2, 10)}`;
}

export const useTasks = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      prevCompletedDay: {},

      addTask: (draft, createdDay) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: makeId(),
              title: draft.title.trim(),
              timeOfDay: draft.timeOfDay,
              schedule: draft.schedule,
              createdDay,
              startDay: draft.startDay,
              lastCompletedDay: null,
              skippedDay: null,
            },
          ],
        })),

      updateTask: (id, draft) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  title: draft.title.trim(),
                  timeOfDay: draft.timeOfDay,
                  schedule: draft.schedule,
                  startDay: draft.startDay,
                  // Отложенность — решение «на сегодня»; после перенастройки
                  // задачи оно не должно продолжать её прятать.
                  skippedDay: null,
                }
              : t,
          ),
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          prevCompletedDay: omit(s.prevCompletedDay, id),
        })),

      complete: (id, today) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          // Отметкой «сегодня» закрываем текущий живой экземпляр — так же
          // поглощается и просроченное появление, дубли не возникают.
          return {
            prevCompletedDay: { ...s.prevCompletedDay, [id]: task.lastCompletedDay },
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, lastCompletedDay: today } : t,
            ),
          };
        }),

      uncomplete: (id) =>
        set((s) => {
          const prev = id in s.prevCompletedDay ? s.prevCompletedDay[id] : null;
          return {
            tasks: s.tasks.map((t) =>
              t.id === id ? { ...t, lastCompletedDay: prev } : t,
            ),
            prevCompletedDay: omit(s.prevCompletedDay, id),
          };
        }),

      skip: (id, today) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, skippedDay: today } : t)),
        })),

      unskip: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, skippedDay: null } : t)),
        })),
    }),
    { name: 'life:tasks' },
  ),
);

function omit<V>(obj: Record<string, V>, key: string): Record<string, V> {
  const rest: Record<string, V> = {};
  for (const k of Object.keys(obj)) {
    if (k !== key) rest[k] = obj[k];
  }
  return rest;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayRecord, Habit, RoutineItem, TaskEntry, TaskSize } from '../types';
import { calcHabitBonus, calcTotalScore, getTodayDate, getYesterdayDate } from '../utils/score';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

interface StoreState {
  today: string;
  tasks: TaskEntry[];
  routine: RoutineItem[];
  habits: Habit[];
  history: DayRecord[];

  // Task actions
  addTask: (size: TaskSize) => void;
  undoLastTask: () => void;

  // Routine actions
  toggleRoutine: (id: string) => void;
  addRoutine: (label: string) => void;
  editRoutine: (id: string, label: string) => void;
  deleteRoutine: (id: string) => void;

  // Habit actions
  toggleHabit: (id: string) => void;
  addHabit: (label: string) => void;
  editHabit: (id: string, label: string) => void;
  deleteHabit: (id: string) => void;

  // Internal: daily reset
  checkDailyReset: () => void;

  // Data transfer
  exportState: () => void;
  importState: (json: string) => { ok: boolean; error?: string };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      today: getTodayDate(),
      tasks: [],
      routine: [],
      habits: [],
      history: [],

      addTask: (size) => {
        const entry: TaskEntry = { id: uid(), size, timestamp: Date.now() };
        set((s) => ({ tasks: [...s.tasks, entry] }));
      },

      undoLastTask: () => {
        set((s) => ({ tasks: s.tasks.slice(0, -1) }));
      },

      toggleRoutine: (id) => {
        set((s) => {
          const target = s.routine.find((r) => r.id === id);
          if (!target) return s;
          const updated = { ...target, done: !target.done };
          const others = s.routine.filter((r) => r.id !== id);
          const doneItems = others.filter((r) => r.done);
          const undoneItems = others.filter((r) => !r.done);
          // Done items stay at the top in completion order; the toggled item
          // sits at the boundary so its index matches its bonus tier.
          return { routine: [...doneItems, updated, ...undoneItems] };
        });
      },

      addRoutine: (label) => {
        const item: RoutineItem = { id: uid(), label, done: false };
        set((s) => ({ routine: [...s.routine, item] }));
      },

      editRoutine: (id, label) => {
        set((s) => ({
          routine: s.routine.map((r) => (r.id === id ? { ...r, label } : r)),
        }));
      },

      deleteRoutine: (id) => {
        set((s) => ({ routine: s.routine.filter((r) => r.id !== id) }));
      },

      toggleHabit: (id) => {
        const today = getTodayDate();
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            if (h.doneToday) {
              // untoggle: revert streak
              return { ...h, doneToday: false, streak: Math.max(0, h.streak - 1), lastDoneDate: null };
            } else {
              const newStreak = h.streak + 1;
              return { ...h, doneToday: true, streak: newStreak, lastDoneDate: today };
            }
          }),
        }));
      },

      addHabit: (label) => {
        const habit: Habit = {
          id: uid(),
          label,
          streak: 0,
          lastDoneDate: null,
          doneToday: false,
        };
        set((s) => ({ habits: [...s.habits, habit] }));
      },

      editHabit: (id, label) => {
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, label } : h)),
        }));
      },

      deleteHabit: (id) => {
        set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      },

      checkDailyReset: () => {
        const { today, tasks, routine, habits, history } = get();
        const currentDate = getTodayDate();
        if (today === currentDate) return;

        // Save yesterday's record
        const { basePoints, routineMultiplier, habitMultiplier, totalMultiplier, totalScore } =
          calcTotalScore(tasks, routine, habits);

        const record: DayRecord = {
          date: today,
          tasks,
          routineDoneCount: routine.filter((r) => r.done).length,
          habits: habits.map((h) => ({
            id: h.id,
            label: h.label,
            streak: h.streak,
            bonus: h.doneToday ? calcHabitBonus(h.streak) : 0,
          })),
          basePoints,
          routineMultiplier,
          habitMultiplier,
          totalMultiplier,
          totalScore,
        };

        const yesterday = getYesterdayDate();

        // Reset habits: if not done yesterday → reset streak
        const resetHabits = habits.map((h) => {
          if (h.doneToday && h.lastDoneDate === yesterday) {
            // streak continues (already incremented on toggle)
            return { ...h, doneToday: false };
          }
          // missed day → reset streak
          return { ...h, doneToday: false, streak: 0, lastDoneDate: null };
        });

        set({
          today: currentDate,
          tasks: [],
          routine: routine.map((r) => ({ ...r, done: false })),
          habits: resetHabits,
          history: [record, ...history],
        });
      },

      exportState: () => {
        const { today, tasks, routine, habits, history } = get();
        const payload = JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), today, tasks, routine, habits, history },
          null,
          2,
        );
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scoreflow-backup-${today}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importState: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (!data || typeof data !== 'object') throw new Error('Неверный формат файла');
          if (data.version !== 1) throw new Error('Неподдерживаемая версия backup');

          const { today, tasks, routine, habits, history } = data;
          if (!today || !Array.isArray(tasks) || !Array.isArray(routine)
            || !Array.isArray(habits) || !Array.isArray(history)) {
            throw new Error('Данные повреждены или неполны');
          }

          set({ today, tasks, routine, habits, history });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Ошибка импорта' };
        }
      },
    }),
    {
      name: 'scoreflow-store',
    },
  ),
);

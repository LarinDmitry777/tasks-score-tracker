import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DayRecord, Habit, RoutineItem, RoutineScheduleMode, TaskEntry, TaskSize } from '../types';
import { calcHabitBonus, calcTotalScore, getTodayDate } from '../utils/score';
import { computeNextDueDate, createRoutine } from '../utils/routine';
import { addDays, mondayOf } from '../utils/week';

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
  addRoutine: (label: string, intervalDays: number, mode: RoutineScheduleMode) => void;
  editRoutine: (
    id: string,
    patch: { label?: string; intervalDays?: number; mode?: RoutineScheduleMode },
  ) => void;
  deleteRoutine: (id: string) => void;
  skipRoutineToday: (id: string) => void;
  unskipRoutineToday: (id: string) => void;

  // Habit actions
  toggleHabit: (id: string) => void;
  addHabit: (label: string, skipsAllowed: number) => void;
  editHabit: (id: string, patch: { label?: string; skipsAllowed?: number }) => void;
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
        const today = getTodayDate();
        set((s) => {
          const target = s.routine.find((r) => r.id === id);
          if (!target) return s;
          let updated: RoutineItem;
          if (target.done) {
            // Untoggle: restore previous dueDate so item stays visible today.
            updated = {
              ...target,
              done: false,
              dueDate: target.prevDueDate ?? today,
              prevDueDate: undefined,
            };
          } else {
            updated = {
              ...target,
              done: true,
              prevDueDate: target.dueDate,
              dueDate: computeNextDueDate(target, today),
            };
          }
          const others = s.routine.filter((r) => r.id !== id);
          const doneItems = others.filter((r) => r.done);
          const undoneItems = others.filter((r) => !r.done);
          return { routine: [...undoneItems, updated, ...doneItems] };
        });
      },

      addRoutine: (label, intervalDays, mode) => {
        const today = getTodayDate();
        const item = createRoutine(uid(), label, intervalDays, mode, today);
        set((s) => ({ routine: [...s.routine, item] }));
      },

      editRoutine: (id, patch) => {
        set((s) => ({
          routine: s.routine.map((r) => {
            if (r.id !== id) return r;
            const next: RoutineItem = { ...r };
            if (patch.label !== undefined) next.label = patch.label;
            if (patch.intervalDays !== undefined) {
              next.intervalDays = Math.max(1, Math.floor(patch.intervalDays));
            }
            if (patch.mode !== undefined) next.mode = patch.mode;
            return next;
          }),
        }));
      },

      deleteRoutine: (id) => {
        set((s) => ({ routine: s.routine.filter((r) => r.id !== id) }));
      },

      skipRoutineToday: (id) => {
        const today = getTodayDate();
        set((s) => ({
          routine: s.routine.map((r) =>
            r.id === id ? { ...r, skippedOnDate: today } : r,
          ),
        }));
      },

      unskipRoutineToday: (id) => {
        set((s) => ({
          routine: s.routine.map((r) =>
            r.id === id ? { ...r, skippedOnDate: undefined } : r,
          ),
        }));
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

      addHabit: (label, skipsAllowed) => {
        const today = getTodayDate();
        const habit: Habit = {
          id: uid(),
          label,
          streak: 0,
          lastDoneDate: null,
          doneToday: false,
          skipsAllowed: Math.max(0, Math.floor(skipsAllowed)),
          skipsUsed: 0,
          skipsWeekStart: mondayOf(today),
        };
        set((s) => ({ habits: [...s.habits, habit] }));
      },

      editHabit: (id, patch) => {
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h;
            const next: Habit = { ...h };
            if (patch.label !== undefined) next.label = patch.label;
            if (patch.skipsAllowed !== undefined) {
              next.skipsAllowed = Math.max(0, Math.floor(patch.skipsAllowed));
            }
            return next;
          }),
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

        const currentWeekStart = mondayOf(currentDate);

        const resetHabits = habits.map((h) => {
          let streak = h.streak;
          let skipsUsed = h.skipsUsed;
          let skipsWeekStart = h.skipsWeekStart || currentWeekStart;
          let lastDoneDate = h.lastDoneDate;

          // Anchor for counting missed days: the last day we know the habit
          // was either done or freshly reset.
          const lastEffectiveDone = h.doneToday ? today : h.lastDoneDate;

          if (lastEffectiveDone) {
            // Iterate strictly between lastEffectiveDone and currentDate.
            let cursor = addDays(lastEffectiveDone, 1);
            while (cursor < currentDate) {
              const week = mondayOf(cursor);
              if (skipsWeekStart !== week) {
                skipsWeekStart = week;
                skipsUsed = 0;
              }
              if (streak > 0 && skipsUsed < h.skipsAllowed) {
                skipsUsed += 1; // consume a skip; streak survives
              } else {
                streak = 0;
                lastDoneDate = null;
              }
              cursor = addDays(cursor, 1);
            }
          }

          // Ensure the week counter is fresh for the new current week.
          if (skipsWeekStart !== currentWeekStart) {
            skipsWeekStart = currentWeekStart;
            skipsUsed = 0;
          }

          return {
            ...h,
            doneToday: false,
            streak,
            lastDoneDate,
            skipsUsed,
            skipsWeekStart,
          };
        });

        set({
          today: currentDate,
          tasks: [],
          routine: routine.map((r) => ({
            ...r,
            done: false,
            prevDueDate: undefined,
            skippedOnDate: undefined,
          })),
          habits: resetHabits,
          history: [record, ...history],
        });
      },

      exportState: () => {
        const { today, tasks, routine, habits, history } = get();
        const payload = JSON.stringify(
          { version: 3, exportedAt: new Date().toISOString(), today, tasks, routine, habits, history },
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
          if (data.version !== 1 && data.version !== 2 && data.version !== 3) {
            throw new Error('Неподдерживаемая версия backup');
          }

          const { today, tasks, routine, habits, history } = data;
          if (!today || !Array.isArray(tasks) || !Array.isArray(routine)
            || !Array.isArray(habits) || !Array.isArray(history)) {
            throw new Error('Данные повреждены или неполны');
          }

          const migratedRoutine: RoutineItem[] = data.version === 1
            ? routine.map((r: { id: string; label: string; done: boolean }) => ({
                id: r.id,
                label: r.label,
                done: !!r.done,
                intervalDays: 1,
                mode: 'sinceLastDone' as RoutineScheduleMode,
                startDate: today,
                dueDate: today,
              }))
            : routine;

          const weekStart = mondayOf(today);
          const migratedHabits: Habit[] = data.version < 3
            ? habits.map((h: Partial<Habit> & { id: string; label: string }) => ({
                id: h.id,
                label: h.label,
                streak: h.streak ?? 0,
                lastDoneDate: h.lastDoneDate ?? null,
                doneToday: !!h.doneToday,
                skipsAllowed: 0,
                skipsUsed: 0,
                skipsWeekStart: weekStart,
              }))
            : habits;

          set({ today, tasks, routine: migratedRoutine, habits: migratedHabits, history });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Ошибка импорта' };
        }
      },
    }),
    {
      name: 'scoreflow-store',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as { today?: string; routine?: unknown[]; habits?: unknown[] };
        const today = state.today ?? getTodayDate();
        if (version < 2 && Array.isArray(state.routine)) {
          state.routine = state.routine.map((raw) => {
            const r = raw as Partial<RoutineItem> & { id: string; label: string; done?: boolean };
            return {
              id: r.id,
              label: r.label,
              done: !!r.done,
              intervalDays: r.intervalDays ?? 1,
              mode: r.mode ?? ('sinceLastDone' as RoutineScheduleMode),
              startDate: r.startDate ?? today,
              dueDate: r.dueDate ?? today,
            } satisfies RoutineItem;
          });
        }
        if (version < 3 && Array.isArray(state.habits)) {
          const weekStart = mondayOf(today);
          state.habits = state.habits.map((raw) => {
            const h = raw as Partial<Habit> & {
              id: string;
              label: string;
              streak?: number;
              lastDoneDate?: string | null;
              doneToday?: boolean;
            };
            return {
              id: h.id,
              label: h.label,
              streak: h.streak ?? 0,
              lastDoneDate: h.lastDoneDate ?? null,
              doneToday: !!h.doneToday,
              skipsAllowed: h.skipsAllowed ?? 0,
              skipsUsed: h.skipsUsed ?? 0,
              skipsWeekStart: h.skipsWeekStart ?? weekStart,
            } satisfies Habit;
          });
        }
        return state;
      },
    },
  ),
);

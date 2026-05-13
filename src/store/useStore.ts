import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DayRecord,
  Habit,
  RoutineItem,
  RoutineScheduleMode,
  TaskEntry,
  TaskSize,
  UndesiredTask,
} from '../types';
import { calcHabitBonus, calcTotalScore, calcUndesiredPenalty, getTodayDate } from '../utils/score';
import { computeNextDueDate, createRoutine } from '../utils/routine';
import { addDays, daysBetween, mondayOf } from '../utils/week';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

interface StoreState {
  today: string;
  tasks: TaskEntry[];
  routine: RoutineItem[];
  habits: Habit[];
  undesired: UndesiredTask[];
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

  // Undesired task actions
  toggleUndesired: (id: string) => void;
  addUndesired: (label: string) => void;
  editUndesired: (id: string, patch: { label?: string }) => void;
  deleteUndesired: (id: string) => void;

  // Manual day rollover
  endDay: () => void;

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
      undesired: [],
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

      toggleUndesired: (id) => {
        const today = getTodayDate();
        set((s) => ({
          undesired: s.undesired.map((u) => {
            if (u.id !== id) return u;
            if (u.markedToday) {
              return {
                ...u,
                markedToday: false,
                failStreak: Math.max(0, u.failStreak - 1),
                lastFailDate: null,
              };
            }
            return {
              ...u,
              markedToday: true,
              failStreak: u.failStreak + 1,
              cleanStreak: 0,
              lastFailDate: today,
            };
          }),
        }));
      },

      addUndesired: (label) => {
        const item: UndesiredTask = {
          id: uid(),
          label,
          failStreak: 0,
          cleanStreak: 0,
          lastFailDate: null,
          markedToday: false,
        };
        set((s) => ({ undesired: [...s.undesired, item] }));
      },

      editUndesired: (id, patch) => {
        set((s) => ({
          undesired: s.undesired.map((u) => {
            if (u.id !== id) return u;
            const next: UndesiredTask = { ...u };
            if (patch.label !== undefined) next.label = patch.label;
            return next;
          }),
        }));
      },

      deleteUndesired: (id) => {
        set((s) => ({ undesired: s.undesired.filter((u) => u.id !== id) }));
      },

      endDay: () => {
        const { today, tasks, routine, habits, undesired, history } = get();
        const currentDate = getTodayDate();
        if (today >= currentDate) return;

        // Save yesterday's record
        const {
          basePoints,
          routineMultiplier,
          habitMultiplier,
          undesiredPenalty,
          totalMultiplier,
          totalScore,
        } = calcTotalScore(tasks, routine, habits, undesired);

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
          undesired: undesired.map((u) => ({
            id: u.id,
            label: u.label,
            failStreak: u.failStreak,
            penalty: u.markedToday ? calcUndesiredPenalty(u.failStreak) : 0,
          })),
          basePoints,
          routineMultiplier,
          habitMultiplier,
          undesiredPenalty,
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

        const dayDiff = Math.max(1, daysBetween(today, currentDate));
        const resetUndesired: UndesiredTask[] = undesired.map((u) => {
          let failStreak = u.failStreak;
          let cleanStreak = u.cleanStreak;
          if (u.markedToday) {
            if (dayDiff === 1) {
              cleanStreak = 0;
            } else {
              failStreak = 0;
              cleanStreak = dayDiff - 1;
            }
          } else {
            failStreak = 0;
            cleanStreak += dayDiff;
          }
          return {
            ...u,
            failStreak,
            cleanStreak,
            markedToday: false,
            lastFailDate: u.markedToday ? today : u.lastFailDate,
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
          undesired: resetUndesired,
          history: [record, ...history],
        });
      },

      exportState: () => {
        const { today, tasks, routine, habits, undesired, history } = get();
        const payload = JSON.stringify(
          {
            version: 4,
            exportedAt: new Date().toISOString(),
            today,
            tasks,
            routine,
            habits,
            undesired,
            history,
          },
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
          if (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4) {
            throw new Error('Неподдерживаемая версия backup');
          }

          const { today, tasks, routine, habits, history } = data;
          if (!today || !Array.isArray(tasks) || !Array.isArray(routine)
            || !Array.isArray(habits) || !Array.isArray(history)) {
            throw new Error('Данные повреждены или неполны');
          }
          const undesired: UndesiredTask[] = data.version >= 4 && Array.isArray(data.undesired)
            ? data.undesired
            : [];

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

          const migratedHistory: DayRecord[] = data.version < 4
            ? history.map((raw: Partial<DayRecord>) => ({
                ...(raw as DayRecord),
                undesired: Array.isArray(raw.undesired) ? raw.undesired : [],
                undesiredPenalty: typeof raw.undesiredPenalty === 'number'
                  ? raw.undesiredPenalty
                  : 0,
              }))
            : history;

          set({
            today,
            tasks,
            routine: migratedRoutine,
            habits: migratedHabits,
            undesired,
            history: migratedHistory,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Ошибка импорта' };
        }
      },
    }),
    {
      name: 'scoreflow-store',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as {
          today?: string;
          routine?: unknown[];
          habits?: unknown[];
          undesired?: unknown[];
        };
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
        if (version < 4) {
          if (!Array.isArray(state.undesired)) state.undesired = [];
          const s2 = state as { history?: unknown[] };
          if (Array.isArray(s2.history)) {
            s2.history = s2.history.map((raw) => {
              const r = raw as Partial<DayRecord>;
              return {
                ...r,
                undesired: Array.isArray(r.undesired) ? r.undesired : [],
                undesiredPenalty: typeof r.undesiredPenalty === 'number' ? r.undesiredPenalty : 0,
              };
            });
          }
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

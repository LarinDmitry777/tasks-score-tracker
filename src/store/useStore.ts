import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DayRecord,
  Habit,
  RoutineItem,
  RoutineKind,
  RoutineScheduleMode,
  RoutineTimeOfDay,
  UndesiredTask,
} from '../types';
import { getTodayDate } from '../utils/week';
import { computeNextDueDate, createRoutine } from '../utils/routine';
import { addDays, daysBetween, mondayOf } from '../utils/week';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export type CalendarTarget = { kind: 'habit' | 'undesired'; id: string } | null;

interface StoreState {
  today: string;
  routine: RoutineItem[];
  habits: Habit[];
  undesired: UndesiredTask[];
  history: DayRecord[];
  calendarTarget: CalendarTarget;

  // Calendar actions
  setCalendarTarget: (target: CalendarTarget) => void;

  // Routine actions
  toggleRoutine: (id: string) => void;
  addRoutine: (label: string, intervalDays: number, mode: RoutineScheduleMode, kind: RoutineKind, timeOfDay: RoutineTimeOfDay) => void;
  editRoutine: (
    id: string,
    patch: { label?: string; intervalDays?: number; mode?: RoutineScheduleMode; kind?: RoutineKind; timeOfDay?: RoutineTimeOfDay },
  ) => void;
  deleteRoutine: (id: string) => void;
  skipRoutineToday: (id: string) => void;
  unskipRoutineToday: (id: string) => void;
  moveRoutine: (id: string, direction: 'up' | 'down') => void;

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
      routine: [],
      habits: [],
      undesired: [],
      history: [],
      calendarTarget: null,

      setCalendarTarget: (target) => set({ calendarTarget: target }),

      toggleRoutine: (id) => {
        set((s) => {
          const today = s.today;
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
          return { routine: s.routine.map((r) => (r.id === id ? updated : r)) };
        });
      },

      addRoutine: (label, intervalDays, mode, kind, timeOfDay) => {
        const today = getTodayDate();
        const item = createRoutine(uid(), label, intervalDays, mode, today, kind, timeOfDay);
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
            if (patch.kind !== undefined) next.kind = patch.kind;
            if (patch.timeOfDay !== undefined) next.timeOfDay = patch.timeOfDay;
            return next;
          }),
        }));
      },

      deleteRoutine: (id) => {
        const today = getTodayDate();
        set((s) => ({
          routine: s.routine.map((r) =>
            r.id === id
              ? { ...r, archivedAt: today, done: false, skippedOnDate: undefined }
              : r,
          ),
        }));
      },

      skipRoutineToday: (id) => {
        set((s) => ({
          routine: s.routine.map((r) =>
            r.id === id ? { ...r, skippedOnDate: s.today } : r,
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

      moveRoutine: (id, direction) => {
        set((s) => {
          const active = s.routine.filter((r) => !r.archivedAt);
          const localIdx = active.findIndex((r) => r.id === id);
          if (localIdx === -1) return s;
          const targetLocal = direction === 'up' ? localIdx - 1 : localIdx + 1;
          if (targetLocal < 0 || targetLocal >= active.length) return s;
          const neighborId = active[targetLocal].id;
          const next = s.routine.slice();
          const i1 = next.findIndex((r) => r.id === id);
          const i2 = next.findIndex((r) => r.id === neighborId);
          [next[i1], next[i2]] = [next[i2], next[i1]];
          return { routine: next };
        });
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
          createdAt: today,
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
        const today = getTodayDate();
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? { ...h, archivedAt: today, doneToday: false }
              : h,
          ),
        }));
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
        const today = getTodayDate();
        const item: UndesiredTask = {
          id: uid(),
          label,
          failStreak: 0,
          cleanStreak: 0,
          lastFailDate: null,
          markedToday: false,
          createdAt: today,
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
        const today = getTodayDate();
        set((s) => ({
          undesired: s.undesired.map((u) =>
            u.id === id
              ? { ...u, archivedAt: today, markedToday: false }
              : u,
          ),
        }));
      },

      endDay: () => {
        const { today, routine, habits, undesired, history } = get();
        const currentDate = getTodayDate();
        if (today >= currentDate) return;

        const activeHabits = habits.filter((h) => !h.archivedAt);
        const activeUndesired = undesired.filter((u) => !u.archivedAt);

        const record: DayRecord = {
          date: today,
          habitsDone: activeHabits.filter((h) => h.doneToday).length,
          habitsTotal: activeHabits.length,
          habits: activeHabits.map((h) => ({
            id: h.id,
            label: h.label,
            streak: h.streak,
            skipsAllowed: h.skipsAllowed,
            doneToday: h.doneToday,
          })),
          negativeFails: activeUndesired.filter((u) => u.markedToday).length,
          undesired: activeUndesired.map((u) => ({
            id: u.id,
            label: u.label,
            failStreak: u.failStreak,
            markedToday: u.markedToday,
          })),
        };

        const currentWeekStart = mondayOf(currentDate);

        const resetHabits = habits.map((h) => {
          if (h.archivedAt) return h;
          let streak = h.streak;
          let skipsUsed = h.skipsUsed;
          let skipsWeekStart = h.skipsWeekStart || currentWeekStart;
          let lastDoneDate = h.lastDoneDate;

          const lastEffectiveDone = h.doneToday ? today : h.lastDoneDate;

          if (lastEffectiveDone) {
            let cursor = addDays(lastEffectiveDone, 1);
            while (cursor < currentDate) {
              const week = mondayOf(cursor);
              if (skipsWeekStart !== week) {
                skipsWeekStart = week;
                skipsUsed = 0;
              }
              if (streak > 0 && skipsUsed < h.skipsAllowed) {
                skipsUsed += 1;
              } else {
                streak = 0;
                lastDoneDate = null;
              }
              cursor = addDays(cursor, 1);
            }
          }

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
          if (u.archivedAt) return u;
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
          routine: routine.map((r) =>
            r.archivedAt
              ? r
              : { ...r, done: false, prevDueDate: undefined, skippedOnDate: undefined },
          ),
          habits: resetHabits,
          undesired: resetUndesired,
          history: [record, ...history],
        });
      },

      exportState: () => {
        const { today, routine, habits, undesired, history, calendarTarget } = get();
        const payload = JSON.stringify(
          {
            version: 9,
            exportedAt: new Date().toISOString(),
            today,
            routine,
            habits,
            undesired,
            history,
            calendarTarget,
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
          if (![5, 6, 7, 8, 9].includes(data.version)) {
            throw new Error('Неподдерживаемая версия backup');
          }

          const { today, routine, habits, history } = data;
          if (!today || !Array.isArray(routine)
            || !Array.isArray(habits) || !Array.isArray(history)) {
            throw new Error('Данные повреждены или неполны');
          }
          const undesiredRaw: UndesiredTask[] = Array.isArray(data.undesired) ? data.undesired : [];

          // v5 → v6: проставить kind: 'mandatory' всем рутинам, очистить историю
          const migratedRoutine: RoutineItem[] = routine.map((r: Partial<RoutineItem> & { id: string; label: string }) => ({
            id: r.id,
            label: r.label,
            done: r.done ?? false,
            intervalDays: r.intervalDays ?? 1,
            mode: r.mode ?? ('sinceLastDone' as RoutineScheduleMode),
            kind: r.kind ?? ('mandatory' as RoutineKind),
            timeOfDay: r.timeOfDay ?? ('day' as RoutineTimeOfDay),
            startDate: r.startDate ?? today,
            dueDate: r.dueDate ?? today,
            createdAt: r.createdAt ?? today,
            prevDueDate: r.prevDueDate,
            skippedOnDate: r.skippedOnDate,
            archivedAt: r.archivedAt,
          }));

          const weekStart = mondayOf(today);
          const migratedHabits: Habit[] = habits.map((h: Partial<Habit> & { id: string; label: string }) => ({
            id: h.id,
            label: h.label,
            streak: h.streak ?? 0,
            lastDoneDate: h.lastDoneDate ?? null,
            doneToday: !!h.doneToday,
            skipsAllowed: h.skipsAllowed ?? 0,
            skipsUsed: h.skipsUsed ?? 0,
            skipsWeekStart: h.skipsWeekStart ?? weekStart,
            createdAt: h.createdAt ?? today,
          }));

          const migratedUndesired: UndesiredTask[] = undesiredRaw.map((u) => ({
            ...u,
            createdAt: u.createdAt ?? today,
          }));

          // Для v5/v6: история очищается (несовместимая структура)
          const rawHistory: DayRecord[] = data.version >= 7 ? history : [];
          const migratedHistory: DayRecord[] = rawHistory.map((rec) => {
            const { routine: _r, routineCompleted: _rc, routineTotal: _rt, ...rest } = rec as DayRecord & Record<string, unknown>;
            void _r; void _rc; void _rt;
            return rest as DayRecord;
          });

          const rawTarget = data.calendarTarget;
          const migratedCalendarTarget: CalendarTarget =
            rawTarget &&
            typeof rawTarget === 'object' &&
            (rawTarget.kind === 'habit' || rawTarget.kind === 'undesired') &&
            typeof rawTarget.id === 'string'
              ? { kind: rawTarget.kind, id: rawTarget.id }
              : null;

          set({
            today,
            routine: migratedRoutine,
            habits: migratedHabits,
            undesired: migratedUndesired,
            history: migratedHistory,
            calendarTarget: migratedCalendarTarget,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : 'Ошибка импорта' };
        }
      },
    }),
    {
      name: 'scoreflow-store',
      version: 9,
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as {
          today?: string;
          tasks?: unknown;
          routine?: unknown[];
          habits?: unknown[];
          undesired?: unknown[];
          history?: unknown[];
          calendarTarget?: unknown;
        };
        const today = state.today ?? getTodayDate();

        if (version < 6) {
          // Удаляем tasks
          delete state.tasks;

          // Проставляем kind: 'mandatory' всем рутинам
          if (Array.isArray(state.routine)) {
            state.routine = state.routine.map((raw) => {
              const r = raw as Partial<RoutineItem> & { id: string; label: string; done?: boolean };
              return {
                id: r.id,
                label: r.label,
                done: !!r.done,
                intervalDays: r.intervalDays ?? 1,
                mode: r.mode ?? ('sinceLastDone' as RoutineScheduleMode),
                kind: r.kind ?? ('mandatory' as RoutineKind),
                timeOfDay: r.timeOfDay ?? ('day' as RoutineTimeOfDay),
                startDate: r.startDate ?? today,
                dueDate: r.dueDate ?? today,
                createdAt: r.createdAt ?? today,
                prevDueDate: r.prevDueDate,
                skippedOnDate: r.skippedOnDate,
                archivedAt: r.archivedAt,
              } satisfies RoutineItem;
            });
          }

          // Очищаем историю (старый формат несовместим)
          state.history = [];

          if (!Array.isArray(state.undesired)) state.undesired = [];

          if (Array.isArray(state.habits)) {
            const weekStart = mondayOf(today);
            state.habits = state.habits.map((raw) => {
              const h = raw as Partial<Habit> & { id: string; label: string };
              return {
                id: h.id,
                label: h.label,
                streak: h.streak ?? 0,
                lastDoneDate: h.lastDoneDate ?? null,
                doneToday: !!h.doneToday,
                skipsAllowed: h.skipsAllowed ?? 0,
                skipsUsed: h.skipsUsed ?? 0,
                skipsWeekStart: h.skipsWeekStart ?? weekStart,
                createdAt: h.createdAt ?? today,
              } satisfies Habit;
            });
          }

          if (Array.isArray(state.undesired)) {
            state.undesired = state.undesired.map((raw) => {
              const u = raw as Partial<UndesiredTask> & { id: string; label: string };
              return {
                id: u.id,
                label: u.label,
                failStreak: u.failStreak ?? 0,
                cleanStreak: u.cleanStreak ?? 0,
                lastFailDate: u.lastFailDate ?? null,
                markedToday: !!u.markedToday,
                createdAt: u.createdAt ?? today,
              } satisfies UndesiredTask;
            });
          }
        }

        if (version < 7 && Array.isArray(state.routine)) {
          state.routine = state.routine.map((raw) => {
            const r = raw as Partial<RoutineItem> & { id: string; label: string; done?: boolean };
            return {
              id: r.id,
              label: r.label,
              done: r.done ?? false,
              intervalDays: r.intervalDays ?? 1,
              mode: r.mode ?? ('sinceLastDone' as RoutineScheduleMode),
              kind: r.kind ?? ('mandatory' as RoutineKind),
              timeOfDay: r.timeOfDay ?? ('day' as RoutineTimeOfDay),
              startDate: r.startDate ?? (state.today as string),
              dueDate: r.dueDate ?? (state.today as string),
              createdAt: r.createdAt ?? (state.today as string),
              prevDueDate: r.prevDueDate,
              skippedOnDate: r.skippedOnDate,
              archivedAt: r.archivedAt,
            } satisfies RoutineItem;
          });
        }

        if (version < 8 && Array.isArray(state.history)) {
          state.history = state.history.map((raw) => {
            const rec = raw as Record<string, unknown>;
            const { routine: _r, routineCompleted: _rc, routineTotal: _rt, ...rest } = rec;
            void _r; void _rc; void _rt;
            return rest;
          });
        }

        if (version < 9) {
          const t = state.calendarTarget;
          const valid =
            t &&
            typeof t === 'object' &&
            ((t as { kind?: unknown }).kind === 'habit' ||
              (t as { kind?: unknown }).kind === 'undesired') &&
            typeof (t as { id?: unknown }).id === 'string';
          state.calendarTarget = valid ? t : null;
        }

        return state;
      },
    },
  ),
);

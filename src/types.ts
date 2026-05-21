export type RoutineKind = 'mandatory' | 'optional';
export type RoutineScheduleMode = 'sinceLastDone' | 'fixedGrid';

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
  intervalDays: number;
  mode: RoutineScheduleMode;
  kind: RoutineKind;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD — next scheduled appearance
  prevDueDate?: string; // for same-day undo of toggle
  skippedOnDate?: string; // YYYY-MM-DD — hidden from main for this day only
  createdAt: string; // YYYY-MM-DD
  archivedAt?: string; // YYYY-MM-DD; presence = архивирована, исключается из UI
}

export interface Habit {
  id: string;
  label: string;
  streak: number;
  lastDoneDate: string | null; // ISO date "YYYY-MM-DD" or null
  doneToday: boolean;
  skipsAllowed: number; // allowed misses per calendar week (Mon-Sun)
  skipsUsed: number; // misses already used in skipsWeekStart's week
  skipsWeekStart: string; // YYYY-MM-DD — Monday of the tracked week
  createdAt: string;
  archivedAt?: string;
}

export interface HistoryHabit {
  id: string;
  label: string;
  streak: number;
  skipsAllowed: number;
  doneToday?: boolean;
}

export interface UndesiredTask {
  id: string;
  label: string;
  failStreak: number; // дней подряд с отметкой срыва
  cleanStreak: number; // дней подряд без срыва
  lastFailDate: string | null;
  markedToday: boolean;
  createdAt: string;
  archivedAt?: string;
}

export interface HistoryUndesired {
  id: string;
  label: string;
  failStreak: number;
  markedToday?: boolean;
}

export interface HistoryRoutine {
  id: string;
  label: string;
  done: boolean;
  skipped: boolean;
  intervalDays: number;
  mode: RoutineScheduleMode;
  kind: RoutineKind;
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD"
  routineCompleted: number; // done && не skipped
  routineTotal: number; // активных минус skipped на этот день
  routine: HistoryRoutine[];
  habitsDone: number;
  habitsTotal: number;
  habits: HistoryHabit[];
  negativeFails: number; // сколько негативных было markedToday
  undesired: HistoryUndesired[];
}

export type TabId = 'today' | 'history' | 'settings';

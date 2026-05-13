export type TaskSize = 'S' | 'M' | 'L';

export const TASK_POINTS: Record<TaskSize, number> = {
  S: 10,
  M: 30,
  L: 100,
};

export const ROUTINE_BONUSES = [0.15, 0.10, 0.07, 0.05, 0.02];

export const UNDESIRED_PENALTY_STEP = 0.05;
export const UNDESIRED_PENALTY_CAP = 0.50;

export interface TaskEntry {
  id: string;
  size: TaskSize;
  timestamp: number;
}

export type RoutineScheduleMode = 'sinceLastDone' | 'fixedGrid';

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
  intervalDays: number;
  mode: RoutineScheduleMode;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD — next scheduled appearance
  prevDueDate?: string; // for same-day undo of toggle
  skippedOnDate?: string; // YYYY-MM-DD — hidden from main for this day only
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
}

export interface HistoryHabit {
  id: string;
  label: string;
  streak: number;
  bonus: number;
}

export interface UndesiredTask {
  id: string;
  label: string;
  failStreak: number; // дней подряд с отметкой срыва
  cleanStreak: number; // дней подряд без срыва
  lastFailDate: string | null;
  markedToday: boolean;
}

export interface HistoryUndesired {
  id: string;
  label: string;
  failStreak: number;
  penalty: number; // положительное число — величина штрафа
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD"
  tasks: TaskEntry[];
  routineDoneCount: number;
  habits: HistoryHabit[];
  undesired: HistoryUndesired[];
  basePoints: number;
  routineMultiplier: number;
  habitMultiplier: number;
  undesiredPenalty: number;
  totalMultiplier: number;
  totalScore: number;
}

export type TabId = 'today' | 'history' | 'settings';

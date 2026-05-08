export type TaskSize = 'S' | 'M' | 'L';

export const TASK_POINTS: Record<TaskSize, number> = {
  S: 10,
  M: 30,
  L: 100,
};

export const ROUTINE_BONUSES = [0.15, 0.10, 0.07, 0.05, 0.02];

export interface TaskEntry {
  id: string;
  size: TaskSize;
  timestamp: number;
}

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Habit {
  id: string;
  label: string;
  streak: number;
  lastDoneDate: string | null; // ISO date "YYYY-MM-DD" or null
  doneToday: boolean;
}

export interface HistoryHabit {
  id: string;
  label: string;
  streak: number;
  bonus: number;
}

export interface DayRecord {
  date: string; // "YYYY-MM-DD"
  tasks: TaskEntry[];
  routineDoneCount: number;
  habits: HistoryHabit[];
  basePoints: number;
  routineMultiplier: number;
  habitMultiplier: number;
  totalMultiplier: number;
  totalScore: number;
}

export type TabId = 'today' | 'history' | 'settings';

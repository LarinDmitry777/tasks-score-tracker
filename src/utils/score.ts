import { ROUTINE_BONUSES, TASK_POINTS, UNDESIRED_PENALTY_CAP, UNDESIRED_PENALTY_STEP } from '../types';
import type { Habit, RoutineItem, TaskEntry, UndesiredTask } from '../types';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDate(): string {
  return formatLocalDate(new Date());
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

export function calcBasePoints(tasks: TaskEntry[]): number {
  return tasks.reduce((sum, t) => sum + TASK_POINTS[t.size], 0);
}

export function calcRoutineMultiplier(routine: RoutineItem[]): number {
  const doneCount = routine.filter((r) => r.done).length;
  let bonus = 0;
  for (let i = 0; i < doneCount; i++) {
    bonus += i < ROUTINE_BONUSES.length - 1
      ? ROUTINE_BONUSES[i]
      : ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1];
  }
  return Math.round(bonus * 100) / 100;
}

export function calcHabitBonus(streak: number): number {
  if (streak >= 11) return 0.20;
  if (streak >= 4) return 0.10;
  if (streak >= 1) return 0.05;
  return 0;
}

export function calcHabitMultiplier(habits: Habit[]): number {
  const bonus = habits
    .filter((h) => h.doneToday)
    .reduce((sum, h) => sum + calcHabitBonus(h.streak), 0);
  return Math.round(bonus * 100) / 100;
}

export function calcUndesiredPenalty(failStreak: number): number {
  if (failStreak <= 0) return 0;
  const raw = failStreak * UNDESIRED_PENALTY_STEP;
  return Math.round(Math.min(UNDESIRED_PENALTY_CAP, raw) * 100) / 100;
}

export function calcUndesiredMultiplier(items: UndesiredTask[]): number {
  const penalty = items
    .filter((u) => u.markedToday)
    .reduce((sum, u) => sum + calcUndesiredPenalty(u.failStreak), 0);
  return Math.round(penalty * 100) / 100;
}

export function calcTotalScore(
  tasks: TaskEntry[],
  routine: RoutineItem[],
  habits: Habit[],
  undesired: UndesiredTask[] = [],
): {
  basePoints: number;
  routineMultiplier: number;
  habitMultiplier: number;
  undesiredPenalty: number;
  totalMultiplier: number;
  totalScore: number;
} {
  const basePoints = calcBasePoints(tasks);
  const routineMultiplier = calcRoutineMultiplier(routine);
  const habitMultiplier = calcHabitMultiplier(habits);
  const undesiredPenalty = calcUndesiredMultiplier(undesired);
  const rawMultiplier = 1.0 + routineMultiplier + habitMultiplier - undesiredPenalty;
  const totalMultiplier = Math.max(0, Math.round(rawMultiplier * 100) / 100);
  const totalScore = Math.round(basePoints * totalMultiplier);
  return {
    basePoints,
    routineMultiplier,
    habitMultiplier,
    undesiredPenalty,
    totalMultiplier,
    totalScore,
  };
}

export function nextRoutineBonus(doneCount: number): number {
  const idx = doneCount;
  if (idx >= ROUTINE_BONUSES.length) return ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1];
  return ROUTINE_BONUSES[idx];
}

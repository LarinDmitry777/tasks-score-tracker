import { ROUTINE_BONUSES, TASK_POINTS } from '../types';
import type { Habit, RoutineItem, TaskEntry } from '../types';

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
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

export function calcTotalScore(
  tasks: TaskEntry[],
  routine: RoutineItem[],
  habits: Habit[],
): {
  basePoints: number;
  routineMultiplier: number;
  habitMultiplier: number;
  totalMultiplier: number;
  totalScore: number;
} {
  const basePoints = calcBasePoints(tasks);
  const routineMultiplier = calcRoutineMultiplier(routine);
  const habitMultiplier = calcHabitMultiplier(habits);
  const totalMultiplier = 1.0 + routineMultiplier + habitMultiplier;
  const totalScore = Math.round(basePoints * totalMultiplier);
  return { basePoints, routineMultiplier, habitMultiplier, totalMultiplier, totalScore };
}

export function nextRoutineBonus(doneCount: number): number {
  const idx = doneCount;
  if (idx >= ROUTINE_BONUSES.length) return ROUTINE_BONUSES[ROUTINE_BONUSES.length - 1];
  return ROUTINE_BONUSES[idx];
}

import type { RoutineItem, RoutineKind, RoutineScheduleMode } from '../types';
import { addDays, daysBetween } from './week';

export { addDays };

export function computeNextDueDate(
  item: Pick<RoutineItem, 'mode' | 'intervalDays' | 'startDate'>,
  completionDate: string,
): string {
  const interval = Math.max(1, Math.floor(item.intervalDays));
  if (item.mode === 'sinceLastDone') {
    return addDays(completionDate, interval);
  }
  // fixedGrid: first startDate + k*interval that is strictly > completionDate
  const diff = daysBetween(item.startDate, completionDate);
  const k = Math.floor(diff / interval) + 1;
  return addDays(item.startDate, k * interval);
}

export function isVisibleToday(item: RoutineItem, today: string): boolean {
  return item.dueDate <= today || item.done;
}

export function createRoutine(
  id: string,
  label: string,
  intervalDays: number,
  mode: RoutineScheduleMode,
  today: string,
  kind: RoutineKind = 'mandatory',
): RoutineItem {
  const interval = Math.max(1, Math.floor(intervalDays));
  return {
    id,
    label,
    done: false,
    intervalDays: interval,
    mode,
    kind,
    startDate: today,
    dueDate: today,
    createdAt: today,
  };
}

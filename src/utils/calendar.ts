import type { CalendarTarget } from '../store/useStore';
import type { DayRecord, Habit, UndesiredTask } from '../types';

export type DayStatus = 'done' | 'fail' | 'empty' | 'none';

export interface DayStatusContext {
  today: string;
  historyByDate: Map<string, DayRecord>;
  habits: Habit[];
  undesired: UndesiredTask[];
}

export function getDayStatus(
  date: string,
  target: NonNullable<CalendarTarget>,
  ctx: DayStatusContext,
): DayStatus {
  if (target.kind === 'all-habits') {
    if (date > ctx.today) return 'none';
    if (date === ctx.today) {
      const active = ctx.habits.filter((h) => !h.archivedAt);
      if (active.length === 0) return 'none';
      return active.every((h) => h.doneToday) ? 'done' : 'empty';
    }
    const rec = ctx.historyByDate.get(date);
    if (!rec || rec.habitsTotal === 0) return 'none';
    return rec.habitsDone === rec.habitsTotal ? 'done' : 'empty';
  }

  if (target.kind === 'all-undesired') {
    if (date > ctx.today) return 'none';
    if (date === ctx.today) {
      const active = ctx.undesired.filter((u) => !u.archivedAt);
      if (active.length === 0) return 'none';
      return active.some((u) => u.markedToday) ? 'fail' : 'empty';
    }
    const rec = ctx.historyByDate.get(date);
    if (!rec) return 'empty';
    return rec.undesired.some((u) => u.markedToday) ? 'fail' : 'empty';
  }

  if (target.kind === 'habit') {
    const habit = ctx.habits.find((h) => h.id === target.id);
    if (!habit) return 'none';
    if (date < habit.createdAt) return 'none';
    if (habit.archivedAt && date > habit.archivedAt) return 'none';
    if (date > ctx.today) return 'none';
    if (date === ctx.today) return habit.doneToday ? 'done' : 'empty';
    const rec = ctx.historyByDate.get(date);
    if (!rec) return 'none';
    const hh = rec.habits.find((h) => h.id === target.id);
    if (!hh) return 'none';
    return hh.doneToday ? 'done' : 'empty';
  }

  const item = ctx.undesired.find((u) => u.id === target.id);
  if (!item) return 'none';
  if (date < item.createdAt) return 'none';
  if (item.archivedAt && date > item.archivedAt) return 'none';
  if (date > ctx.today) return 'none';
  if (date === ctx.today) return item.markedToday ? 'fail' : 'empty';
  const rec = ctx.historyByDate.get(date);
  if (!rec) return 'empty';
  const uu = rec.undesired.find((u) => u.id === target.id);
  if (!uu) return 'empty';
  return uu.markedToday ? 'fail' : 'empty';
}

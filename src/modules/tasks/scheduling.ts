/**
 * Чистая логика расписания задач.
 *
 * Главный инвариант: в любой момент у задачи живёт РОВНО ОДИН экземпляр.
 * Мы никогда не храним очередь просроченных копий — вместо этого по
 * расписанию вычисляем «текущий срок» (`currentDueDay`) — самое позднее
 * запланированное появление, наступившее к сегодняшнему дню. Старое
 * невыполненное появление автоматически поглощается новым, поэтому две
 * одинаковые задачи одновременно возникнуть не могут.
 */

import {
  dayKeyToOrdinal,
  ordinalToDayKey,
  weekdayOfOrdinal,
  type DayKey,
} from '../../core/time.ts';
import type { Task } from './model.ts';

export type TaskStatus = 'pending' | 'done' | 'skipped' | 'inactive';

/**
 * День текущего живого экземпляра — самое позднее запланированное появление
 * ≤ today. null означает, что живого экземпляра сейчас нет: задача ещё не
 * стартовала, либо (для якоря completion) «отдыхает» после выполнения.
 */
export function getCurrentDueDay(task: Task, today: DayKey): DayKey | null {
  const ordToday = dayKeyToOrdinal(today);
  const ordStart = dayKeyToOrdinal(task.startDay);
  if (ordToday < ordStart) return null;

  const s = task.schedule;
  switch (s.kind) {
    case 'daily':
      return today;

    case 'everyNDays': {
      const n = Math.max(1, s.n);
      if (s.anchor === 'calendar') {
        const k = Math.floor((ordToday - ordStart) / n);
        return ordinalToDayKey(ordStart + k * n);
      }
      // anchor === 'completion'
      if (task.lastCompletedDay === null) return task.startDay;
      const nextDue = dayKeyToOrdinal(task.lastCompletedDay) + n;
      return ordToday >= nextDue ? ordinalToDayKey(nextDue) : null;
    }

    case 'weekdays': {
      if (s.days.length === 0) return null;
      // Ближайший подходящий день недели ≤ today находится в пределах 7 суток.
      for (let back = 0; back < 7; back++) {
        const ord = ordToday - back;
        if (ord < ordStart) break;
        if (s.days.includes(weekdayOfOrdinal(ord))) {
          return ordinalToDayKey(ord);
        }
      }
      return null;
    }
  }
}

/** Статус задачи на сегодня. */
export function getTaskStatus(task: Task, today: DayKey): TaskStatus {
  const dueDay = getCurrentDueDay(task, today);

  if (dueDay === null) {
    // Живого экземпляра нет. Но если выполнили сегодня — показываем как done.
    return task.lastCompletedDay === today ? 'done' : 'inactive';
  }

  const completedCurrent =
    task.lastCompletedDay !== null &&
    dayKeyToOrdinal(task.lastCompletedDay) >= dayKeyToOrdinal(dueDay);

  if (completedCurrent) {
    // Выполнено сегодня — висит до смены дня; выполнено раньше — отдыхает.
    return task.lastCompletedDay === today ? 'done' : 'inactive';
  }

  // Отложено на сегодня — прячем текущий экземпляр до следующего дня.
  if (task.skippedDay === today) return 'skipped';

  return 'pending';
}

/** Просрочена ли pending-задача (срок наступил раньше сегодня). */
export function isOverdue(task: Task, today: DayKey): boolean {
  const dueDay = getCurrentDueDay(task, today);
  if (dueDay === null) return false;
  return dayKeyToOrdinal(dueDay) < dayKeyToOrdinal(today);
}

/** Следующее появление задачи строго после сегодня (для подписей «снова через N»). */
export function getNextDueDay(task: Task, today: DayKey): DayKey | null {
  const ordToday = dayKeyToOrdinal(today);
  const ordStart = dayKeyToOrdinal(task.startDay);
  const s = task.schedule;

  switch (s.kind) {
    case 'daily':
      return ordinalToDayKey(Math.max(ordToday, ordStart) + 1);

    case 'everyNDays': {
      const n = Math.max(1, s.n);
      if (s.anchor === 'calendar') {
        if (ordToday < ordStart) return task.startDay;
        const k = Math.floor((ordToday - ordStart) / n) + 1;
        return ordinalToDayKey(ordStart + k * n);
      }
      if (task.lastCompletedDay === null) {
        return ordToday < ordStart ? task.startDay : ordinalToDayKey(ordToday + n);
      }
      return ordinalToDayKey(dayKeyToOrdinal(task.lastCompletedDay) + n);
    }

    case 'weekdays': {
      if (s.days.length === 0) return null;
      for (let fwd = 1; fwd <= 7; fwd++) {
        const ord = Math.max(ordToday, ordStart - 1) + fwd;
        if (s.days.includes(weekdayOfOrdinal(ord))) {
          return ordinalToDayKey(ord);
        }
      }
      return null;
    }
  }
}

/**
 * Модель данных модуля задач.
 */

import type { DayKey } from '../../core/time.ts';

/** Время суток, к которому относится задача. Порядок важен для сортировки. */
export type TimeOfDay = 'morning' | 'day' | 'evening';

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'day', 'evening'];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Утро',
  day: 'День',
  evening: 'Вечер',
};

/**
 * Расписание повторения задачи.
 *
 * - daily      — каждый логический день.
 * - weekdays   — по конкретным дням недели (0 — воскресенье … 6 — суббота).
 * - everyNDays — раз в N дней. Якорь определяет точку отсчёта:
 *     • 'calendar'   — от фиксированной даты старта (startDay + k·N);
 *     • 'completion' — от факта последнего выполнения (выполнил → +N дней).
 */
export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] }
  | { kind: 'everyNDays'; n: number; anchor: 'calendar' | 'completion' };

export interface Task {
  id: string;
  title: string;
  timeOfDay: TimeOfDay;
  schedule: Schedule;
  /** Логический день создания задачи. */
  createdDay: DayKey;
  /** Дата старта расписания (якорь для calendar / первое появление). */
  startDay: DayKey;
  /** Логический день последнего выполнения (null — ни разу). */
  lastCompletedDay: DayKey | null;
  /**
   * Логический день, на который задачу отложили («не сегодня»). Если равен
   * текущему дню — экземпляр спрятан и всплывёт снова на следующий день.
   * Расписание при этом не сдвигается.
   */
  skippedDay: DayKey | null;
}

/** Черновик задачи для конфигуратора (без вычисляемых/служебных полей). */
export interface TaskDraft {
  title: string;
  timeOfDay: TimeOfDay;
  schedule: Schedule;
  startDay: DayKey;
}

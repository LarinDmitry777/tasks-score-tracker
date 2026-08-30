/**
 * Производный вью-модель для экрана задач: активные задачи на сегодня,
 * сгруппированные по времени суток, с сортировкой «готовые — вниз».
 */

import { useTasks } from './store.ts';
import {
  getNextDueDay,
  getTaskStatus,
  isOverdue,
  type TaskStatus,
} from './scheduling.ts';
import {
  TIME_OF_DAY_ORDER,
  type Schedule,
  type Task,
  type TimeOfDay,
} from './model.ts';
import { diffDays, type DayKey } from '../../core/time.ts';
import { pluralDays } from './describe.ts';

export interface TaskView {
  task: Task;
  status: TaskStatus;
  overdue: boolean;
}

export interface TimeGroup {
  timeOfDay: TimeOfDay;
  tasks: TaskView[];
}

export function useTasksView(today: DayKey): TimeGroup[] {
  const tasks = useTasks((s) => s.tasks);

  const groups: TimeGroup[] = TIME_OF_DAY_ORDER.map((timeOfDay) => ({
    timeOfDay,
    tasks: [],
  }));
  const byTime = new Map(groups.map((g) => [g.timeOfDay, g]));

  for (const task of tasks) {
    const status = getTaskStatus(task, today);
    if (status === 'inactive') continue; // сегодня не показываем
    byTime.get(task.timeOfDay)?.tasks.push({
      task,
      status,
      overdue: isOverdue(task, today),
    });
  }

  for (const group of groups) {
    group.tasks.sort((a, b) => {
      // Порядок: активные → выполненные → отложенные (в самый низ).
      const rank = (v: TaskView) =>
        v.status === 'skipped' ? 2 : v.status === 'done' ? 1 : 0;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      // Среди активных — просроченные выше.
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return a.task.title.localeCompare(b.task.title, 'ru');
    });
  }

  return groups;
}

// ── Экран «Все задачи» ─────────────────────────────────────────

/** Категория периодичности для группировки на экране «Все». */
export type ScheduleCategory = 'daily' | 'weekdays' | 'everyNDays';

const CATEGORY_ORDER: ScheduleCategory[] = ['daily', 'weekdays', 'everyNDays'];

export const CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  daily: 'Каждый день',
  weekdays: 'По дням недели',
  everyNDays: 'Раз в несколько дней',
};

export interface AllTaskView {
  task: Task;
  /** Готово ли к выполнению сегодня (для акцента). */
  activeToday: boolean;
  /** Человекочитаемая подпись о ближайшем появлении. */
  nextLabel: string;
}

export interface CategoryGroup {
  category: ScheduleCategory;
  tasks: AllTaskView[];
}

function categoryOf(schedule: Schedule): ScheduleCategory {
  return schedule.kind;
}

/** Подпись «когда следующее появление» относительно сегодня. */
function nextAppearanceLabel(task: Task, today: DayKey): string {
  const status = getTaskStatus(task, today);
  if (status === 'pending') return 'Сегодня';
  if (status === 'done') return 'Сегодня · выполнено';
  if (status === 'skipped') return 'Отложено · завтра';

  const next = getNextDueDay(task, today);
  if (next === null) return 'Дни не выбраны';

  const inDays = diffDays(next, today);
  if (inDays <= 0) return 'Сегодня';
  if (inDays === 1) return 'Завтра';
  return `Через ${inDays} ${pluralDays(inDays)}`;
}

export function useAllTasksView(today: DayKey): CategoryGroup[] {
  const tasks = useTasks((s) => s.tasks);

  const groups: CategoryGroup[] = CATEGORY_ORDER.map((category) => ({
    category,
    tasks: [],
  }));
  const byCategory = new Map(groups.map((g) => [g.category, g]));

  for (const task of tasks) {
    byCategory.get(categoryOf(task.schedule))?.tasks.push({
      task,
      activeToday: getTaskStatus(task, today) === 'pending',
      nextLabel: nextAppearanceLabel(task, today),
    });
  }

  for (const group of groups) {
    group.tasks.sort((a, b) => a.task.title.localeCompare(b.task.title, 'ru'));
  }

  return groups.filter((g) => g.tasks.length > 0);
}

/** Количество невыполненных задач на сегодня — для сводки на дашборде. */
export function usePendingCount(today: DayKey): number {
  const tasks = useTasks((s) => s.tasks);
  let count = 0;
  for (const task of tasks) {
    if (getTaskStatus(task, today) === 'pending') count++;
  }
  return count;
}

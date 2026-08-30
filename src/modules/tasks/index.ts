/**
 * Манифест модуля «Трекер задач».
 */

import type { LifeModule, ModuleSummary } from '../../core/module.ts';
import { TasksScreen } from './TasksScreen.tsx';
import { usePendingCount } from './useTasksView.ts';
import { useToday } from '../../core/useToday.ts';

function useSummary(): ModuleSummary | null {
  const today = useToday();
  const pending = usePendingCount(today);
  return {
    value: String(pending),
    label: pending === 0 ? 'всё сделано' : 'осталось сегодня',
  };
}

export const tasksModule: LifeModule = {
  id: 'tasks',
  title: 'Задачи',
  description: 'Ежедневные дела по времени суток',
  icon: '✅',
  accent: '#a855f7',
  Screen: TasksScreen,
  useSummary,
};

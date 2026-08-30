/**
 * Реестр модулей приложения.
 *
 * Единственное место, где перечисляются все модули. Чтобы добавить новый
 * модуль, достаточно реализовать LifeModule и дописать его сюда.
 */

import type { LifeModule } from './module.ts';
import { tasksModule } from '../modules/tasks/index.ts';

export const modules: LifeModule[] = [tasksModule];

export function getModule(id: string): LifeModule | undefined {
  return modules.find((m) => m.id === id);
}

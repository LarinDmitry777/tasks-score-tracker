/**
 * Реестр модулей приложения.
 *
 * Единственное место, где перечисляются все модули. Чтобы добавить новый
 * модуль, достаточно реализовать LifeModule и дописать его сюда.
 */

import type { LifeModule } from './module.ts';
import { tasksModule } from '../modules/tasks/index.ts';

/**
 * Идентификаторы, зарезервированные оболочкой под системные экраны
 * (не модули). Роутер обрабатывает их до обращения к реестру, поэтому
 * модуль с таким id был бы недостижим — предупреждаем об этом на старте.
 */
export const RESERVED_IDS = ['settings'] as const;

export const modules: LifeModule[] = [tasksModule];

const clash = modules.find((m) => (RESERVED_IDS as readonly string[]).includes(m.id));
if (clash) {
  console.error(
    `Модуль "${clash.id}" использует зарезервированный оболочкой id и не будет доступен.`,
  );
}

export function getModule(id: string): LifeModule | undefined {
  return modules.find((m) => m.id === id);
}

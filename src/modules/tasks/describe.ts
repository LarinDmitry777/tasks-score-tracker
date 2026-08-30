/**
 * Человекочитаемые подписи для расписаний.
 */

import type { Schedule } from './model.ts';

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/** Склонение «день/дня/дней» для числительного. */
export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

export function describeSchedule(schedule: Schedule): string {
  switch (schedule.kind) {
    case 'daily':
      return 'Каждый день';
    case 'everyNDays': {
      const suffix = schedule.anchor === 'completion' ? ' после выполнения' : '';
      if (schedule.n === 1) return 'Каждый день';
      return `Раз в ${schedule.n} ${pluralDays(schedule.n)}${suffix}`;
    }
    case 'weekdays': {
      if (schedule.days.length === 0) return 'Дни не выбраны';
      if (schedule.days.length === 7) return 'Каждый день';
      const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => schedule.days.includes(d));
      return ordered.map((d) => WEEKDAY_SHORT[d]).join(', ');
    }
  }
}

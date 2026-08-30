/**
 * Работа с «логическим днём».
 *
 * У приложения свой день, который начинается не в полночь, а в заданный час
 * (по умолчанию 5:00). Всё, что происходит между 00:00 и dayStartHour,
 * относится к предыдущему логическому дню.
 *
 * Логический день представлен строкой-ключом формата `YYYY-MM-DD` — это
 * календарная дата «утра» логического дня. Для арифметики (интервалы, дни
 * недели) ключ переводится в порядковый номер дня (кол-во дней от эпохи).
 */

export type DayKey = string; // 'YYYY-MM-DD'

export const DEFAULT_DAY_START_HOUR = 5;

/** Ключ логического дня для указанного момента времени. */
export function getLogicalDayKey(now: Date, dayStartHour: number): DayKey {
  const shifted = new Date(now.getTime() - dayStartHour * 3_600_000);
  return toDayKey(shifted);
}

/** Формат локальной даты в ключ `YYYY-MM-DD`. */
export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Порядковый номер дня (дней от 1970-01-01) для ключа. */
export function dayKeyToOrdinal(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Обратное преобразование порядкового номера в ключ. */
export function ordinalToDayKey(ordinal: number): DayKey {
  const date = new Date(ordinal * 86_400_000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** День недели (0 — воскресенье … 6 — суббота, как у Date.getDay). */
export function weekdayOfOrdinal(ordinal: number): number {
  // 1970-01-01 — четверг (getDay === 4).
  return (((ordinal + 4) % 7) + 7) % 7;
}

/** Разница дней между двумя ключами (a - b). */
export function diffDays(a: DayKey, b: DayKey): number {
  return dayKeyToOrdinal(a) - dayKeyToOrdinal(b);
}

/** Человекочитаемая дата логического дня (например «суббота, 30 августа»). */
export function formatDayKey(key: DayKey, locale = 'ru-RU'): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Момент наступления следующего логического дня — для планирования пересчёта. */
export function nextDayStartAt(now: Date, dayStartHour: number): Date {
  const next = new Date(now);
  next.setHours(dayStartHour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

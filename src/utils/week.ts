function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDate(): string {
  return formatLocalDate(new Date());
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return formatLocalDate(d);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00').getTime();
  const b = new Date(to + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
] as const;

export const MONTH_NAMES_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
] as const;

// Monday-first weekday labels for calendar headers.
export const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

// 6×7 matrix of date strings ('YYYY-MM-DD') for the given month, Monday-first.
// Cells outside the month are null.
export function getMonthMatrix(year: number, month0: number): (string | null)[][] {
  const first = new Date(year, month0, 1);
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const firstDow = first.getDay(); // 0=Sun..6=Sat
  const leading = firstDow === 0 ? 6 : firstDow - 1;

  const matrix: (string | null)[][] = [];
  let dayNum = 1;
  for (let row = 0; row < 6; row++) {
    const week: (string | null)[] = [];
    for (let col = 0; col < 7; col++) {
      const cellIndex = row * 7 + col;
      if (cellIndex < leading || dayNum > lastDay) {
        week.push(null);
      } else {
        week.push(formatLocalDate(new Date(year, month0, dayNum)));
        dayNum++;
      }
    }
    matrix.push(week);
  }
  return matrix;
}

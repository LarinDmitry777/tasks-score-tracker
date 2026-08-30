/**
 * Хук текущего логического дня.
 *
 * Возвращает ключ логического дня и сам пере-рендерит потребителей в момент
 * наступления следующего дня (по умолчанию 5:00) — без опроса по таймеру
 * каждую секунду. Также обновляется при возвращении на вкладку, чтобы день
 * не «застревал» после того, как телефон был заблокирован.
 */

import { useEffect, useState } from 'react';
import { getLogicalDayKey, nextDayStartAt, type DayKey } from './time.ts';
import { useSettings } from './settings.ts';

export function useToday(): DayKey {
  const dayStartHour = useSettings((s) => s.dayStartHour);
  const [today, setToday] = useState<DayKey>(() =>
    getLogicalDayKey(new Date(), dayStartHour),
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const recompute = () => {
      const now = new Date();
      setToday(getLogicalDayKey(now, dayStartHour));
      const delay = nextDayStartAt(now, dayStartHour).getTime() - now.getTime();
      timer = setTimeout(recompute, delay + 1000);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') recompute();
    };

    recompute();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dayStartHour]);

  return today;
}

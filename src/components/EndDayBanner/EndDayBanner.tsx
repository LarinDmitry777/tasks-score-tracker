import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { getTodayDate } from '../../utils/week';
import s from './EndDayBanner.module.css';

export function EndDayBanner() {
  const storedToday = useStore((st) => st.today);
  const endDay = useStore((st) => st.endDay);
  const [currentDate, setCurrentDate] = useState(getTodayDate);

  useEffect(() => {
    const tick = () => setCurrentDate(getTodayDate());
    tick();
    const interval = setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (storedToday >= currentDate) return null;

  return (
    <div className={s.wrap}>
      <button type="button" className={s.button} onClick={endDay}>
        Завершить день
      </button>
      <p className={s.hint}>Наступил новый день — подведите итоги</p>
    </div>
  );
}

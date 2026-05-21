import { useState } from 'react';
import { EndDayBanner } from '../components/EndDayBanner/EndDayBanner';
import { HabitCards } from '../components/HabitCards/HabitCards';
import { Header } from '../components/Header/Header';
import { RoutineList } from '../components/RoutineList/RoutineList';
import { UndesiredList } from '../components/UndesiredList/UndesiredList';
import s from './Today.module.css';

type Mode = 'routines' | 'habits';

export function Today() {
  const [mode, setMode] = useState<Mode>('routines');

  return (
    <div>
      <EndDayBanner />
      <Header />

      <div className={s.switcher}>
        <button
          className={`${s.switchBtn} ${mode === 'routines' ? s.active : ''}`}
          onClick={() => setMode('routines')}
          type="button"
        >
          Рутины
        </button>
        <button
          className={`${s.switchBtn} ${mode === 'habits' ? s.active : ''}`}
          onClick={() => setMode('habits')}
          type="button"
        >
          Привычки
        </button>
      </div>

      {mode === 'routines' ? (
        <RoutineList />
      ) : (
        <>
          <HabitCards />
          <UndesiredList />
        </>
      )}
    </div>
  );
}

import { EndDayBanner } from '../components/EndDayBanner/EndDayBanner';
import { Header } from '../components/Header/Header';
import { HabitCards } from '../components/HabitCards/HabitCards';
import { QuickActions } from '../components/QuickActions/QuickActions';
import { RoutineList } from '../components/RoutineList/RoutineList';

export function Today() {
  return (
    <div>
      <EndDayBanner />
      <Header />
      <QuickActions />
      <RoutineList />
      <HabitCards />
    </div>
  );
}

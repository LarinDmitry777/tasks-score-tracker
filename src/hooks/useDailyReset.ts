import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useDailyReset() {
  const checkDailyReset = useStore((s) => s.checkDailyReset);

  useEffect(() => {
    checkDailyReset();

    // Check every minute
    const interval = setInterval(checkDailyReset, 60_000);
    return () => clearInterval(interval);
  }, [checkDailyReset]);
}

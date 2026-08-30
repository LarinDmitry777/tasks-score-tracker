/**
 * Глобальные настройки приложения (общие для всех модулей).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DAY_START_HOUR } from './time.ts';

export interface SettingsState {
  /** Час, в который начинается новый логический день (0–23). */
  dayStartHour: number;
  setDayStartHour: (hour: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      dayStartHour: DEFAULT_DAY_START_HOUR,
      setDayStartHour: (hour) =>
        set({ dayStartHour: Math.max(0, Math.min(23, Math.round(hour))) }),
    }),
    { name: 'life:settings' },
  ),
);

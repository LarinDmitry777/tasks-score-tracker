import { useSettings } from '../core/settings.ts';

export function SettingsScreen() {
  const dayStartHour = useSettings((s) => s.dayStartHour);
  const setDayStartHour = useSettings((s) => s.setDayStartHour);

  return (
    <div>
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Начало дня</div>
          <div className="settings-row__hint">
            В этот час список задач обновляется на новый день.
          </div>
        </div>
        <select
          className="date-input"
          style={{ width: 'auto' }}
          value={dayStartHour}
          onChange={(e) => setDayStartHour(Number(e.target.value))}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

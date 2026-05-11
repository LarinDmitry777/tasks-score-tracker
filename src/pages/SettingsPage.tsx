import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { HabitSettingsPage } from './HabitSettingsPage';
import { RoutineSettingsPage } from './RoutineSettingsPage';
import s from './SettingsPage.module.css';

type ToastState = { type: 'success' | 'error'; message: string } | null;

export function SettingsPage() {
  const exportState = useStore((st) => st.exportState);
  const importState = useStore((st) => st.importState);
  const history = useStore((st) => st.history);
  const habits = useStore((st) => st.habits);
  const routine = useStore((st) => st.routine);
  const today = useStore((st) => st.today);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [view, setView] = useState<'main' | 'routine' | 'habits'>('main');

  if (view === 'routine') {
    return <RoutineSettingsPage onBack={() => setView('main')} />;
  }
  if (view === 'habits') {
    return <HabitSettingsPage onBack={() => setView('main')} />;
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importState(text);
      if (result.ok) {
        showToast('success', '✓ Данные успешно импортированы');
      } else {
        showToast('error', `Ошибка: ${result.error}`);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleReset = () => {
    setShowConfirm(true);
  };

  const handleResetConfirm = () => {
    localStorage.removeItem('scoreflow-store');
    window.location.reload();
  };

  return (
    <div className={s.page}>
      <h1 className={s.title}>Настройки</h1>
      <p className={s.subtitle}>Управление данными</p>

      {/* Routine management */}
      <section className={s.section}>
        <p className={s.sectionTitle}>Рутина</p>
        <div className={s.card}>
          <p className={s.cardDesc}>
            Управление списком рутинных дел и настройка частоты их появления.
          </p>
          <button
            className={`${s.btn} ${s.btnExport}`}
            onClick={() => setView('routine')}
            type="button"
          >
            🧩 Управление рутиной
          </button>
        </div>
      </section>

      {/* Habit management */}
      <section className={s.section}>
        <p className={s.sectionTitle}>Привычки</p>
        <div className={s.card}>
          <p className={s.cardDesc}>
            Управление списком привычек и количеством допустимых пропусков в неделю.
          </p>
          <button
            className={`${s.btn} ${s.btnExport}`}
            onClick={() => setView('habits')}
            type="button"
          >
            🔥 Управление привычками
          </button>
        </div>
      </section>

      {/* Export / Import */}
      <section className={s.section}>
        <p className={s.sectionTitle}>Перенос данных</p>
        <div className={s.card}>
          <p className={s.cardDesc}>
            Экспортируй все данные в JSON-файл и импортируй их на другом устройстве.
          </p>

          <button
            id="export-btn"
            className={`${s.btn} ${s.btnExport}`}
            onClick={exportState}
            type="button"
          >
            ↑ Экспорт backup
          </button>

          <button
            id="import-btn"
            className={`${s.btn} ${s.btnImport}`}
            onClick={handleImportClick}
            type="button"
          >
            ↓ Импорт из файла
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {toast && (
            <div className={`${s.toast} ${s[toast.type]}`}>
              {toast.message}
            </div>
          )}
        </div>
      </section>

      {/* Stats summary */}
      <section className={s.section}>
        <p className={s.sectionTitle}>Статистика</p>
        <div className={s.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: '📅 Дней в истории', value: history.length },
              { label: '✅ Пунктов рутины', value: routine.length },
              { label: '🔥 Привычек', value: habits.length },
              {
                label: '🏆 Лучший день',
                value: history.length
                  ? `${Math.max(...history.map((d) => d.totalScore))} pts`
                  : '—',
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className={s.section}>
        <p className={s.sectionTitle}>Опасная зона</p>
        <div className={s.card}>
          {!showConfirm ? (
            <>
              <p className={s.cardDesc}>
                Полный сброс удалит всю историю, рутину, привычки и сегодняшние данные.
              </p>
              <button
                id="reset-btn"
                className={`${s.btn} ${s.btnDanger}`}
                onClick={handleReset}
                type="button"
              >
                🗑 Сбросить все данные
              </button>
            </>
          ) : (
            <div className={s.confirmBox}>
              <p className={s.confirmText}>Это действие нельзя отменить. Ты уверен?</p>
              <div className={s.confirmBtns}>
                <button
                  className={`${s.btn} ${s.btnImport}`}
                  onClick={() => setShowConfirm(false)}
                  type="button"
                >
                  Отмена
                </button>
                <button
                  className={`${s.btn} ${s.btnDanger}`}
                  onClick={handleResetConfirm}
                  type="button"
                >
                  Да, сбросить
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <p className={s.metaInfo}>ScoreFlow · данные за {today}</p>
    </div>
  );
}

import './App.css';
import { useRoute, navigate, goBack } from './core/navigation.ts';
import { getModule } from './core/registry.ts';
import { Dashboard } from './shell/Dashboard.tsx';
import { SettingsScreen } from './shell/SettingsScreen.tsx';

function App() {
  const route = useRoute();

  // Дашборд
  if (route.moduleId === null) {
    return (
      <Shell
        title="Моя жизнь"
        bare
        action={{ icon: '⚙', label: 'Настройки', onClick: () => navigate('settings') }}
      >
        <Dashboard />
      </Shell>
    );
  }

  // Настройки
  if (route.moduleId === 'settings') {
    return (
      <Shell title="Настройки" onBack={goBack}>
        <SettingsScreen />
      </Shell>
    );
  }

  // Модуль
  const module = getModule(route.moduleId);
  if (!module) {
    return (
      <Shell title="Не найдено" onBack={() => navigate()}>
        <p style={{ color: 'var(--text-muted)' }}>Такого модуля нет.</p>
      </Shell>
    );
  }

  const { Screen } = module;
  return (
    <Shell title={module.title} onBack={goBack}>
      <Screen />
    </Shell>
  );
}

interface ShellProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  /** Скрыть заголовок в шапке (для дашборда — свой заголовок в контенте). */
  bare?: boolean;
  action?: { icon: string; label: string; onClick: () => void };
}

function Shell({ title, children, onBack, bare, action }: ShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        {onBack && (
          <button className="app-header__back" onClick={onBack} aria-label="Назад">
            ‹
          </button>
        )}
        {!bare && <div className="app-header__title">{title}</div>}
        {bare && <div style={{ flex: 1 }} />}
        {action && (
          <button
            className="app-header__action"
            onClick={action.onClick}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        )}
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}

export default App;

import type { TabId } from '../../types';
import s from './TabBar.module.css';

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { id: 'today', icon: '⚡', label: 'Сегодня' },
  { id: 'history', icon: '📊', label: 'История' },
  { id: 'settings', icon: '⚙️', label: 'Настройки' },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className={s.tabBar}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          className={`${s.tab} ${active === tab.id ? s.active : ''}`}
          onClick={() => onChange(tab.id)}
          type="button"
          aria-label={tab.label}
        >
          <span className={s.tabIcon}>{tab.icon}</span>
          <span className={s.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

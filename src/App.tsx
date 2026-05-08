import { useState } from 'react';
import { TabBar } from './components/TabBar/TabBar';
import { useDailyReset } from './hooks/useDailyReset';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Today } from './pages/Today';
import type { TabId } from './types';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  useDailyReset();

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === 'today' && <Today />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;

import { useState } from 'react';
import { TabBar } from './components/TabBar/TabBar';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { Today } from './pages/Today';
import type { TabId } from './types';
import './App.css';

function App() {

  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === 'today' && <Today />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;

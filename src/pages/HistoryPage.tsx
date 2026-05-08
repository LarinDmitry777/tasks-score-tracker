import { History } from '../components/History/History';

export function HistoryPage() {
  return (
    <div>
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          История
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 4 }}>
          Итоги прошедших дней
        </p>
      </div>
      <History />
    </div>
  );
}

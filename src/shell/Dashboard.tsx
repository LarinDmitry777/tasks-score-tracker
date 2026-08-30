import { modules } from '../core/registry.ts';
import { navigate } from '../core/navigation.ts';
import type { LifeModule } from '../core/module.ts';

function formatToday(): string {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function Dashboard() {
  return (
    <div>
      <div className="dashboard__greeting">
        <div className="dashboard__date">{formatToday()}</div>
        <h1 className="dashboard__hello">Моя жизнь</h1>
      </div>

      <div className="module-grid">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: LifeModule }) {
  const summary = module.useSummary?.() ?? null;

  return (
    <button className="module-card" onClick={() => navigate(module.id)}>
      <span
        className="module-card__icon"
        style={{ background: `${module.accent}22`, color: module.accent }}
      >
        {module.icon}
      </span>
      <span className="module-card__title">{module.title}</span>
      <span className="module-card__desc">{module.description}</span>
      {summary && (
        <span className="module-card__summary">
          <span className="module-card__value" style={{ color: module.accent }}>
            {summary.value}
          </span>
          <span className="module-card__label">{summary.label}</span>
        </span>
      )}
    </button>
  );
}

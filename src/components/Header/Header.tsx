import { useStore } from '../../store/useStore';
import { calcTotalScore } from '../../utils/score';
import s from './Header.module.css';

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function Header() {
  const tasks = useStore((st) => st.tasks);
  const routine = useStore((st) => st.routine);
  const habits = useStore((st) => st.habits);
  const undesired = useStore((st) => st.undesired);
  const today = useStore((st) => st.today);

  const {
    basePoints,
    routineMultiplier,
    habitMultiplier,
    undesiredPenalty,
    totalMultiplier,
    totalScore,
  } = calcTotalScore(tasks, routine, habits, undesired);

  const multiplierParts: string[] = [];
  if (routineMultiplier > 0) multiplierParts.push(`рутина +${routineMultiplier.toFixed(2)}`);
  if (habitMultiplier > 0) multiplierParts.push(`привычки +${habitMultiplier.toFixed(2)}`);
  if (undesiredPenalty > 0) multiplierParts.push(`штраф −${undesiredPenalty.toFixed(2)}`);

  return (
    <header className={s.header}>
      <p className={s.date}>{formatDate(today)}</p>
      <div className={s.scoreWrap}>
        <span className={s.scoreLabel}>Score</span>
        <div className={s.score}>{totalScore}</div>
      </div>
      <div className={s.multiplierRow}>
        <div className={s.multiplierBadge}>
          ×{totalMultiplier.toFixed(2)}
        </div>
        {multiplierParts.length > 0 && (
          <span className={s.multiplierDetail}>{multiplierParts.join(' · ')}</span>
        )}
      </div>
      {basePoints > 0 && (
        <p className={s.basePoints}>
          база: <span>{basePoints} BP</span>
        </p>
      )}
    </header>
  );
}

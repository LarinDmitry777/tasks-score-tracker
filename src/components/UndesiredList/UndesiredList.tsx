import { useState } from 'react';
import { Modal } from '../Modal/Modal';
import { useStore } from '../../store/useStore';
import s from './UndesiredList.module.css';

function cleanLabel(days: number): string {
  if (days === 0) return 'Сегодня ещё чисто';
  if (days === 1) return '1 день без срыва';
  if (days >= 2 && days <= 4) return `${days} дня без срыва`;
  return `${days} дней без срыва`;
}

export function UndesiredList() {
  const undesired = useStore((st) => st.undesired).filter((u) => !u.archivedAt);
  const toggleUndesired = useStore((st) => st.toggleUndesired);

  const [pendingId, setPendingId] = useState<string | null>(null);

  if (undesired.length === 0) return null;

  const handleMarkClick = (id: string, markedToday: boolean) => {
    if (markedToday) {
      // Снятие отметки — без модалки
      toggleUndesired(id);
    } else {
      // Новая отметка — открываем модалку для заметки
      setPendingId(id);
    }
  };

  const handleNoteSave = (note: string) => {
    if (pendingId) toggleUndesired(pendingId, note);
    setPendingId(null);
  };

  const handleNoteClose = () => {
    // Отменить: не помечаем срыв
    setPendingId(null);
  };

  return (
    <>
      <section className={s.section}>
        <div className={s.sectionHeader}>
          <p className={s.sectionTitle}>Нежелательное</p>
        </div>

        <div className={s.cards}>
          {undesired.map((item) => (
            <div key={item.id} className={`${s.card} ${item.markedToday ? s.marked : ''}`}>
              <div className={s.cardTop}>
                <div className={`${s.streakBadge} ${item.markedToday ? s.danger : ''}`}>
                  <span className={s.streakIcon}>{item.markedToday ? '⚠️' : '✓'}</span>
                  <span className={s.streakNum}>
                    {item.markedToday ? item.failStreak : item.cleanStreak}
                  </span>
                  <span className={s.streakLabel}>дней</span>
                </div>

                <div className={s.cardInfo}>
                  <div className={s.cardLabel}>{item.label}</div>
                  <div className={s.cardMeta}>
                    {item.markedToday && item.todayNote ? (
                      <span className={s.notePreview}>{item.todayNote}</span>
                    ) : (
                      <span className={s.hint}>
                        {item.markedToday
                          ? `срыв ${item.failStreak}-й день подряд`
                          : cleanLabel(item.cleanStreak)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                className={`${s.markBtn} ${item.markedToday ? s.active : ''}`}
                onClick={() => handleMarkClick(item.id, item.markedToday)}
                type="button"
              >
                {item.markedToday ? '✗ Отмечен срыв' : 'Отметить срыв'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={pendingId !== null}
        title="Причина срыва"
        placeholder="Что произошло? (необязательно)"
        saveLabel="Отметить срыв"
        allowEmpty
        onSave={handleNoteSave}
        onClose={handleNoteClose}
      />
    </>
  );
}

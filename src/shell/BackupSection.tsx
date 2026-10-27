import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useToday } from '../core/useToday.ts';
import {
  applyBackup,
  backupFileName,
  buildBackup,
  loadSafetySnapshot,
  parseBackup,
  restoreSafetySnapshot,
  serializeBackup,
  type BackupFile,
} from '../core/backup.ts';

interface PendingImport {
  fileName: string;
  backup: BackupFile;
}

/** Момент снимка для кнопки отката: «27.10 14:32». */
function formatMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BackupSection() {
  const today = useToday();
  const inputRef = useRef<HTMLInputElement>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  // Страховка от неверного или битого файла: появляется после импорта и
  // позволяет вернуть состояние, которое импорт затёр.
  const [safety] = useState(() => loadSafetySnapshot());
  // Защита от гонки асинхронных чтений: пока читается файл, пользователь может
  // выбрать другой — результат более старого чтения не должен затирать новый выбор.
  const importSeq = useRef(0);

  const canShareFiles = useMemo(() => {
    if (typeof navigator.share !== 'function') return false;
    const probe = new File(['{}'], 'probe.json', { type: 'application/json' });
    return navigator.canShare?.({ files: [probe] }) ?? false;
  }, []);

  const fileName = backupFileName(today);

  // Файл собирается синхронно внутри обработчика клика: Web Share работает только
  // в пределах user activation, и любой await до share() лишает Safari этой фазы.
  const makeFile = () =>
    new File([serializeBackup(buildBackup())], fileName, { type: 'application/json' });

  const handleDownload = () => {
    setExportError(null);
    const file = makeFile();
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Отложенный revoke: синхронный обрывает скачивание в Safari.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleShare = () => {
    setExportError(null);
    const file = makeFile();
    navigator.share({ files: [file], title: file.name }).catch((err: unknown) => {
      // Пользователь закрыл лист «Поделиться» — это не ошибка.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setExportError('Не удалось поделиться файлом.');
    });
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Сбрасываем значение сразу: иначе повторный выбор того же файла не вызовет change.
    input.value = '';
    if (!file) return;

    setImportError(null);
    setPending(null);

    const seq = ++importSeq.current;

    let text: string;
    try {
      text = await file.text();
    } catch {
      if (seq === importSeq.current) setImportError('Не удалось прочитать файл.');
      return;
    }
    if (seq !== importSeq.current) return;

    const result = parseBackup(text);
    if (result.ok) setPending({ fileName: file.name, backup: result.backup });
    else setImportError(result.error);
  };

  const handleRestore = () => {
    setImportError(null);
    const error = restoreSafetySnapshot();
    if (error) setImportError(error);
  };

  return (
    <div>
      <div className="settings-row settings-row--column">
        <div>
          <div className="settings-row__label">Экспорт состояния</div>
          <div className="settings-row__hint">
            Файл со всеми данными приложения: задачи, настройки и будущие модули.
          </div>
          <div className="settings-row__hint">{fileName}</div>
        </div>
        <div className="backup-actions">
          {canShareFiles && (
            <button className="btn btn--ghost" onClick={handleShare}>
              Поделиться
            </button>
          )}
          <button className="btn btn--primary" onClick={handleDownload}>
            Скачать
          </button>
        </div>
        {exportError && <div className="backup-status--error">{exportError}</div>}
      </div>

      <div className="section-gap" />

      <div className="settings-row settings-row--column">
        <div>
          <div className="settings-row__label">Импорт состояния</div>
          <div className="settings-row__hint">Выберите файл резервной копии (.json).</div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="backup-hidden-input"
          onChange={handleFile}
        />

        <div className="backup-actions">
          <button className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
            Выбрать файл
          </button>
        </div>

        {importError && <div className="backup-status--error">{importError}</div>}

        {pending && (
          <div className="backup-confirm">
            <div className="backup-confirm__file">{pending.fileName}</div>
            <div className="backup-confirm__warning">
              Текущее состояние будет полностью заменено содержимым файла. Приложение
              перезагрузится.
            </div>
            <div className="backup-actions">
              <button className="btn btn--ghost" onClick={() => setPending(null)}>
                Отмена
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  const error = applyBackup(pending.backup);
                  if (error) setImportError(error);
                }}
              >
                Импортировать
              </button>
            </div>
          </div>
        )}

        {safety && (
          <div className="backup-actions">
            <button className="btn btn--ghost" onClick={handleRestore}>
              ↩ Восстановить предыдущее состояние (от {formatMoment(safety.savedAt)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Резервная копия состояния приложения — для переноса между устройствами.
 *
 * Всё состояние живёт в localStorage под ключами с префиксом `life:` (контракт
 * модулей, см. CLAUDE.md), поэтому бэкап = снимок всех таких ключей. Модули
 * хранят там конверт Zustand persist `{state, version}` — он и переносится как
 * есть, чтобы будущий `migrate` увидел исходную версию формата.
 */

import type { DayKey } from './time.ts';

export const LIFE_PREFIX = 'life:';
export const BACKUP_APP_ID = 'life-aggregator';
export const BACKUP_KIND = 'life-backup';
export const BACKUP_FORMAT_VERSION = 1;

/** Конверт, который Zustand persist кладёт в localStorage. */
export interface PersistEnvelope {
  state: Record<string, unknown>;
  version?: number;
}

export interface BackupFile {
  app: string;
  kind: string;
  formatVersion: number;
  exportedAt: string;
  /** Ключ `life:*` -> конверт persist. */
  entries: Record<string, PersistEnvelope>;
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  /** Сообщение об ошибке, готовое к показу пользователю. */
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Проверка конверта persist. Используется и при экспорте, и при импорте —
 * поэтому файл, собранный `buildBackup`, всегда проходит `parseBackup`.
 */
function isPersistEnvelope(value: unknown): value is PersistEnvelope {
  if (!isRecord(value) || !isRecord(value.state)) return false;
  const { version } = value;
  return version === undefined || (typeof version === 'number' && Number.isFinite(version));
}

/** Ключи хранилища приложения. Собираем в массив, чтобы не мутировать хранилище в обходе. */
function lifeKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LIFE_PREFIX)) keys.push(key);
  }
  return keys;
}

export function buildBackup(): BackupFile {
  const entries: Record<string, PersistEnvelope> = {};

  for (const key of lifeKeys()) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;

    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      // Мусорный ключ исключаем: иначе экспорт выдаст файл, который импорт отвергнет.
      console.warn(`backup: ключ ${key} содержит некорректный JSON — пропущен`);
      continue;
    }

    if (!isPersistEnvelope(value)) {
      console.warn(`backup: ключ ${key} не похож на состояние приложения — пропущен`);
      continue;
    }

    entries[key] = value;
  }

  return {
    app: BACKUP_APP_ID,
    kind: BACKUP_KIND,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не является корректным JSON.' };
  }

  if (!isRecord(data)) {
    return { ok: false, error: 'Файл не является резервной копией.' };
  }

  if (data.kind !== BACKUP_KIND || data.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'Файл не является резервной копией ScoreFlow.' };
  }

  const formatVersion = data.formatVersion;
  if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) {
    return { ok: false, error: 'Неподдерживаемая версия формата файла.' };
  }
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, error: 'Файл создан более новой версией приложения.' };
  }

  // Пустой объект валиден: свежее приложение экспортирует ровно такой бэкап.
  const entries = data.entries;
  if (!isRecord(entries)) {
    return { ok: false, error: 'Файл повреждён или имеет неподдерживаемый формат.' };
  }

  const parsed: Record<string, PersistEnvelope> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (!key.startsWith(LIFE_PREFIX)) {
      return { ok: false, error: 'Файл содержит данные другого приложения.' };
    }
    if (!isPersistEnvelope(value)) {
      return { ok: false, error: 'Файл повреждён или имеет неподдерживаемый формат.' };
    }
    parsed[key] = value;
  }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP_ID,
      kind: BACKUP_KIND,
      formatVersion,
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
      entries: parsed,
    },
  };
}

/**
 * Полная замена состояния: записывает ключи из бэкапа, удаляет лишние `life:*`
 * и перезагружает страницу.
 *
 * Перезагрузка выбрана вместо `setState` / `persist.rehydrate()`: те требуют
 * перечислять все сторы (связь с каждым модулем и ручные правки для новых), а у
 * `rehydrate` дефолтный поверхностный `merge` ещё и оставит ключи, которых нет
 * в файле. `localStorage.setItem` синхронен, поэтому к моменту перезагрузки
 * память и хранилище не расходятся.
 *
 * Возвращает сообщение об ошибке, если запись не удалась (тогда ничего не
 * удаляем и не перезагружаемся).
 */
export function applyBackup(backup: BackupFile): string | null {
  const keys = lifeKeys();
  const snapshot = new Map<string, string | null>();
  for (const key of keys) snapshot.set(key, localStorage.getItem(key));

  try {
    for (const [key, value] of Object.entries(backup.entries)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Откат: на случай, если часть ключей уже записалась до отказа по квоте.
    // Сначала убираем ключи, которых не было до импорта (их нет в snapshot и
    // без этого они бы «утекли» из неудавшегося импорта), затем возвращаем
    // прежние значения. Откат делаем best-effort: если даже он не удался,
    // пользователь всё равно должен увидеть сообщение об ошибке, а не исключение.
    try {
      for (const key of Object.keys(backup.entries)) {
        if (!snapshot.has(key)) localStorage.removeItem(key);
      }
      for (const [key, raw] of snapshot) {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      }
    } catch {
      console.warn('backup: откат не удался, состояние хранилища может быть смешанным');
    }
    return 'Не удалось сохранить данные: в браузере закончилось место.';
  }

  const incoming = new Set(Object.keys(backup.entries));
  for (const key of keys) {
    if (!incoming.has(key)) localStorage.removeItem(key);
  }

  window.location.reload();
  return null;
}

export function backupFileName(today: DayKey): string {
  // Имя файла — с продуктовым именем (как в <title> и в сообщениях об ошибках
  // импорта), а не с внутренним id приложения.
  return `ScoreFlow-${today}.json`;
}

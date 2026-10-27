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

/** Внутренний идентификатор формата — поле `app` в файле. */
export const BACKUP_APP_ID = 'scoreflow';
export const BACKUP_KIND = 'life-backup';
export const BACKUP_FORMAT_VERSION = 1;

/**
 * Имя, под которым приложение знает пользователь: название файла бэкапа и тексты
 * ошибок импорта. Вне префикса `life:` — это служебный ключ, а не состояние.
 */
const PRODUCT_NAME = 'ScoreFlow';
const SAFETY_KEY = 'scoreflow:backup-safety';

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

/**
 * Состояние, снятое перед последним успешным импортом. Хранится в сыром виде
 * (как лежало в localStorage) и вне префикса `life:`, чтобы не попадать в
 * бэкап и не затираться полной заменой.
 */
export interface SafetySnapshot {
  savedAt: string;
  entries: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((v) => typeof v === 'string');
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

/** Сырое содержимое всех ключей `life:*`. */
function readLifeEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const key of lifeKeys()) {
    const raw = localStorage.getItem(key);
    if (raw !== null) entries[key] = raw;
  }
  return entries;
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
    return { ok: false, error: `Файл не является резервной копией ${PRODUCT_NAME}.` };
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
 * Полная замена ключей `life:*` на `entries` (сырые значения localStorage).
 *
 * При отказе записи состояние откатывается: сначала убираются ключи, которых не
 * было до замены (иначе они бы «утекли» из неудавшейся операции), затем
 * возвращаются прежние значения. Откат делается best-effort — даже если он не
 * удался, вызывающий должен показать сообщение об ошибке, а не исключение.
 *
 * Возвращает сообщение об ошибке либо `null`.
 */
function replaceLifeEntries(entries: Record<string, string>): string | null {
  const keys = lifeKeys();
  const snapshot = new Map<string, string | null>();
  for (const key of keys) snapshot.set(key, localStorage.getItem(key));

  try {
    for (const [key, raw] of Object.entries(entries)) {
      localStorage.setItem(key, raw);
    }
  } catch {
    try {
      for (const key of Object.keys(entries)) {
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

  const incoming = new Set(Object.keys(entries));
  for (const key of keys) {
    if (!incoming.has(key)) localStorage.removeItem(key);
  }
  return null;
}

/**
 * Полная замена состояния содержимым бэкапа.
 *
 * Перезагрузка выбрана вместо `setState` / `persist.rehydrate()`: те требуют
 * перечислять все сторы (связь с каждым модулем и ручные правки для новых), а у
 * `rehydrate` дефолтный поверхностный `merge` ещё и оставит ключи, которых нет
 * в файле. `localStorage.setItem` синхронен, поэтому к моменту перезагрузки
 * память и хранилище не расходятся.
 *
 * Перед заменой снимается страховочная копия текущего состояния: импорт может
 * выполняться из неверного или повреждённого файла, и тогда единственным
 * способом вернуть данные остаётся откат одной кнопкой (см. `restoreSafetySnapshot`).
 *
 * Возвращает сообщение об ошибке, если запись не удалась (тогда ничего не
 * удаляем и не перезагружаемся).
 */
export function applyBackup(backup: BackupFile): string | null {
  const previous = readLifeEntries();

  const incoming: Record<string, string> = {};
  for (const [key, value] of Object.entries(backup.entries)) {
    incoming[key] = JSON.stringify(value);
  }

  const error = replaceLifeEntries(incoming);
  if (error) return error;

  // Страховку кладём только после успеха: иначе кнопка отката предлагала бы
  // «отменить» импорт, который и не применялся.
  try {
    localStorage.setItem(
      SAFETY_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), entries: previous } satisfies SafetySnapshot),
    );
  } catch {
    console.warn('backup: не удалось сохранить страховочную копию');
  }

  window.location.reload();
  return null;
}

/** Состояние, снятое перед последним успешным импортом, если оно есть. */
export function loadSafetySnapshot(): SafetySnapshot | null {
  const raw = localStorage.getItem(SAFETY_KEY);
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || typeof value.savedAt !== 'string' || !isStringRecord(value.entries)) {
    return null;
  }
  return { savedAt: value.savedAt, entries: value.entries };
}

/**
 * Возврат к состоянию, снятому перед последним импортом. Копия при этом
 * съедается — откат одного и того же шага повторить уже нельзя.
 */
export function restoreSafetySnapshot(): string | null {
  const snapshot = loadSafetySnapshot();
  if (!snapshot) return 'Нет сохранённого предыдущего состояния.';

  const error = replaceLifeEntries(snapshot.entries);
  if (error) return error;

  localStorage.removeItem(SAFETY_KEY);
  window.location.reload();
  return null;
}

export function backupFileName(today: DayKey): string {
  return `${PRODUCT_NAME}-${today}.json`;
}

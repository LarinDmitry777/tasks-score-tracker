/**
 * Навигация на основе URL-хэша.
 *
 * Использование хэша (вместо стека в памяти) даёт бесплатную поддержку
 * системной кнопки/жеста «назад» на телефоне и в PWA.
 *
 *   #/            → дашборд
 *   #/tasks       → модуль с id "tasks"
 *   #/tasks/config → внутренний экран модуля (route = "config")
 */

import { useSyncExternalStore } from 'react';

export interface Route {
  /** id модуля или null для дашборда. */
  moduleId: string | null;
  /** Вложенный путь внутри модуля (сегменты после id). */
  segments: string[];
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  if (parts.length === 0) return { moduleId: null, segments: [] };
  return { moduleId: parts[0], segments: parts.slice(1) };
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function getHashSnapshot(): string {
  return window.location.hash;
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHashSnapshot, () => '');
  return parseHash(hash);
}

/** Перейти по пути. Сегменты соединяются в хэш. */
export function navigate(...segments: string[]): void {
  const path = segments.filter(Boolean).join('/');
  window.location.hash = path ? `/${path}` : '/';
}

/** Вернуться назад в истории. */
export function goBack(): void {
  window.history.back();
}

/**
 * Шина событий для межмодульного общения.
 *
 * Модули не знают друг о друге напрямую — они публикуют и слушают события
 * по строковому ключу. Это даёт слабую связанность: модуль «Уборка» сможет,
 * например, отправить событие `task:create-request`, а модуль «Задачи» его
 * подхватит, не зная, кто был источником.
 *
 * Именование событий: `<module>:<event>` (например `tasks:completed`).
 */

export type EventHandler<T = unknown> = (payload: T) => void;

type HandlerSet = Set<EventHandler>;

class EventBus {
  private handlers = new Map<string, HandlerSet>();

  /** Подписаться на событие. Возвращает функцию отписки. */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<T = unknown>(event: string, payload: T): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Копируем, чтобы отписка внутри обработчика не ломала итерацию.
    for (const handler of [...set]) {
      handler(payload);
    }
  }
}

export const eventBus = new EventBus();

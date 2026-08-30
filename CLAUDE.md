# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal "life aggregator" — a mobile-first PWA that will hold many independent modules (tasks, cleaning schedules, etc.). It runs entirely in the browser with **no backend**; all state lives in `localStorage`. The app is designed primarily for phone screens (viewport capped at `max-width: 480px`) and installs as a PWA.

The first and currently only module is the **task tracker**: recurring daily chores grouped by time of day (morning/day/evening), with completion tracking and a configurator for recurrence.

## Commands

Package manager is **bun**.

- `bun run dev` — Vite dev server with HMR
- `bun run build` — type-check (`tsc -b`) then production build; run this to verify a change compiles
- `bun run lint` — ESLint
- `bun run preview` — serve the production build locally

There is **no test runner configured**. Scheduling logic is pure and side-effect-free by design, so it can be verified by porting the functions in `modules/tasks/scheduling.ts` into a throwaway Node script (`node script.mjs`) and asserting statuses — this is how the invariants have been checked so far.

## Architecture

### Module system (`src/core/`)

The app is a shell that hosts self-contained modules. A module implements the `LifeModule` contract (`core/module.ts`): `id`, display metadata, a `Screen` component, and an optional `useSummary()` hook rendered on the dashboard tile.

- **`registry.ts`** — the single place every module is listed. Adding a module = implement `LifeModule` + append to `modules[]`.
- **`navigation.ts`** — hash-based routing (`#/`, `#/tasks`, `#/settings`) via `useSyncExternalStore`. Hash routing is deliberate: it gives free support for the phone's system back gesture/button. Use `navigate(...segments)` and `goBack()`.
- **`eventBus.ts`** — string-keyed pub/sub for **inter-module communication** so modules stay decoupled (they never import each other). Event naming: `<module>:<event>`.
- **`settings.ts`** — global settings (Zustand + `persist`), currently `dayStartHour`.
- **`time.ts`** — the "logical day" model (see below).
- **`useToday.ts`** — hook returning the current logical day key; self-reschedules a timer to re-render exactly at the next day boundary, and also recomputes on tab `visibilitychange`.

`App.tsx` is the router: reads the route, renders the dashboard, the settings screen, or the matched module's `Screen` inside a shared `Shell` (sticky header + back button).

### Logical day (`core/time.ts`)

Central concept: the app's "day" does not start at midnight but at `dayStartHour` (default 5:00, user-configurable). Everything between 00:00 and that hour belongs to the *previous* logical day.

- A logical day is a `DayKey` string `YYYY-MM-DD` (the calendar date of that day's morning).
- For arithmetic (intervals, weekdays), keys convert to an **ordinal** (days since epoch) via `dayKeyToOrdinal` / `ordinalToDayKey`. Do date math on ordinals, not `Date`.

### Task scheduling (`src/modules/tasks/`)

The scheduling logic (`scheduling.ts`) is pure and is the most correctness-sensitive part. State is intentionally minimal: no history is stored — only `lastCompletedDay` and `skippedDay` per task (see `model.ts`).

**Core invariant: exactly one live instance of a task exists at any time.** We never store a queue of overdue copies. Instead `getCurrentDueDay(task, today)` computes the *current due day* = the latest scheduled occurrence ≤ today. An unfinished older occurrence is automatically absorbed by the next scheduled one, so two identical tasks can never appear simultaneously. When changing scheduling logic, preserve this — it's the reason there are no duplicates on carry-over.

Recurrence kinds (`Schedule` in `model.ts`):
- `daily`
- `weekdays` — specific days of week, anchored to an explicit `startDay`
- `everyNDays` with an `anchor`:
  - `completion` — next occurrence is N days after the task was last completed
  - `calendar` — fixed schedule from `startDay` (`startDay + k·N`), regardless of when completed

`skippedDay` implements "postpone to tomorrow": it hides the current instance for one logical day **without** shifting the schedule; the same instance reappears the next day.

Data flow: `store.ts` (Zustand + `persist`, holds raw `Task[]`) → derived view-model hooks in `useTasksView.ts` (`useTasksView` groups by time of day for the *Today* tab; `useAllTasksView` groups by recurrence for the *All* tab) → components. Keep scheduling decisions in `scheduling.ts` and derivation in `useTasksView.ts`; components stay presentational.

### Persistence

Each store persists under a `life:`-prefixed key (`life:tasks`, `life:settings`) via Zustand's `persist` middleware. There is no shared storage helper — use `persist` for any new module store.

## Deployment (GitHub Pages)

Pushing to `main` triggers `.github/workflows/main-flow.yml`, which builds with bun and deploys `dist/` to GitHub Pages. Because the site is served from a repo subpath, **`base` in `vite.config.ts` must equal `/<repo-name>/`**, and the PWA `scope` / `start_url` / manifest paths must match it. If the app 404s or loads blank assets after deploy, this mismatch is the first thing to check.

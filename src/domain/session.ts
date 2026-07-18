import type { LoggedSet, Session, SessionExercise } from './types';
import type { StatsEntry } from './stats';

/**
 * A set worth keeping in the archive: one that was actually performed — checked
 * off, or with a weight or reps entered. Blank prefill rows are dropped.
 */
export function meaningfulSet(s: LoggedSet): boolean {
  return !!s.done || parseFloat(s.w) > 0 || parseFloat(s.reps) > 0;
}

/** Id for a new session. Impure by nature — kept here beside the session type. */
export function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Feed an archived session to the stats calculator. */
export function sessionEntries(session: Session): StatsEntry[] {
  return session.exercises.map((ex) => ({ name: ex.name, sets: ex.sets }));
}

/** Sets that were actually checked off — the only ones worth archiving. */
export function doneOnly(sets: SessionExercise['sets']): SessionExercise['sets'] {
  return sets.filter((s) => s.done);
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Human day label for an archived session: "Today" / "Yesterday" for the recent
 * ones, otherwise a short date. `now` is injectable so this stays testable.
 */
export function sessionDayLabel(at: string, now: Date = new Date()): string {
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return then.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Clock time of a session, e.g. "18:42". */
export function sessionTimeLabel(at: string): string {
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return '';
  return then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

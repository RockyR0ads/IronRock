import { exerciseSeries } from './progress';
import { daysForProgram } from './program';
import { programMeta } from './programs';
import type { State } from '../state/store';

/**
 * Watch for when a deload is due, per the program's own rule: either two or
 * more heavy compounds have gone backwards for two sessions running, or the
 * block has simply run its length (default 8 weeks). Stalls on a cut are
 * expected and don't count — only genuine regression (falling estimated 1RM
 * two steps in a row) does.
 */

const WEEK_MS = 7 * 86_400_000;

export interface DeloadStatus {
  due: boolean;
  reasons: string[];
  /** Heavy lifts seen regressing two sessions running. */
  regressing: string[];
}

/** Heavy (r-hi) lift ids across the active program's days. */
function heavyLiftIds(state: State): string[] {
  const ids = new Set<string>();
  for (const day of daysForProgram(state.activeProgram)) {
    for (const b of day.blocks) if (b.cls === 'r-hi') ids.add(b.lift);
  }
  return [...ids];
}

export function deloadStatus(state: State): DeloadStatus {
  const reasons: string[] = [];
  const regressing: string[] = [];

  for (const liftId of heavyLiftIds(state)) {
    const pts = exerciseSeries(state.sessions, liftId, state.inc);
    const n = pts.length;
    if (n < 3) continue;
    // two consecutive drops in estimated 1RM = backwards two sessions running
    if (pts[n - 1].e1rm < pts[n - 2].e1rm && pts[n - 2].e1rm < pts[n - 3].e1rm) {
      regressing.push(liftId);
    }
  }
  if (regressing.length >= 2) {
    reasons.push(`${regressing.length} heavy lifts have gone backwards two sessions running`);
  }

  const weeks = programMeta(state.activeProgram)?.weeks ?? 8;
  if (state.programStart) {
    const elapsedWeeks = (Date.now() - Date.parse(state.programStart)) / WEEK_MS;
    if (Number.isFinite(elapsedWeeks) && elapsedWeeks >= weeks) {
      reasons.push(`it's been ${Math.floor(elapsedWeeks)} weeks since this block started`);
    }
  }

  return { due: reasons.length > 0, reasons, regressing };
}

/** Whether a deload week is currently marked active (within 7 days of its start). */
export function isDeloadActive(state: State): boolean {
  if (!state.deload) return false;
  const started = Date.parse(state.deload);
  return Number.isFinite(started) && Date.now() - started < WEEK_MS;
}

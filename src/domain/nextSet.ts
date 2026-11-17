// Next-set prediction. When you add a set, it opens pre-filled with what the
// set most likely is, so the usual case is a single tap:
//  - a programmed top set + back-off drops the first back-off to its % of the top set;
//  - otherwise it replays last session's set-to-set pattern for the lift — the
//    weight changes by the same ratio and the reps by the same step as the
//    matching sets did last time (straight sets, fading reps, pyramids, drops);
//  - with no pattern to go on, the caller copies the previous set as before.

import { round } from './calc';
import type { Block, Increment, LoggedSet, Reps, Session } from './types';

const low = (r: Reps) => (Array.isArray(r) ? r[0] : r);
const num = (v: string | undefined) => parseFloat(v ?? '') || 0;
const working = (s: LoggedSet) => !!s.done && !s.warmup && num(s.w) > 0;

/** Last session's working sets for a lift, oldest set first. */
export function lastWorkingSets(liftId: string, sessions: Session[]): LoggedSet[] {
  const last = sessions.find((s) => s.exercises.some((e) => e.liftId === liftId && e.sets.some(working)));
  return last?.exercises.find((e) => e.liftId === liftId)?.sets.filter(working) ?? [];
}

/**
 * The predicted next working set given today's sets so far, or null when
 * there's nothing better than copying the previous set.
 */
export function predictNext(
  block: Block,
  sets: LoggedSet[],
  sessions: Session[],
  inc: Increment
): Pick<LoggedSet, 'w' | 'reps'> | null {
  const today = sets.filter((s) => !s.warmup);
  const prev = today[today.length - 1];
  if (!prev || num(prev.w) <= 0) return null;
  const k = today.length; // index of the set being added

  if (block.backoff && k === 1) {
    return { w: String(round(num(prev.w) * block.backoff.pct, inc)), reps: String(low(block.backoff.reps)) };
  }

  const last = lastWorkingSets(block.lift, sessions);
  if (last.length <= k) return null;
  const ratio = num(last[k].w) / num(last[k - 1].w);
  const step = num(last[k].reps) - num(last[k - 1].reps);
  if (!(ratio > 0)) return null;
  const reps = Math.max(1, (num(prev.reps) || num(last[k - 1].reps)) + step);
  return { w: String(round(num(prev.w) * ratio, inc)), reps: String(reps) };
}

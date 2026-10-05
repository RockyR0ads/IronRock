import { estimate1Rm, round } from './calc';
import { setReps } from './stats';
import type { Increment, LoggedSet, Session } from './types';

/**
 * All-time personal records for one lift, mined from the full session history:
 * the best estimated 1RM, the heaviest single set, the biggest-volume session,
 * and a rep-max table (the heaviest weight ever lifted for each rep count).
 */

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const counts = (s: LoggedSet) => !!s.done && !s.warmup;

/** Heaviest weight ever done for a given rep count, and when. */
export interface RepMax {
  reps: number;
  weight: number;
  at: string;
  /** Estimated 1RM implied by this rep max, rounded. */
  e1rm: number;
}

export interface LiftRecords {
  bestE1rm: { value: number; at: string; weight: number; reps: number } | null;
  heaviest: { weight: number; reps: number; at: string } | null;
  bestVolume: { volume: number; at: string } | null;
  /** Rep maxes for 1…REP_CAP reps, only the counts actually achieved, ascending. */
  repMaxes: RepMax[];
}

/** Rep counts above this are lumped together — a "20-rep max" isn't a useful PR. */
export const REP_CAP = 12;

export function liftRecords(
  sessions: Session[],
  liftId: string,
  inc: Increment,
  opts: { addWeight?: number } = {}
): LiftRecords {
  const add = opts.addWeight ?? 0;
  const bestForReps = new Map<number, RepMax>();
  let bestE1rm: LiftRecords['bestE1rm'] = null;
  let heaviest: LiftRecords['heaviest'] = null;
  let bestVolume: LiftRecords['bestVolume'] = null;

  for (const s of sessions) {
    let sessionVol = 0;
    for (const ex of s.exercises) {
      if (ex.liftId !== liftId) continue;
      for (const set of ex.sets) {
        if (!counts(set)) continue;
        const w = num(set.w) + add;
        const r = setReps(set);
        if (w <= 0 || r <= 0) continue;

        sessionVol += w * r;

        const raw = estimate1Rm(w, r, num(set.rpe));
        const e1rm = raw === null ? w : round(raw, inc);

        if (r <= REP_CAP) {
          const cur = bestForReps.get(r);
          if (!cur || w > cur.weight) bestForReps.set(r, { reps: r, weight: w, at: s.at, e1rm });
        }
        if (!heaviest || w > heaviest.weight) heaviest = { weight: w, reps: r, at: s.at };
        if (!bestE1rm || e1rm > bestE1rm.value) {
          bestE1rm = { value: e1rm, at: s.at, weight: w, reps: r };
        }
      }
    }
    if (sessionVol > 0 && (!bestVolume || sessionVol > bestVolume.volume)) {
      bestVolume = { volume: Math.round(sessionVol), at: s.at };
    }
  }

  return {
    bestE1rm,
    heaviest,
    bestVolume,
    repMaxes: [...bestForReps.values()].sort((a, b) => a.reps - b.reps),
  };
}

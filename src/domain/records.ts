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

export interface SetPr {
  kind: 'e1rm' | 'rep';
  /** For e1rm: the new estimated 1RM. For rep: the weight lifted. */
  value: number;
  reps: number;
}

/**
 * Is a just-logged set a personal record for this lift, judged against the
 * archived history only? Returns the strongest PR kind, or null. A lift with no
 * prior history isn't a PR (it's just the first entry) — that keeps the first
 * session of every lift from firing a wall of celebrations.
 */
export function detectSetPr(
  sessions: Session[],
  liftId: string,
  inc: Increment,
  w: number,
  reps: number,
  rpe: number
): SetPr | null {
  if (w <= 0 || reps <= 0) return null;
  const prior = liftRecords(sessions, liftId, inc);
  if (!prior.bestE1rm) return null; // first time logging this lift

  const raw = estimate1Rm(w, reps, rpe);
  const e1rm = raw === null ? w : round(raw, inc);
  if (e1rm > prior.bestE1rm.value) return { kind: 'e1rm', value: e1rm, reps };

  if (reps <= REP_CAP) {
    const atReps = prior.repMaxes.find((m) => m.reps === reps);
    if (!atReps || w > atReps.weight) return { kind: 'rep', value: w, reps };
  }
  return null;
}

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

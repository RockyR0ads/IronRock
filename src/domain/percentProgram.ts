import { round } from './calc';
import type { Increment } from './types';

/**
 * Generic building blocks for percentage-of-Training-Max programs — the shared
 * machinery behind 5/3/1, nSuns, Madcow, Texas Method, GZCL and friends. Each
 * program is then just its own scheme data on top of these, not a copy of the
 * same maths.
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** A prescribed set as a fraction of a Training Max. */
export interface SetSpec {
  /** Percentage of the Training Max. */
  pct: number;
  reps: number;
  /** As-many-reps-as-possible top set. */
  amrap?: boolean;
}

/** A resolved set: its spec plus the computed, rounded weight. */
export interface PctSet extends SetSpec {
  weight: number;
}

/** Weight for a %-of-TM set, rounded to the increment. */
export function pctWeight(tm: number, pct: number, inc: Increment): number {
  return round((tm * pct) / 100, inc);
}

/** Resolve a scheme of %-based sets against a Training Max. */
export function resolveSets(tm: number, scheme: SetSpec[], inc: Increment): PctSet[] {
  return scheme.map((s) => ({ ...s, weight: pctWeight(tm, s.pct, inc) }));
}

/**
 * N straight sets of M reps at a single percentage — the "supplemental volume"
 * pattern (e.g. Boring But Big 5×10, or a nSuns back-off).
 */
export function straightSets(
  tm: number,
  opts: { pct: number; sets: number; reps: number },
  inc: Increment
): PctSet[] {
  const weight = pctWeight(tm, opts.pct, inc);
  return Array.from({ length: opts.sets }, () => ({ pct: opts.pct, reps: opts.reps, weight }));
}

/** Training Max from a known 1RM (default 90%, rounded to the increment). */
export function trainingMax(oneRm: number, inc: Increment, pct = 90): number {
  return round((oneRm * pct) / 100, inc);
}

/** 1-based week within a repeating cycle of `cycleLength` weeks, from the start date. */
export function cycleWeek(
  startISO: string | undefined,
  cycleLength: number,
  now: Date = new Date()
): number {
  if (!startISO) return 1;
  const elapsed = Math.max(0, now.getTime() - new Date(startISO).getTime());
  return (Math.floor(elapsed / WEEK_MS) % cycleLength) + 1;
}

/** How many full cycles have elapsed since the start date (0 during the first). */
export function completedCycles(
  startISO: string | undefined,
  cycleLength: number,
  now: Date = new Date()
): number {
  if (!startISO) return 0;
  const elapsed = Math.max(0, now.getTime() - new Date(startISO).getTime());
  return Math.floor(Math.floor(elapsed / WEEK_MS) / cycleLength);
}

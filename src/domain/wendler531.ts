import type { Increment } from './types';
import {
  resolveSets,
  straightSets,
  trainingMax,
  cycleWeek as cycleWeekGeneric,
  type SetSpec,
  type PctSet,
} from './percentProgram';

/**
 * Wendler 5/3/1 (Boring But Big) — just the program's own data. The percentage,
 * Training-Max and cycle maths live in ./percentProgram and are shared with the
 * other percentage-based programs.
 */

export type W531Set = PctSet;

export interface W531Day {
  key: string;
  label: string;
  /** Main lift id (keys into the LIFTS catalogue). */
  lift: string;
  /** Suggested assistance work — informational, not loaded. */
  accessory: string;
}

/** The four main days, one big lift each. */
export const W531_DAYS: W531Day[] = [
  { key: 'w531-ohp', label: 'Press', lift: 'ohp', accessory: 'Chins & curls — ~50–75 reps' },
  { key: 'w531-deadlift', label: 'Deadlift', lift: 'deadlift', accessory: 'Abs / hanging leg raises — ~50 reps' },
  { key: 'w531-bench', label: 'Bench', lift: 'bench', accessory: 'Rows & triceps — ~50–75 reps' },
  { key: 'w531-squat', label: 'Squat', lift: 'squat', accessory: 'Leg curls & abs — ~50 reps' },
];

/** Lift ids that need a max entered. */
export const W531_LIFTS = W531_DAYS.map((d) => d.lift);

const UPPER = new Set(['ohp', 'bench']);

/** Per-cycle Training Max bump: +2.5 kg upper, +5 kg lower. */
export function tmIncrement(liftId: string): number {
  return UPPER.has(liftId) ? 2.5 : 5;
}

export const CYCLE_WEEKS = 4;

/** Week 1..4 label. */
export const WAVE_LABEL: Record<number, string> = {
  1: '5s week',
  2: '3s week',
  3: '5/3/1 week',
  4: 'Deload',
};

// The main-lift scheme for each wave week — three sets, top set AMRAP (except deload).
const WAVE: Record<number, SetSpec[]> = {
  1: [{ pct: 65, reps: 5 }, { pct: 75, reps: 5 }, { pct: 85, reps: 5, amrap: true }],
  2: [{ pct: 70, reps: 3 }, { pct: 80, reps: 3 }, { pct: 90, reps: 3, amrap: true }],
  3: [{ pct: 75, reps: 5 }, { pct: 85, reps: 3 }, { pct: 95, reps: 1, amrap: true }],
  4: [{ pct: 40, reps: 5 }, { pct: 50, reps: 5 }, { pct: 60, reps: 5 }],
};

const WARMUP: SetSpec[] = [{ pct: 40, reps: 5 }, { pct: 50, reps: 5 }, { pct: 60, reps: 3 }];

/** The three main working sets for a lift on a given wave week. */
export function mainSets(tm: number, week: number, inc: Increment): W531Set[] {
  return resolveSets(tm, WAVE[week] ?? WAVE[1], inc);
}

/** Standard warm-up ramp (informational). */
export function warmupSets531(tm: number, inc: Increment): W531Set[] {
  return resolveSets(tm, WARMUP, inc);
}

/** Boring But Big supplemental: 5 × 10 at `pct`% of TM (default 50%). */
export function bbbSets(tm: number, inc: Increment, pct = 50): W531Set[] {
  return straightSets(tm, { pct, sets: 5, reps: 10 }, inc);
}

/** Which wave week (1..4) you're on, from the cycle start date. */
export function cycleWeek(startISO: string | undefined, now: Date = new Date()): number {
  return cycleWeekGeneric(startISO, CYCLE_WEEKS, now);
}

/** Training Max from a known 1RM (90%). */
export function tmFromOneRm(oneRm: number, inc: Increment): number {
  return trainingMax(oneRm, inc);
}

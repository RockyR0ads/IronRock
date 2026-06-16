import { pctFor } from './rpe';
import type { Increment, Reps } from './types';

/** reps-to-failure = reps + (10 - rpe). */
export function repsToFailure(reps: number, rpe: number): number {
  return reps + (10 - rpe);
}

/**
 * Estimate 1RM from a reference set. Returns null if any input is missing or <= 0.
 */
export function estimate1Rm(weight: number, reps: number, rpe: number): number | null {
  if (!(weight > 0) || !(reps > 0) || !(rpe > 0)) return null;
  return weight / pctFor(repsToFailure(reps, rpe));
}

/** The value itself for a fixed number, or the midpoint for a [lo, hi] range. */
export function midReps(reps: Reps): number {
  return Array.isArray(reps) ? (reps[0] + reps[1]) / 2 : reps;
}

/** Round to the nearest multiple of `increment`. */
export function round(value: number, increment: Increment): number {
  return Math.round(value / increment) * increment;
}

/**
 * Working load for a programmed set: back off the estimated 1RM by the %1RM
 * implied by the set's mid-reps and target RPE, then round to the increment.
 */
export function targetLoad(
  e1rm: number,
  mid: number,
  rpe: number,
  increment: Increment
): number {
  return round(e1rm * pctFor(mid + (10 - rpe)), increment);
}

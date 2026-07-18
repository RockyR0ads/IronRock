import { estimate1Rm, targetLoad as calcTargetLoad, midReps, round } from '../domain/calc';
import { rpeNum } from '../domain/format';
import { workoutStats, type WorkoutStats } from '../domain/stats';
import type { Block, LoggedSet } from '../domain/types';
import { effBlocks, liftById, setsFor, type State } from './store';

/** Reference sets are taken to failure, so they always score as maximum effort. */
const MAX_EFFORT_RPE = 10;

/**
 * Estimated 1RM for a computed lift's reference set, or null if incomplete.
 * A reference set is a maximum-effort set, so it's scored at RPE 10 — the reps
 * entered are the reps to failure.
 */
export function e1rmFor(state: State, liftId: string): number | null {
  const ref = state.refs[liftId];
  if (!ref) return null;
  const w = parseFloat(ref.w ?? '');
  const reps = parseFloat(ref.reps ?? '');
  return estimate1Rm(w, reps, MAX_EFFORT_RPE);
}

/** Estimated 1RM rounded to the active increment, for display. */
export function displayE1rm(state: State, liftId: string): number | null {
  const e1rm = e1rmFor(state, liftId);
  return e1rm === null ? null : round(e1rm, state.inc);
}

/** Working load for a programmed (computed) block, or null if no reference yet. */
export function blockLoad(state: State, block: Block): number | null {
  const e1rm = e1rmFor(state, block.lift);
  if (e1rm === null) return null;
  return calcTargetLoad(e1rm, midReps(block.reps), rpeNum(block.rpe), state.inc);
}

/** A logged set has all three values entered. */
export function isSetFilled(set: LoggedSet): boolean {
  return parseFloat(set.w) > 0 && parseFloat(set.reps) > 0 && parseFloat(set.rpe) > 0;
}

/** Working (non-warm-up) sets checked off as done — warm-ups never count. */
export function doneSetCount(sets: LoggedSet[]): number {
  return sets.filter((s) => s.done && !s.warmup).length;
}

/** Working (non-warm-up) sets logged, regardless of done state. */
export function workingSetCount(sets: LoggedSet[]): number {
  return sets.filter((s) => !s.warmup).length;
}

/** A block is complete once at least its prescribed number of sets are checked done. */
export function isBlockComplete(block: Block, sets: LoggedSet[]): boolean {
  return block.sets > 0 && doneSetCount(sets) >= block.sets;
}

/** Summary of everything checked off on a day — powers the finish-workout screen. */
export function dayStats(state: State, dayKey: string): WorkoutStats {
  const entries = effBlocks(state, dayKey).map((block, i) => ({
    name: liftById(state, block.lift).name,
    // pass everything logged — workoutStats itself ignores warm-ups
    sets: setsFor(state, dayKey, i),
  }));
  return workoutStats(entries, state.inc);
}

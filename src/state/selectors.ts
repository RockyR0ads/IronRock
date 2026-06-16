import { estimate1Rm, targetLoad as calcTargetLoad, midReps, round } from '../domain/calc';
import { rpeNum } from '../domain/format';
import type { Block, LoggedSet } from '../domain/types';
import type { State } from './store';

/** Estimated 1RM for a computed lift's reference set, or null if incomplete. */
export function e1rmFor(state: State, liftId: string): number | null {
  const ref = state.refs[liftId];
  if (!ref) return null;
  const w = parseFloat(ref.w ?? '');
  const reps = parseFloat(ref.reps ?? '');
  const rpe = parseFloat(ref.rpe ?? '');
  return estimate1Rm(w, reps, rpe);
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

/** A logged set counts as done once weight, reps, and RPE are all positive. */
export function isSetFilled(set: LoggedSet): boolean {
  return parseFloat(set.w) > 0 && parseFloat(set.reps) > 0 && parseFloat(set.rpe) > 0;
}

/** Number of fully-filled sets logged. */
export function filledSetCount(sets: LoggedSet[]): number {
  return sets.filter(isSetFilled).length;
}

/** A block is complete once it has at least its prescribed number of filled sets. */
export function isBlockComplete(block: Block, sets: LoggedSet[]): boolean {
  return block.sets > 0 && filledSetCount(sets) >= block.sets;
}

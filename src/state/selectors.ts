import { estimate1Rm, targetLoad as calcTargetLoad, midReps, round } from '../domain/calc';
import { rpeNum } from '../domain/format';
import type { Block } from '../domain/types';
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

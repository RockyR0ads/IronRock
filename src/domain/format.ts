import type { Block, Reps } from './types';

/** Display label for reps: "8" or "8–10". */
export function repLabel(reps: Reps): string {
  return Array.isArray(reps) ? `${reps[0]}–${reps[1]}` : `${reps}`;
}

/** Numeric RPE driving the math; for a string like "9–10" take the first number. */
export function rpeNum(rpe: number | string): number {
  return typeof rpe === 'number' ? rpe : parseFloat(`${rpe}`.split('–')[0]);
}

/** RPE display string applying the drift ("7→8") and range ("9–10") rules. */
export function feelLabel(block: Pick<Block, 'rpe' | 'drift'>): string {
  if (typeof block.rpe === 'number') {
    return `RPE ${block.rpe}${block.drift ? '→8' : ''}`;
  }
  return `RPE ${block.rpe}`;
}

/** Whether a block is shown/loaded per-leg. */
export function isPerLeg(block: Pick<Block, 'perLeg'>, liftUni?: boolean): boolean {
  return !!block.perLeg || !!liftUni;
}

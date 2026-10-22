import type { Block, LoggedSet, Reps } from './types';

/**
 * "Count the work, don't credit the progression." A program day you train
 * differently still counts in history, charts, volume and PRs — but sets that
 * don't match what the plan prescribes (a lift the plan doesn't have, or reps
 * well outside its range) mustn't steer the program's own logic: the next-load
 * suggestion or the deload regression check.
 */

/** Reps this far outside the prescribed range still count as on-plan. */
export const REP_TOLERANCE = 2;

const num = (s: string | undefined) => {
  const n = parseFloat(s ?? '');
  return Number.isFinite(n) ? n : 0;
};

export function repsInRange(reps: number, target: Reps, tol = REP_TOLERANCE): boolean {
  const [lo, hi] = Array.isArray(target) ? target : [target, target];
  return reps >= lo - tol && reps <= hi + tol;
}

/** The plan slot a lift belongs to: its anchor or one of its sanctioned options. */
export function planSlotFor(plan: Block[], liftId: string): Block | undefined {
  return plan.find((b) => b.lift === liftId || (b.alts ?? []).includes(liftId));
}

/**
 * Is one set on-plan? `plan` null means the day has no prescription (freestyle,
 * imported) — there's nothing to deviate from, so it counts as on-plan.
 */
export function setOnPlan(plan: Block[] | null, liftId: string, set: Pick<LoggedSet, 'reps' | 'repsR' | 'perSide'>): boolean {
  if (!plan) return true;
  const slot = planSlotFor(plan, liftId);
  if (!slot) return false; // an exercise the plan doesn't have
  const reps = set.perSide ? Math.max(num(set.reps), num(set.repsR)) : num(set.reps);
  return reps <= 0 || repsInRange(reps, slot.reps); // blank reps can't be judged
}

/**
 * Is an archived exercise on-plan? It must be one the plan has, and most of its
 * counted working sets must land in (or near) the prescribed rep range.
 */
export function exerciseOnPlan(plan: Block[] | null, liftId: string, sets: LoggedSet[]): boolean {
  if (!plan) return true;
  const slot = planSlotFor(plan, liftId);
  if (!slot) return false;
  const working = sets.filter((s) => s.done && !s.warmup && num(s.reps) > 0);
  if (working.length === 0) return true;
  const inRange = working.filter((s) => setOnPlan(plan, liftId, s)).length;
  return inRange * 2 >= working.length;
}

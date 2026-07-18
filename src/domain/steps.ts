/**
 * Quick-step increments for logging a set by gesture instead of typing. Each
 * field has its own sensible deltas; applying one nudges the value and keeps it
 * on a valid grid.
 */
export type StepKind = 'weight' | 'reps' | 'rpe';

export interface Step {
  delta: number;
  /** Chip label, e.g. "+5" or "−1" (uses a real minus sign). */
  label: string;
}

const label = (d: number) => (d < 0 ? `−${Math.abs(d)}` : `+${d}`);
const step = (delta: number): Step => ({ delta, label: label(delta) });

/**
 * Increment sets offered per field, ascending (most-negative → most-positive),
 * symmetric so every up-step has a matching down-step.
 */
export const STEPS: Record<StepKind, Step[]> = {
  weight: [step(-10), step(-5), step(-2.5), step(2.5), step(5), step(10)],
  reps: [step(-2), step(-1), step(1), step(2)],
  rpe: [step(-1), step(-0.5), step(0.5), step(1)],
};

/** Apply a delta to a base value, clamped and snapped to the field's grid. */
export function stepValue(kind: StepKind, base: number, delta: number): number {
  const n = (Number.isFinite(base) ? base : 0) + delta;
  if (kind === 'reps') return Math.max(0, Math.round(n));
  if (kind === 'rpe') return Math.min(10, Math.max(1, Math.round(n * 2) / 2));
  return Math.max(0, Math.round(n * 2) / 2); // weight → nearest 0.5 kg
}

/** Display a stepped value without trailing zeros: 55, 52.5, 8.5. */
export function formatStepValue(n: number): string {
  return String(Math.round(n * 100) / 100);
}

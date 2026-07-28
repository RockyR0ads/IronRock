// Per-exercise settings: things you tune once for a lift and want to stick —
// rest between sets, which bar it's loaded on, etc. Kept separate from the
// program blocks so it survives swaps, resets and freestyle use.

import { BAR_KG } from './plates';
import type { Category, Increment } from './types';

export interface ExerciseConfig {
  /** Rest between sets, in seconds. Absent → the app default. */
  restSeconds?: number;
  /** Bar type id (see BAR_TYPES). Only meaningful for "kg on bar" lifts. */
  barType?: string;
  /** Per-exercise rounding increment, overriding the global one for its target. */
  inc?: Increment;
  /** Whether checking a set off starts the rest timer. Absent → on. */
  autoRest?: boolean;
  /** Count bodyweight in load/volume for bodyweight-loaded lifts (pull-up, dip). */
  includeBw?: boolean;
  /** Default new sets of a unilateral lift to per-side (L/R) logging. */
  perSideDefault?: boolean;
  /** Warm-up ramp preset id (see WARMUP_RAMPS) used by "Ramp up". */
  warmupRamp?: string;
  /** Tempo cue, e.g. "3-1-1" or "paused". Display-only. */
  tempo?: string;
  /** Personal cues / notes, shown under the stock instructions. */
  notes?: string;
}

/** Whether the rest timer should auto-start for this exercise (default on). */
export function autoRestOn(config: ExerciseConfig | undefined): boolean {
  return config?.autoRest !== false;
}

/** A lift whose "load" is really added weight over bodyweight (pull-up, dip). */
export function isBodyweightLoaded(unit: string): boolean {
  return unit === 'added kg';
}

export interface WarmupRamp {
  id: string;
  label: string;
  /** Fractions of the working weight, ascending. Empty = no ramp. */
  pct: number[];
}

/** Warm-up ramp presets — fractions of the top working weight. */
export const WARMUP_RAMPS: WarmupRamp[] = [
  { id: 'quick', label: 'Quick · 3 sets', pct: [0.4, 0.6, 0.8] },
  { id: 'full', label: 'Full · 4 sets', pct: [0.4, 0.55, 0.7, 0.85] },
];

/** Descending rep scheme for a ramp of the given length. */
const RAMP_REPS = [8, 5, 3, 2, 1];

/** Warm-up (weight, reps) pairs for a ramp preset, given the working weight. */
export function warmupSets(
  rampId: string | undefined,
  workingWeight: number,
  roundTo: (w: number) => number
): { w: number; reps: number }[] {
  const ramp = WARMUP_RAMPS.find((r) => r.id === rampId);
  if (!ramp || workingWeight <= 0) return [];
  return ramp.pct.map((p, i) => ({
    w: roundTo(workingWeight * p),
    reps: RAMP_REPS[Math.min(i, RAMP_REPS.length - 1)],
  }));
}

/** Selectable rest durations, in seconds. */
export const REST_OPTIONS = [60, 90, 120, 150, 180, 240, 300];

export interface BarOption {
  id: string;
  label: string;
  /** Empty-bar weight, kg — feeds the plate math. */
  weight: number;
  /**
   * Movement roles this bar suits. A straight bar (no `cats`) fits any barbell
   * lift; specialty bars only show for the movements they're actually used on.
   */
  cats?: Category[];
}

// Empty-bar weights are representative — specialty bars vary a lot by maker
// (a Swiss bar can be 16–20 kg, a cambered/buffalo bar 20–25 kg, etc.).
/** Bars a barbell lift might be loaded on, with their empty weight. */
export const BAR_TYPES: BarOption[] = [
  // straight bars — fit any barbell lift
  { id: 'olympic', label: 'Olympic bar', weight: 20 },
  { id: 'womens', label: "Women's / training bar", weight: 15 },
  { id: 'power', label: 'Power bar (stiff)', weight: 20 },
  // pressing specialty bars — the bench-friendly variations
  { id: 'swiss', label: 'Swiss / multi-grip bar', weight: 20, cats: ['hpress', 'vpress', 'hpull'] },
  { id: 'camber', label: 'Cambered bench bar', weight: 20, cats: ['hpress'] },
  { id: 'buffalo', label: 'Buffalo / bow bar', weight: 25, cats: ['hpress', 'squat'] },
  { id: 'axle', label: 'Axle / fat bar', weight: 20, cats: ['hpress', 'vpress', 'hpull'] },
  // lower-body / arm specialty bars
  { id: 'trap', label: 'Trap / hex bar', weight: 25, cats: ['hinge'] },
  { id: 'ssb', label: 'Safety-squat bar', weight: 25, cats: ['squat'] },
  { id: 'ez', label: 'EZ / curl bar', weight: 10, cats: ['biceps', 'triceps'] },
];

/** Bar options that make sense for a lift, given its movement roles. */
export function barsFor(cats: Category[]): BarOption[] {
  return BAR_TYPES.filter((b) => !b.cats || b.cats.some((c) => cats.includes(c)));
}

/** Resolve a config's bar type to an empty-bar weight (kg). */
export function barWeight(config: ExerciseConfig | undefined): number {
  const bar = BAR_TYPES.find((b) => b.id === config?.barType);
  return bar ? bar.weight : BAR_KG;
}

/** A lift that's loaded on a bar (so bar type applies). */
export function usesBar(unit: string): boolean {
  return unit === 'kg on bar';
}

/** Format a rest duration compactly, e.g. 90 → "1:30", 120 → "2:00". */
export function fmtRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`;
}

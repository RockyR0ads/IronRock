// Shared, framework-agnostic types for the IronRock domain layer.

/** Movement roles a lift can fill — used to filter the swap/add picker. */
export type Category =
  | 'hpress'
  | 'vpress'
  | 'hpull'
  | 'vpull'
  | 'squat'
  | 'hinge'
  | 'uni'
  | 'latdelt'
  | 'reardelt'
  | 'biceps'
  | 'triceps'
  | 'calf';

/**
 * A lift in the catalogue.
 * - `computed` lifts need a reference set and get a calculated load.
 * - `manual` lifts (isolation, RPE 9–10) just store a user-entered weight.
 */
export interface Lift {
  id: string;
  name: string;
  type: 'computed' | 'manual';
  /** Display unit, e.g. "kg on bar", "kg / DB". */
  unit: string;
  /** Movement roles this lift can fill. */
  cats: Category[];
  /** Unilateral (per-leg) lift. */
  uni?: boolean;
}

/** A fixed rep target or an inclusive [lo, hi] range. */
export type Reps = number | [number, number];

/** Left-border accent encoding intensity: heavy / volume / isolation. */
export type BlockClass = 'r-hi' | 'r-mid' | 'r-iso';

/** One exercise slot within a day. */
export interface Block {
  /** Lift id, keys into the LIFTS catalogue. */
  lift: string;
  sets: number;
  reps: Reps;
  /**
   * Numeric rpe drives the math. A string like "9–10" is display-only and
   * always belongs to a manual lift.
   */
  rpe: number | string;
  cls: BlockClass;
  cat: Category;
  /** Per-leg display (overrides/augments the lift's own `uni`). */
  perLeg?: boolean;
  /** Render the RPE as "7→8". */
  drift?: boolean;
}

/** A training day. */
export interface Day {
  key: string;
  label: string;
  variant: string;
  note: string;
  blocks: Block[];
}

/**
 * A user-entered reference set for a computed lift: the most reps they managed
 * with that weight at maximum effort. Effort is implicit — a reference set is
 * taken to failure, i.e. RPE 10 — so only weight and reps are recorded.
 * Stored as strings (raw inputs).
 */
export interface RefSet {
  w?: string;
  reps?: string;
}

/** Rounding increment for computed loads. */
export type Increment = 1 | 2.5 | 5;

/** A single performed working set, logged against a block. Raw input strings. */
export interface LoggedSet {
  w: string;
  reps: string;
  rpe: string;
  /** Explicitly checked off as completed. Drives card completion. */
  done?: boolean;
}

/** Last recorded set for a lift, used as a "last time" hint. */
export type LiftHistory = Pick<LoggedSet, 'w' | 'reps' | 'rpe'>;

/** One exercise as it was actually performed in an archived session. */
export interface SessionExercise {
  liftId: string;
  /** Name resolved at archive time, so history survives a renamed custom lift. */
  name: string;
  /** Only the sets that were checked off. */
  sets: LoggedSet[];
}

/** A finished workout, archived when the user completes it. */
export interface Session {
  id: string;
  /** ISO timestamp of when it was completed. */
  at: string;
  /** Day it came from: a program day key, or the freestyle key. */
  dayKey: string;
  /** Display name at archive time, e.g. "Push" or "Freestyle". */
  title: string;
  exercises: SessionExercise[];
}

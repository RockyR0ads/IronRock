import { estimate1Rm, round } from './calc';
import type { Increment, LoggedSet } from './types';

/** One exercise's logged work, as handed to the stats calculator. */
export interface StatsEntry {
  name: string;
  sets: LoggedSet[];
}

export interface ExerciseStats {
  name: string;
  /** Sets checked off as done. */
  sets: number;
  reps: number;
  /** weight × reps summed over the done sets, kg. */
  volume: number;
  /** Heaviest done set (ties broken by reps). */
  topSet: LoggedSet | null;
  /** Estimated 1RM from the top set, rounded — null if it can't be estimated. */
  e1rm: number | null;
}

export interface WorkoutStats {
  exercises: ExerciseStats[];
  sets: number;
  reps: number;
  volume: number;
  /** Mean RPE across done sets that recorded one, or null. */
  avgRpe: number | null;
  /** Exercise with the most volume, or null when nothing was logged. */
  topExercise: ExerciseStats | null;
}

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

/** A set counts toward stats only if it's a working set that was checked off. */
const counts = (s: LoggedSet) => !!s.done && !s.warmup;

function statsForEntry(entry: StatsEntry, inc: Increment): ExerciseStats {
  const done = entry.sets.filter(counts);
  let reps = 0;
  let volume = 0;
  let topSet: LoggedSet | null = null;

  for (const set of done) {
    const w = num(set.w);
    const r = num(set.reps);
    reps += r;
    volume += w * r;
    if (!topSet) {
      topSet = set;
    } else {
      const tw = num(topSet.w);
      if (w > tw || (w === tw && r > num(topSet.reps))) topSet = set;
    }
  }

  const raw = topSet ? estimate1Rm(num(topSet.w), num(topSet.reps), num(topSet.rpe)) : null;
  return {
    name: entry.name,
    sets: done.length,
    reps,
    volume: Math.round(volume * 10) / 10,
    topSet,
    e1rm: raw === null ? null : round(raw, inc),
  };
}

/**
 * Summarise a finished session: per-exercise work plus the session totals.
 * Only sets the user checked off count — half-entered rows are ignored.
 * Exercises with no completed sets are dropped.
 */
export function workoutStats(entries: StatsEntry[], inc: Increment): WorkoutStats {
  const exercises = entries.map((e) => statsForEntry(e, inc)).filter((e) => e.sets > 0);

  const sets = exercises.reduce((n, e) => n + e.sets, 0);
  const reps = exercises.reduce((n, e) => n + e.reps, 0);
  const volume = Math.round(exercises.reduce((n, e) => n + e.volume, 0) * 10) / 10;

  const rpes = entries
    .flatMap((e) => e.sets)
    .filter(counts)
    .map((s) => num(s.rpe))
    .filter((r) => r > 0);
  const avgRpe = rpes.length
    ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10
    : null;

  const topExercise = exercises.reduce<ExerciseStats | null>(
    (best, e) => (!best || e.volume > best.volume ? e : best),
    null
  );

  return { exercises, sets, reps, volume, avgRpe, topExercise };
}

/** Compact display for a volume figure, split so the unit can be styled apart. */
export function volumeParts(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(1), unit: 't' };
  return { value: String(Math.round(kg)), unit: 'kg' };
}

/** Compact display for a volume figure: "7.4 t" once it gets big, else kg. */
export function volumeLabel(kg: number): string {
  const { value, unit } = volumeParts(kg);
  return `${value} ${unit}`;
}

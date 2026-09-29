import type { LoggedSet } from './types';

/**
 * Timing derived from set check-off timestamps. Note we only capture when a set
 * is *completed* (`at`), not when it starts — so the between-sets figure is the
 * interval between consecutive check-offs (work + rest), not pure rest. Labelled
 * accordingly in the UI.
 */
export interface WorkoutTiming {
  /** ISO of the first counted set — the workout's start. */
  startedAt?: string;
  /** Whole-session length: first counted set → completion. */
  durationSec: number;
  /** Counted (done, non-warm-up) sets with a timestamp. */
  sets: number;
  /** Mean seconds between consecutive set check-offs, or null with < 2 sets. */
  avgIntervalSec: number | null;
}

/** Sorted epoch-ms of counted (done, non-warm-up) sets that carry a timestamp. */
function doneTimes(rows: LoggedSet[][]): number[] {
  const ts: number[] = [];
  for (const row of rows) {
    for (const s of row) {
      if (s.done && !s.warmup && s.at) {
        const t = Date.parse(s.at);
        if (!Number.isNaN(t)) ts.push(t);
      }
    }
  }
  return ts.sort((a, b) => a - b);
}

/** The ISO of the earliest counted set, or undefined if none — the workout start. */
export function workoutStartedAt(rows: LoggedSet[][]): string | undefined {
  const times = doneTimes(rows);
  return times.length ? new Date(times[0]).toISOString() : undefined;
}

/** Compute session timing from the day's log rows and the completion time. */
export function workoutTiming(rows: LoggedSet[][], endedAtISO: string): WorkoutTiming {
  const times = doneTimes(rows);
  const endedMs = Date.parse(endedAtISO);
  const startMs = times.length ? times[0] : endedMs;
  let gapSum = 0;
  let gaps = 0;
  for (let i = 1; i < times.length; i++) {
    gapSum += (times[i] - times[i - 1]) / 1000;
    gaps += 1;
  }
  return {
    startedAt: times.length ? new Date(times[0]).toISOString() : undefined,
    durationSec: Math.max(0, Math.round((endedMs - startMs) / 1000)),
    sets: times.length,
    avgIntervalSec: gaps > 0 ? Math.round(gapSum / gaps) : null,
  };
}

/** "1h 05m" / "42m" / "0:45" — compact human duration. */
export function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

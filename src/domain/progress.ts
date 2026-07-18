import { estimate1Rm, round } from './calc';
import type { Increment, LoggedSet, Session } from './types';

/**
 * One session's worth of work for a single lift, reduced to the handful of
 * numbers worth plotting on a progress chart.
 */
export interface ProgressPoint {
  /** ISO timestamp of the session. */
  at: string;
  /** Short date label, e.g. "12 Jul". */
  label: string;
  /** Estimated 1RM from the top working set (falls back to its weight if no RPE). */
  e1rm: number;
  /** Heaviest working set that session, kg. */
  topWeight: number;
  /** Reps on that top set. */
  topReps: number;
  /** weight × reps summed over the working sets, kg. */
  volume: number;
  /** Number of working sets that counted. */
  sets: number;
  /** Mean RPE across the working sets that recorded one, or null. */
  avgRpe: number | null;
}

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

/** Only working sets that were checked off feed the charts — no warm-ups. */
const counts = (s: LoggedSet) => !!s.done && !s.warmup;

/** Short "12 Jul" style label for a session timestamp. */
export function shortDate(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Build the per-session progress series for one lift, oldest first. Sessions
 * with no counted work for the lift are skipped, so the series is exactly the
 * sessions where the lift was actually trained.
 */
export function exerciseSeries(
  sessions: Session[],
  liftId: string,
  inc: Increment
): ProgressPoint[] {
  const points: ProgressPoint[] = [];

  for (const session of sessions) {
    const sets = session.exercises
      .filter((ex) => ex.liftId === liftId)
      .flatMap((ex) => ex.sets)
      .filter(counts);
    if (sets.length === 0) continue;

    let topSet: LoggedSet | null = null;
    let volume = 0;
    const rpes: number[] = [];

    for (const set of sets) {
      const w = num(set.w);
      const r = num(set.reps);
      const rp = num(set.rpe);
      volume += w * r;
      if (rp > 0) rpes.push(rp);
      if (!topSet) {
        topSet = set;
      } else {
        const tw = num(topSet.w);
        if (w > tw || (w === tw && r > num(topSet.reps))) topSet = set;
      }
    }

    const tw = num(topSet!.w);
    const tr = num(topSet!.reps);
    const raw = estimate1Rm(tw, tr, num(topSet!.rpe));

    points.push({
      at: session.at,
      label: shortDate(session.at),
      e1rm: raw === null ? tw : round(raw, inc),
      topWeight: tw,
      topReps: tr,
      volume: Math.round(volume),
      sets: sets.length,
      avgRpe: rpes.length
        ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10
        : null,
    });
  }

  return points.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** First → last change in a series of numbers, absolute and as a percentage. */
export function seriesDelta(values: number[]): { abs: number; pct: number | null } {
  if (values.length < 2) return { abs: 0, pct: null };
  const first = values[0];
  const last = values[values.length - 1];
  const abs = Math.round((last - first) * 10) / 10;
  const pct = first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : null;
  return { abs, pct };
}

/** Headline figures for a metric series — powers the detail view's stat grid. */
export interface SeriesSummary {
  first: number;
  latest: number;
  peak: number;
  /** Index of the peak value (first occurrence). */
  peakIndex: number;
  mean: number;
}

/** Summarise a series of numbers, or null when empty. */
export function summarize(values: number[]): SeriesSummary | null {
  if (values.length === 0) return null;
  let peak = values[0];
  let peakIndex = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
      peakIndex = i;
    }
  }
  const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  return { first: values[0], latest: values[values.length - 1], peak, peakIndex, mean };
}

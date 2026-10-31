// Coaching read-outs built on the logged history: weekly sets per muscle
// against the plan, stalled lifts, readiness, and the cut's calorie loop.
// All pure functions over sessions / weigh-ins — nothing is stored.

import { muscleGroupOf } from './overview';
import { exerciseSeries } from './progress';
import type { Day, Increment, Session } from './types';
import type { WeighIn } from './weightTracker';

export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'] as const;
export type Muscle = (typeof MUSCLES)[number];

const working = (s: { done?: boolean; warmup?: boolean }) => !!s.done && !s.warmup;

export interface MuscleVolume {
  muscle: Muscle;
  /** Working sets done this week. */
  done: number;
  /** Sets the program prescribes per week. */
  target: number;
}

/**
 * Working sets per muscle group done since `since`, against what the program's
 * days prescribe for a full week. Groups with no target and no work are left out.
 */
export function weeklyMuscleSets(
  sessions: Session[],
  days: Day[],
  since: string | undefined,
  customGroups: Record<string, string> = {}
): MuscleVolume[] {
  const target = new Map<string, number>();
  for (const d of days) for (const b of d.blocks) {
    const g = muscleGroupOf(b.lift, customGroups);
    target.set(g, (target.get(g) ?? 0) + b.sets);
  }
  const done = new Map<string, number>();
  for (const s of sessions) {
    if (since && s.at < since) continue;
    for (const ex of s.exercises) {
      const g = muscleGroupOf(ex.liftId, customGroups);
      done.set(g, (done.get(g) ?? 0) + ex.sets.filter(working).length);
    }
  }
  return MUSCLES.map((muscle) => ({ muscle, done: done.get(muscle) ?? 0, target: target.get(muscle) ?? 0 })).filter(
    (m) => m.target > 0 || m.done > 0
  );
}

export interface Plateau {
  liftId: string;
  name: string;
  /** Weeks since the estimated 1RM last went up. */
  weeks: number;
  /** Best estimated 1RM, kg. */
  best: number;
  /** What to try next. */
  advice: string;
}

/**
 * Lifts trained recently whose best estimated 1RM hasn't improved in `minWeeks`
 * or more, over at least three sessions since. Off-plan and timed work is skipped.
 */
export function findPlateaus(sessions: Session[], inc: Increment, minWeeks = 4, now = Date.now()): Plateau[] {
  const recentCut = new Date(now - 21 * 864e5).toISOString();
  const ids = new Map<string, string>();
  for (const s of sessions) {
    if (s.at < recentCut) break; // sessions are newest first
    for (const ex of s.exercises) if (!ex.offPlan && !ids.has(ex.liftId)) ids.set(ex.liftId, ex.name);
  }
  const out: Plateau[] = [];
  for (const [liftId, name] of ids) {
    const series = exerciseSeries(sessions, liftId, inc).filter((p) => p.e1rm > 0);
    if (series.length < 4) continue;
    let best = 0;
    let bestAt = series[0].at;
    for (const p of series) if (p.e1rm > best) { best = p.e1rm; bestAt = p.at; }
    const since = series.filter((p) => p.at > bestAt).length;
    const weeks = Math.floor((now - Date.parse(bestAt)) / (7 * 864e5));
    if (weeks < minWeeks || since < 3) continue;
    out.push({
      liftId,
      name,
      weeks,
      best,
      advice:
        weeks >= 8
          ? 'Swap to a close variation for a block (pause, tempo or a different bar), then come back.'
          : 'Drop 5–10% and build back up, or shift the rep range for a few weeks.',
    });
  }
  return out.sort((a, b) => b.weeks - a.weeks);
}

/** Pre-workout check-in: three 1–5 ratings (5 = best). */
export interface Readiness {
  sleep: number;
  energy: number;
  soreness: number;
}

/**
 * How much to ease today's RPE targets from a check-in: none when you feel
 * normal, −0.5 on a flat day, −1 when you're beaten up.
 */
export function readinessAdjust(r: Readiness): { adjust: number; label: string } {
  const score = (r.sleep + r.energy + r.soreness) / 3;
  if (score <= 2) return { adjust: -1, label: 'Rough day — targets eased 1 RPE. Hold form, skip grinders.' };
  if (score < 3) return { adjust: -0.5, label: 'A bit flat — targets eased ½ RPE.' };
  return { adjust: 0, label: 'Good to go — train as planned.' };
}

export interface CalorieAdvice {
  /** Loss rate over the last two weeks, kg/week (positive = losing). */
  rate: number;
  /** kcal/day to change by. */
  change: number;
  message: string;
}

/**
 * The cut's two-week loop: compare this week's 7-day average weight with the
 * one two weeks earlier and nudge calories by ~200 kcal outside 0.3–0.8 kg/week.
 * Needs weigh-ins spanning at least two weeks.
 */
export function calorieAdvice(weighIns: WeighIn[], now = Date.now()): CalorieAdvice | null {
  const avg = (fromDays: number, toDays: number) => {
    const from = now - fromDays * 864e5;
    const to = now - toDays * 864e5;
    const w = weighIns.filter((x) => {
      const t = Date.parse(x.at);
      return t > from && t <= to;
    });
    return w.length >= 3 ? w.reduce((n, x) => n + x.kg, 0) / w.length : null;
  };
  const recent = avg(7, 0);
  const earlier = avg(21, 14);
  if (recent === null || earlier === null) return null;
  const rate = Math.round(((earlier - recent) / 2) * 100) / 100;
  if (rate < 0.3)
    return { rate, change: -200, message: `Losing ${rate} kg/week — below 0.3. Cut ~200 kcal/day (from carbs/fat, keep protein).` };
  if (rate > 0.8)
    return { rate, change: 200, message: `Losing ${rate} kg/week — faster than 0.8. Add ~200 kcal/day to protect strength.` };
  return { rate, change: 0, message: `Losing ${rate} kg/week — right in the 0.3–0.8 window. No change.` };
}

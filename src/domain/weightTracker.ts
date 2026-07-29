/**
 * Body-weight goal tracking: a series of weigh-ins against a target weight by a
 * target date. Everything the page needs — progress, the pace you're on, and
 * whether that lands you on the straight-line plan — is derived here.
 */

/** One weigh-in: a date (YYYY-MM-DD) and a weight in kg. */
export interface WeighIn {
  at: string;
  kg: number;
}

export interface WeightGoal {
  /** Target weight, kg (raw input). */
  target?: string;
  /** Target date, YYYY-MM-DD (raw input). */
  date?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface WeightProgress {
  start: WeighIn;
  latest: WeighIn;
  targetKg: number;
  targetDate: string;
  /** kg lost so far (start − latest; positive = lost). */
  lost: number;
  /** kg still between latest and target (positive = still to lose). */
  toGo: number;
  /** kg from start to target. */
  totalToLose: number;
  /** 0–100 progress from start toward target. */
  pctComplete: number;
  /** Whole days from now to the target date (can be negative if past). */
  daysLeft: number;
  /** kg/week you've actually averaged (start → latest). */
  actualRatePerWeek: number;
  /** kg/week you now need to average to hit target by the date. */
  requiredRatePerWeek: number;
  /** Where the straight-line plan says you should be today. */
  idealNow: number;
  /** At or below the plan line today. */
  onTrack: boolean;
  /** Projected weight on the target date if the current pace holds. */
  projectedKgByTarget: number;
  /** Date you'd reach target at the current pace, or null if not progressing. */
  projectedDate: string | null;
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Reduce the weigh-ins + goal to a progress snapshot, or null when there isn't
 * enough to work with (need at least one weigh-in, a target weight and a date).
 */
export function weightProgress(
  weighIns: WeighIn[],
  goal: WeightGoal,
  now: Date = new Date()
): WeightProgress | null {
  const targetKg = parseFloat(goal.target ?? '');
  const targetDate = goal.date;
  if (!(weighIns.length > 0) || !(targetKg > 0) || !targetDate) return null;

  const sorted = [...weighIns].sort((a, b) => a.at.localeCompare(b.at));
  const start = sorted[0];
  const latest = sorted[sorted.length - 1];

  const startMs = new Date(start.at).getTime();
  const latestMs = new Date(latest.at).getTime();
  const targetMs = new Date(targetDate).getTime();
  const nowMs = now.getTime();

  const totalToLose = start.kg - targetKg;
  const lost = start.kg - latest.kg;
  const toGo = latest.kg - targetKg;
  const pctComplete =
    totalToLose === 0 ? 100 : Math.max(0, Math.min(100, (lost / totalToLose) * 100));

  const daysLeft = Math.round((targetMs - nowMs) / DAY_MS);

  const weeksElapsed = (latestMs - startMs) / WEEK_MS;
  const actualRatePerWeek = weeksElapsed > 0 ? lost / weeksElapsed : 0;

  const weeksRemaining = Math.max(0, (targetMs - nowMs) / WEEK_MS);
  const requiredRatePerWeek = weeksRemaining > 0 ? toGo / weeksRemaining : toGo;

  // straight-line plan from the first weigh-in to the target
  const span = targetMs - startMs;
  const frac = span > 0 ? Math.max(0, Math.min(1, (nowMs - startMs) / span)) : 1;
  const idealNow = start.kg + (targetKg - start.kg) * frac;
  const onTrack = latest.kg <= idealNow + 0.05;

  // project the current pace forward to the target date
  const weeksLatestToTarget = (targetMs - latestMs) / WEEK_MS;
  const projectedKgByTarget = latest.kg - actualRatePerWeek * weeksLatestToTarget;

  let projectedDate: string | null = null;
  if (actualRatePerWeek > 0 && toGo > 0) {
    const weeksToHit = toGo / actualRatePerWeek;
    projectedDate = iso(latestMs + weeksToHit * WEEK_MS);
  } else if (toGo <= 0) {
    projectedDate = latest.at; // already there
  }

  return {
    start,
    latest,
    targetKg,
    targetDate,
    lost,
    toGo,
    totalToLose,
    pctComplete,
    daysLeft,
    actualRatePerWeek,
    requiredRatePerWeek,
    idealNow,
    onTrack,
    projectedKgByTarget,
    projectedDate,
  };
}

/** Round a kg value for display: 80.25 → "80.3", 80 → "80". */
export function fmtKg(kg: number): string {
  return (Math.round(kg * 10) / 10).toString();
}

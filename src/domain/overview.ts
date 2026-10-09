import { LIFTS } from './lifts';
import { LIBRARY_BY_ID, groupOfMuscles, type MuscleGroup } from './library';
import { setReps } from './stats';
import { sessionDurationSec } from './workoutTiming';
import type { Session } from './types';
import type { WeighIn } from './weightTracker';

/**
 * Whole-history training aggregates for the overview dashboard: volume and
 * workout counts bucketed by week or month, a training-frequency streak, set
 * counts per muscle group, and the bodyweight series — all optionally clipped
 * to a trailing time window.
 */

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const counts = (s: { done?: boolean; warmup?: boolean }) => !!s.done && !s.warmup;

export type Granularity = 'week' | 'month';

export interface Bucket {
  /** ms timestamp of the bucket's start. */
  start: number;
  label: string;
  volume: number;
  workouts: number;
  /** Sum of session durations (seconds) for workouts in this bucket that have one. */
  durationSec: number;
  /** Workouts in this bucket that carried a duration. */
  timedWorkouts: number;
  /** Volume (kg) from just the timed workouts — the denominator-matched pace numerator. */
  timedVolume: number;
}

export interface Overview {
  buckets: Bucket[];
  granularity: Granularity;
  totalWorkouts: number;
  windowWorkouts: number;
  /** Mean workouts per week over the window. */
  avgPerWeek: number;
  /** Mean session length (seconds) over timed workouts in the window, or null. */
  avgDurationSec: number | null;
  /** Trailing consecutive weeks with ≥1 workout (whole history). */
  streakWeeks: number;
  byGroup: { group: MuscleGroup; sets: number }[];
  bodyweight: { at: number; kg: number }[];
}

const WEEK_MS = 7 * 86_400_000;

/** Monday-00:00 (local) for a date. */
function startOfWeek(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - dow);
  return d.getTime();
}
function startOfMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function addMonth(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function weekLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function monthLabel(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

const CAT_GROUP: Record<string, MuscleGroup> = {
  hpress: 'Chest',
  vpress: 'Shoulders',
  latdelt: 'Shoulders',
  reardelt: 'Shoulders',
  hpull: 'Back',
  vpull: 'Back',
  squat: 'Legs',
  hinge: 'Legs',
  uni: 'Legs',
  calf: 'Legs',
  biceps: 'Arms',
  triceps: 'Arms',
};

const GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Other'];

/** Best-effort muscle group for a lift id, across catalogue / library / custom. */
export function muscleGroupOf(
  liftId: string,
  customGroups: Record<string, string>
): MuscleGroup {
  const cat = LIFTS[liftId]?.cats?.[0];
  if (cat && CAT_GROUP[cat]) return CAT_GROUP[cat];
  const lib = LIBRARY_BY_ID[liftId];
  if (lib) return groupOfMuscles(lib.muscles);
  const g = customGroups[liftId];
  if (g && (GROUPS as string[]).includes(g)) return g as MuscleGroup;
  return 'Other';
}

export interface OverviewOpts {
  /** Trailing window in days from the latest session; Infinity = all history. */
  days?: number;
  customGroups?: Record<string, string>;
  weighIns?: WeighIn[];
  now?: number;
}

export function buildOverview(sessions: Session[], opts: OverviewOpts = {}): Overview {
  const days = opts.days ?? Infinity;
  const customGroups = opts.customGroups ?? {};
  const empty: Overview = {
    buckets: [],
    granularity: 'week',
    totalWorkouts: sessions.length,
    windowWorkouts: 0,
    avgPerWeek: 0,
    avgDurationSec: null,
    streakWeeks: 0,
    byGroup: [],
    bodyweight: [],
  };
  if (sessions.length === 0) return empty;

  const times = sessions.map((s) => new Date(s.at).getTime()).filter(Number.isFinite);
  if (times.length === 0) return empty;
  const latest = Math.max(...times);
  const cut = Number.isFinite(days) ? latest - days * 86_400_000 : -Infinity;

  const inWindow = sessions.filter((s) => {
    const t = new Date(s.at).getTime();
    return Number.isFinite(t) && t >= cut;
  });

  // granularity: weekly for short windows, monthly once a window spans ~>26 weeks
  const spanDays = (latest - (Number.isFinite(cut) ? cut : Math.min(...times))) / 86_400_000;
  const granularity: Granularity = spanDays > 200 ? 'month' : 'week';

  // bucket volume + workout counts
  const bucketStart = granularity === 'week' ? startOfWeek : startOfMonth;
  const nextStart = (ms: number) => (granularity === 'week' ? ms + WEEK_MS : addMonth(ms));
  const label = granularity === 'week' ? weekLabel : monthLabel;

  type Acc = { volume: number; workouts: number; durationSec: number; timedWorkouts: number; timedVolume: number };
  const byBucket = new Map<number, Acc>();
  const byGroupSets = new Map<MuscleGroup, number>();
  let durationTotal = 0;
  let timedTotal = 0;

  for (const s of inWindow) {
    const t = new Date(s.at).getTime();
    const bk = bucketStart(t);
    const cur = byBucket.get(bk) ?? { volume: 0, workouts: 0, durationSec: 0, timedWorkouts: 0, timedVolume: 0 };
    cur.workouts += 1;
    let sessionVol = 0;
    for (const ex of s.exercises) {
      const g = muscleGroupOf(ex.liftId, customGroups);
      for (const set of ex.sets) {
        if (!counts(set)) continue;
        const v = num(set.w) * setReps(set);
        sessionVol += v;
        byGroupSets.set(g, (byGroupSets.get(g) ?? 0) + 1);
      }
    }
    cur.volume += sessionVol;
    const dur = sessionDurationSec(s);
    if (dur !== null) {
      cur.durationSec += dur;
      cur.timedWorkouts += 1;
      cur.timedVolume += sessionVol;
      durationTotal += dur;
      timedTotal += 1;
    }
    byBucket.set(bk, cur);
  }

  // fill the bucket sequence from first→last so gaps show as empty bars
  const starts = [...byBucket.keys()].sort((a, b) => a - b);
  const buckets: Bucket[] = [];
  if (starts.length > 0) {
    let cursor = starts[0];
    const end = starts[starts.length - 1];
    // guard against pathological unbounded loops
    for (let i = 0; cursor <= end && i < 1000; i++) {
      const b = byBucket.get(cursor) ?? {
        volume: 0,
        workouts: 0,
        durationSec: 0,
        timedWorkouts: 0,
        timedVolume: 0,
      };
      buckets.push({
        start: cursor,
        label: label(cursor),
        volume: Math.round(b.volume),
        workouts: b.workouts,
        durationSec: b.durationSec,
        timedWorkouts: b.timedWorkouts,
        timedVolume: Math.round(b.timedVolume),
      });
      cursor = nextStart(cursor);
    }
  }

  // trailing week streak over ALL history (independent of the window)
  const weekSet = new Set(times.map(startOfWeek));
  let streakWeeks = 0;
  let wk = startOfWeek(latest);
  while (weekSet.has(wk)) {
    streakWeeks += 1;
    wk -= WEEK_MS;
  }

  const windowWorkouts = inWindow.length;
  // average over the span the data actually covers in the window, not the
  // nominal window length — otherwise dense history in a wide window reads low
  const inWindowTimes = inWindow.map((s) => new Date(s.at).getTime()).filter(Number.isFinite);
  const dataSpanDays =
    inWindowTimes.length > 1 ? (latest - Math.min(...inWindowTimes)) / 86_400_000 : 7;
  const weeksSpanned = Math.max(1, Math.round(dataSpanDays / 7));
  const avgPerWeek = Math.round((windowWorkouts / weeksSpanned) * 10) / 10;

  const byGroup = GROUPS.map((group) => ({ group, sets: byGroupSets.get(group) ?? 0 })).filter(
    (g) => g.sets > 0
  );

  const bodyweight = (opts.weighIns ?? [])
    .map((w) => ({ at: new Date(w.at).getTime(), kg: w.kg }))
    .filter((w) => Number.isFinite(w.at) && w.at >= cut)
    .sort((a, b) => a.at - b.at);

  return {
    buckets,
    granularity,
    totalWorkouts: sessions.length,
    windowWorkouts,
    avgPerWeek,
    avgDurationSec: timedTotal > 0 ? Math.round(durationTotal / timedTotal) : null,
    streakWeeks,
    byGroup,
    bodyweight,
  };
}

import { DAYS, daysForProgram } from './program';
import { programMeta } from './programs';
import { W531_DAYS } from './wendler531';
import type { Session } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const startOfDay = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const PPL_KEYS = new Set(DAYS.map((d) => d.key));
const W531_KEYS = new Set(W531_DAYS.map((d) => d.key));

/** The tracking shape of a program: how long its block is and what a full week looks like. */
export interface ProgramCycle {
  /** Weeks per block/cycle, the last of which is the deload. */
  cycleWeeks: number;
  /** Sessions in a full training week. */
  targetSessions: number;
  /** Whether an archived session counts toward this program (by its day). */
  counts: (s: Session) => boolean;
  /** The program's days in order — a week is done once each has been trained. */
  dayKeys: string[];
  /** The program day a counted session was, mapping renamed (legacy) keys. */
  dayOf: (s: Session) => string | undefined;
}

/** PPL cut: a six-week block, six sessions a week. */
export const PPL_CYCLE: ProgramCycle = {
  cycleWeeks: 6,
  targetSessions: 6,
  counts: (s) => PPL_KEYS.has(s.dayKey),
  dayKeys: [...PPL_KEYS],
  dayOf: (s) => (PPL_KEYS.has(s.dayKey) ? s.dayKey : undefined),
};

/** 5/3/1: a four-week wave, four sessions a week. */
export const W531_CYCLE: ProgramCycle = {
  cycleWeeks: 4,
  targetSessions: 4,
  counts: (s) => W531_KEYS.has(s.dayKey),
  dayKeys: [...W531_KEYS],
  dayOf: (s) => (W531_KEYS.has(s.dayKey) ? s.dayKey : undefined),
};

/** Day keys a program used before its days were renamed, so old sessions still count. */
const LEGACY_KEYS: Record<string, Record<string, string>> = {
  'upper-lower-arms': {
    pplvPush: 'ppl4PushH',
    pplvPull: 'ppl4PullH',
    pplvUpper: 'ppl4PushV',
    pplvLegsArms: 'ppl4LegsPull',
  },
};

/** The tracking cycle for a program id (defaults to the PPL cut). */
export function programCycle(programId: string): ProgramCycle {
  if (programId === 'wendler-531') return W531_CYCLE;
  if (programId === 'ppl-cut') return PPL_CYCLE;
  // any other day-based program: its own block length, days a week and day keys
  const days = daysForProgram(programId);
  const legacy = LEGACY_KEYS[programId] ?? {};
  const dayKeys = days.map((d) => d.key);
  const dayOf = (s: Session) => (dayKeys.includes(s.dayKey) ? s.dayKey : legacy[s.dayKey]);
  const meta = programMeta(programId);
  return {
    cycleWeeks: meta?.weeks ?? 8,
    targetSessions: meta?.days || days.length || 3,
    counts: (s) => !!dayOf(s),
    dayKeys,
    dayOf,
  };
}

export interface ProgramProgress {
  /** Weeks since the block started (1-based; the current week). */
  weekOverall: number;
  /** 1-based block number. */
  block: number;
  /** 1-based week within the current block (1…DELOAD_WEEKS). */
  weekInBlock: number;
  /** This week is the block's deload week. */
  isDeload: boolean;
  /** Weeks until the next deload (0 when this week is the deload). */
  weeksToDeload: number;
  /** Sessions completed in the current week. */
  sessionsThisWeek: number;
  /** Sessions per week across the current block (length DELOAD_WEEKS). */
  weekCounts: number[];
  /** Sessions logged since the block start date. */
  totalSessions: number;
  /** Weeks per block, echoed from the cycle for rendering. */
  cycleWeeks: number;
  /** Sessions in a full week, echoed from the cycle for rendering. */
  targetSessions: number;
}

/**
 * Where the lifter is in the program, anchored to a start date. Weeks are rolling
 * 7-day windows from the start; the block cycles every `cycle.cycleWeeks` with the
 * last week being the deload. Only sessions the cycle counts feed the numbers.
 */
export function programProgress(
  sessions: Session[],
  startISO: string,
  cycle: ProgramCycle = PPL_CYCLE,
  now: Date = new Date()
): ProgramProgress {
  const { cycleWeeks, targetSessions } = cycle;
  // freestyle / off-program workouts don't count toward this program
  sessions = sessions.filter(cycle.counts);
  const start = new Date(startISO).getTime();
  const elapsed = Math.max(0, now.getTime() - start);
  const weeksElapsed = Math.floor(elapsed / WEEK_MS); // 0-based
  const weekOverall = weeksElapsed + 1;
  const block = Math.floor(weeksElapsed / cycleWeeks) + 1;
  const weekInBlock = (weeksElapsed % cycleWeeks) + 1;
  const isDeload = weekInBlock === cycleWeeks;
  const weeksToDeload = isDeload ? 0 : cycleWeeks - weekInBlock;

  // sessions falling in each rolling week of the current block
  const blockStartWeek = weeksElapsed - (weekInBlock - 1); // 0-based index of week 1 of this block
  const weekCounts = Array.from({ length: cycleWeeks }, (_, w) => {
    const from = start + (blockStartWeek + w) * WEEK_MS;
    const to = from + WEEK_MS;
    return sessions.filter((s) => {
      const t = new Date(s.at).getTime();
      return t >= from && t < to;
    }).length;
  });

  const totalSessions = sessions.filter((s) => new Date(s.at).getTime() >= start).length;

  return {
    weekOverall,
    block,
    weekInBlock,
    isDeload,
    weeksToDeload,
    sessionsThisWeek: weekCounts[weekInBlock - 1],
    weekCounts,
    totalSessions,
    cycleWeeks,
    targetSessions,
  };
}

/** A week number the lifter set by hand, from a point in time onward. */
export interface WeekSet {
  week: number;
  /** ISO time the set week began — workouts from here count toward it. */
  at: string;
}

/** One week of the rotation, as it actually played out. */
export interface WeekRecord {
  /** Week number (overall, 1-based). */
  week: number;
  /** First workout of the week. */
  start: string;
  /** The workout that completed it; undefined for the week in progress. */
  end?: string;
  /** Calendar days from first to last workout, inclusive. */
  days: number;
  /** Workouts logged in the week (repeats included). */
  sessions: number;
  /** Longest stretch between two workouts in the week, in whole days. */
  longestGap: number;
}

export interface RotationProgress extends ProgramProgress {
  /** Every week so far, oldest first; the last may be in progress. */
  history: WeekRecord[];
  /** Program days already trained in the current week. */
  doneThisWeek: string[];
  /** When the current week began: the workout that finished the last one, or the start. */
  weekStartedAt?: string;
  /** Why the count is what it is. */
  source: 'auto' | 'manual';
}

/**
 * Where the lifter is in the program, counted by **completed weeks of
 * training**, not the calendar: a week is done once every program day has been
 * trained, and the next workout starts the following week. Counting begins
 * after the later of the tapped start, the last deload and a hand-set week (which
 * also sets the starting number). Off-program workouts don't count; repeating a
 * day before the week is finished still counts as a session but doesn't move it.
 */
export function rotationProgress(
  sessions: Session[],
  cycle: ProgramCycle,
  opts: { programStart?: string; lastDeload?: string; weekSet?: WeekSet } = {}
): RotationProgress {
  const { programStart, lastDeload, weekSet } = opts;
  const manual = !!weekSet && (!lastDeload || weekSet.at >= lastDeload);
  const from = [programStart, lastDeload, manual ? weekSet!.at : undefined]
    .filter((d): d is string => !!d)
    .sort()
    .pop();
  let week = manual ? weekSet!.week : 1;
  const counted = sessions
    .filter((s) => cycle.dayOf(s) && (!from || s.at >= from))
    .sort((a, b) => a.at.localeCompare(b.at));

  const counts = new Map<number, number>();
  let done = new Set<string>();
  let weekStartedAt = from;
  const history: WeekRecord[] = [];
  let cur: { start: string; last: string; sessions: number; gap: number } | null = null;
  const dayDiff = (a: string, b: string) => Math.round((startOfDay(b) - startOfDay(a)) / 864e5);
  for (const s of counted) {
    if (!cur) cur = { start: s.at, last: s.at, sessions: 0, gap: 0 };
    cur.gap = Math.max(cur.gap, dayDiff(cur.last, s.at));
    cur.last = s.at;
    cur.sessions += 1;
    done.add(cycle.dayOf(s)!);
    counts.set(week, (counts.get(week) ?? 0) + 1);
    if (cycle.dayKeys.every((k) => done.has(k))) {
      history.push({ week, start: cur.start, end: s.at, days: dayDiff(cur.start, s.at) + 1, sessions: cur.sessions, longestGap: cur.gap });
      cur = null;
      week += 1;
      done = new Set();
      weekStartedAt = s.at;
    }
  }

  if (cur) history.push({ week, start: cur.start, days: dayDiff(cur.start, new Date().toISOString()) + 1, sessions: cur.sessions, longestGap: cur.gap });

  const { cycleWeeks, targetSessions } = cycle;
  const block = Math.floor((week - 1) / cycleWeeks) + 1;
  const weekInBlock = ((week - 1) % cycleWeeks) + 1;
  const isDeload = weekInBlock === cycleWeeks;
  const firstOfBlock = week - weekInBlock + 1;
  return {
    weekOverall: week,
    block,
    weekInBlock,
    isDeload,
    weeksToDeload: isDeload ? 0 : cycleWeeks - weekInBlock,
    sessionsThisWeek: done.size,
    weekCounts: Array.from({ length: cycleWeeks }, (_, w) => counts.get(firstOfBlock + w) ?? 0),
    totalSessions: counted.length,
    cycleWeeks,
    targetSessions,
    doneThisWeek: [...done],
    history,
    weekStartedAt,
    source: manual ? 'manual' : 'auto',
  };
}

import { DAYS } from './program';
import { W531_DAYS } from './wendler531';
import type { Session } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
}

/** PPL cut: a six-week block, six sessions a week. */
export const PPL_CYCLE: ProgramCycle = {
  cycleWeeks: 6,
  targetSessions: 6,
  counts: (s) => PPL_KEYS.has(s.dayKey),
};

/** 5/3/1: a four-week wave, four sessions a week. */
export const W531_CYCLE: ProgramCycle = {
  cycleWeeks: 4,
  targetSessions: 4,
  counts: (s) => W531_KEYS.has(s.dayKey),
};

/** The tracking cycle for a program id (defaults to the PPL cut). */
export function programCycle(programId: string): ProgramCycle {
  return programId === 'wendler-531' ? W531_CYCLE : PPL_CYCLE;
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

// The Stretching program: two session templates (a short daily Reset and a
// longer Deep session), a week-based hold progression, and the flattening of a
// session into the ordered, timed steps the guided player walks through.

import { STRETCHES, stretchById, type StretchArea, type StretchType } from './stretches';

export type StretchSessionType = 'reset' | 'deep';

/** One prescribed stretch within a session template. */
export interface StretchBlock {
  stretch: string;
  /** Static: number of held sets. PNF: number of contract–relax rounds. Dynamic: passes. */
  sets: number;
  /** Base hold (seconds) at week 1 — static/pnf progress from here; dynamic is fixed. */
  hold: number;
}

export interface StretchTemplate {
  type: StretchSessionType;
  label: string;
  blurb: string;
  /** Rough minutes, for the home card. */
  minutes: number;
  blocks: StretchBlock[];
}

/** Short daily flow — consistency is what unwinds desk tightness. */
const RESET: StretchTemplate = {
  type: 'reset',
  label: 'Reset',
  blurb: 'A short daily loosen-up for hips and hamstrings.',
  minutes: 7,
  blocks: [
    { stretch: 'worldsgreatest', sets: 1, hold: 30 },
    { stretch: 'catcow', sets: 1, hold: 30 },
    { stretch: 'kneelinghipflexor', sets: 1, hold: 30 },
    { stretch: 'supinestrap', sets: 1, hold: 30 },
    { stretch: 'figure4', sets: 1, hold: 30 },
    { stretch: 'seatedfold', sets: 1, hold: 30 },
  ],
};

/** Longer session — deeper holds + contract–relax for real length gains. */
const DEEP: StretchTemplate = {
  type: 'deep',
  label: 'Deep',
  blurb: 'Longer holds and contract–relax to actually lengthen tight tissue.',
  minutes: 20,
  blocks: [
    { stretch: 'worldsgreatest', sets: 1, hold: 40 },
    { stretch: 'hipcircles', sets: 1, hold: 30 },
    { stretch: 'couchstretch', sets: 2, hold: 45 },
    { stretch: 'hamstringpnf', sets: 3, hold: 30 },
    { stretch: 'ninety90', sets: 1, hold: 40 },
    { stretch: 'seatedfold', sets: 2, hold: 45 },
    { stretch: 'pigeon', sets: 1, hold: 45 },
    { stretch: 'tspineopener', sets: 1, hold: 30 },
    { stretch: 'frog', sets: 1, hold: 45 },
  ],
};

export const STRETCH_TEMPLATES: Record<StretchSessionType, StretchTemplate> = {
  reset: RESET,
  deep: DEEP,
};

/** Whole weeks elapsed since the program began (0-based → week 1 = index 0). */
export function stretchWeek(programStart: string | undefined, now = new Date()): number {
  if (!programStart) return 1;
  const started = new Date(programStart);
  const days = Math.floor((now.getTime() - started.getTime()) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/**
 * Progressed hold for a week: static/pnf holds grow +5s every 2 weeks, capped at
 * +20s over the base. Dynamic movements stay fixed (they're a warm-up, not a hold).
 */
export function progressedHold(base: number, type: StretchType, week: number): number {
  if (type === 'dynamic') return base;
  const add = Math.min(20, Math.floor((week - 1) / 2) * 5);
  return base + add;
}

/** One timed step in the guided flow — a single hold on a single side. */
export interface StretchStep {
  stretchId: string;
  name: string;
  cue: string;
  area: StretchArea;
  type: StretchType;
  /** 'L' | 'R' for per-side stretches, otherwise null. */
  side: 'L' | 'R' | null;
  /** Countdown length for this step, in seconds. */
  seconds: number;
  /** 1-based set/round within this stretch, and how many total (for "Round 2/3"). */
  set: number;
  sets: number;
}

/**
 * Flatten a session template into the ordered list of timed steps the player
 * runs. Per-side stretches alternate L/R within each set; holds are progressed
 * for the given week.
 */
export function buildSteps(type: StretchSessionType, week: number): StretchStep[] {
  const steps: StretchStep[] = [];
  for (const block of STRETCH_TEMPLATES[type].blocks) {
    const s = stretchById(block.stretch);
    const seconds = progressedHold(block.hold, s.type, week);
    for (let set = 1; set <= block.sets; set++) {
      const sides: ('L' | 'R' | null)[] = s.perSide ? ['L', 'R'] : [null];
      for (const side of sides) {
        steps.push({
          stretchId: s.id,
          name: s.name,
          cue: s.cue,
          area: s.area,
          type: s.type,
          side,
          seconds,
          set,
          sets: block.sets,
        });
      }
    }
  }
  return steps;
}

/** Total working seconds in a session (excludes transitions), for the home card. */
export function sessionSeconds(type: StretchSessionType, week: number): number {
  return buildSteps(type, week).reduce((sum, st) => sum + st.seconds, 0);
}

/** Distinct areas a session touches, in first-seen order — for a session summary. */
export function sessionAreas(type: StretchSessionType): StretchArea[] {
  const seen: StretchArea[] = [];
  for (const b of STRETCH_TEMPLATES[type].blocks) {
    const a = STRETCHES[b.stretch]?.area;
    if (a && !seen.includes(a)) seen.push(a);
  }
  return seen;
}

/**
 * Which session to suggest today: Deep if it's been at least two days since the
 * last Deep session (so deep work lands ~3×/week), otherwise the daily Reset.
 */
export function recommendedSession(lastDeepAt: string | undefined, now = new Date()): StretchSessionType {
  if (!lastDeepAt) return 'deep';
  const days = (now.getTime() - new Date(lastDeepAt).getTime()) / 86_400_000;
  return days >= 2 ? 'deep' : 'reset';
}

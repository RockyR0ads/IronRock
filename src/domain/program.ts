import type { Day } from './types';
import { STAPLE_DAYS } from './staplePrograms';

/**
 * The six-day Push/Pull/Legs week, ported exactly from the reference.
 * Push A (heavy), Pull A (heavy), Legs A (strength),
 * Push B (volume), Pull B (volume), Legs B (strength).
 */
export const DAYS: Day[] = [
  {
    key: 'pushA',
    label: 'Push',
    variant: 'A · heavy',
    note: 'Heavy press lead. Triceps volume after.',
    blocks: [
      { lift: 'bench', alts: ['dbbench', 'inclinebench'], sets: 4, reps: 5, rpe: 8, cls: 'r-hi', cat: 'hpress', prog: 'hold' },
      { lift: 'ohp', alts: ['dbohp', 'seatedbb'], sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cablelatraise', alts: ['latraise'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'cgbench', alts: ['dips'], sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'triceps', prog: 'hold' },
      { lift: 'cableohext', alts: ['ohext'], sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'triceps', prog: 'push' },
      { lift: 'skull', alts: ['jmpress'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
    ],
  },
  {
    key: 'pullA',
    label: 'Pull',
    variant: 'A · heavy',
    note: 'Heavy vertical + horizontal. Biceps volume after.',
    blocks: [
      { lift: 'pullup', alts: ['chinup', 'neutralpullup'], sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'row', alts: ['pendlay', 'csrow', 'dbrow'], sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'hpull', prog: 'hold' },
      { lift: 'facepull', alts: ['reardelt'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', prog: 'push' },
      { lift: 'ezcurl', alts: ['dbcurl'], sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'inclinecurl', alts: ['spider'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'hammer', alts: ['zottman'], sets: 2, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'legsA',
    label: 'Legs',
    variant: 'A · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'squat', alts: ['pausesquat', 'boxsquat'], sets: 5, reps: 3, rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'rdl', alts: ['deadlift', 'stiffleg'], sets: 3, reps: [4, 5], rpe: 8, cls: 'r-hi', cat: 'hinge', prog: 'hold' },
      { lift: 'calf', alts: ['seatedcalf'], sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf', prog: 'push' },
    ],
  },
  {
    key: 'pushB',
    label: 'Push',
    variant: 'B · volume',
    note: 'Incline-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'dbincline', alts: ['inclinebench', 'dbbench'], sets: 4, reps: 8, rpe: 7, cls: 'r-mid', cat: 'hpress', drift: true, prog: 'hold' },
      { lift: 'dbohp', alts: ['arnold', 'ohp'], sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cablelatraise', alts: ['latraise'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'dips', alts: ['cgbench'], sets: 3, reps: [8, 10], rpe: 8, cls: 'r-iso', cat: 'triceps', prog: 'hold' },
      { lift: 'skull', alts: ['tate'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
      { lift: 'cableohext', alts: ['ohext'], sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'triceps', prog: 'push' },
    ],
  },
  {
    key: 'pullB',
    label: 'Pull',
    variant: 'B · volume',
    note: 'Row-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'csrow', alts: ['row', 'dbrow'], sets: 4, reps: 10, rpe: 7, cls: 'r-mid', cat: 'hpull', drift: true, prog: 'hold' },
      { lift: 'pullup', alts: ['chinup'], sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'facepull', alts: ['reardelt'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', prog: 'push' },
      { lift: 'inclinecurl', alts: ['spider'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'ezcurl', alts: ['dbcurl'], sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'hammer', alts: ['zottman'], sets: 2, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'legsB',
    label: 'Legs',
    variant: 'B · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'frontsquat', alts: ['squat', 'goblet'], sets: 4, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'bss', alts: ['reverselunge', 'splitsquat', 'lunge'], sets: 3, reps: 5, rpe: 8, cls: 'r-hi', cat: 'uni', perLeg: true, prog: 'hold' },
      { lift: 'calf', alts: ['seatedcalf'], sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf', prog: 'push' },
    ],
  },
];

/**
 * 4-Day PPL v2 (Heavy + Volume) — grow arms and delts, keep chest and legs to
 * strength, hold muscle on a cut (85 → 80 kg). Push Heavy / Pull Heavy /
 * Push Arms + Delts / Legs + Pull Volume. Back twice (heavy + volume), chest
 * twice for strength (heavy bench Mon, incline Thu). No rowing on push days.
 * Single cable tower. Compounds hold their load; arms and delts double-progress
 * to RPE 9, last set 10. a/b pairs are supersets — run them back to back.
 */
export const ULA_DAYS: Day[] = [
  {
    key: 'ppl4PushH',
    label: 'Push',
    variant: 'Heavy',
    note: 'Bench: set 1 is a top set of 3–5 @ RPE 8, then 3 back-off sets of 5–6 at ~90% of it. Then OHP, side delts, close-grip bench and overhead extensions. ~55 min.',
    blocks: [
      { lift: 'bench', alts: ['dbbench'], sets: 4, reps: [3, 6], rpe: 8, cls: 'r-hi', cat: 'hpress', prog: 'hold' },
      { lift: 'ohp', alts: ['dbohp'], sets: 3, reps: [5, 7], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cablelatraise', alts: ['latraise'], sets: 4, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'cgbench', alts: ['dips'], sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'triceps', prog: 'hold' },
      { lift: 'cableohext', alts: ['ohext'], sets: 3, reps: [10, 15], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
    ],
  },
  {
    key: 'ppl4PullH',
    label: 'Pull',
    variant: 'Heavy',
    note: 'Heavy row and weighted chin-up, single-arm DB row, then a rear/side delt superset and curls. No dip belt? Hold a DB between your feet, or do bodyweight chins for 6–10. ~65 min.',
    blocks: [
      { lift: 'row', alts: ['pendlay'], sets: 4, reps: [5, 7], rpe: 8, cls: 'r-hi', cat: 'hpull', prog: 'hold' },
      { lift: 'chinup', alts: ['pullup'], sets: 3, reps: [4, 6], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'dbrow', alts: ['singlecablerow'], sets: 3, reps: [8, 12], rpe: 8, cls: 'r-mid', cat: 'hpull', prog: 'hold' },
      { lift: 'facepull', alts: ['reardelt'], sets: 4, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', group: 'pl-delt', prog: 'push' },
      { lift: 'leanlatraise', alts: ['cablelatraise', 'latraise'], sets: 4, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', group: 'pl-delt', prog: 'push' },
      { lift: 'ezcurl', alts: ['dbcurl'], sets: 3, reps: [6, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'inclinecurl', alts: ['dbcurl'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'ppl4PushV',
    label: 'Push',
    variant: 'Arms + Delts',
    note: 'Incline bench for strength, overhead extensions, then side-delt/triceps and side-delt/abs supersets, and leg raises. Elbows cranky? Cut the pushdowns first. ~55 min.',
    blocks: [
      { lift: 'inclinebench', alts: ['dbincline'], sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'hpress', prog: 'hold' },
      { lift: 'cableohext', alts: ['ohext'], sets: 3, reps: [10, 15], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
      { lift: 'leanlatraise', alts: ['cablelatraise', 'latraise'], sets: 4, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', group: 'pv-a', prog: 'push' },
      { lift: 'singlepushdown', alts: ['ropepushdown', 'pushdown'], sets: 3, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'triceps', group: 'pv-a', prog: 'push' },
      { lift: 'latraise', alts: ['cablelatraise'], sets: 4, reps: [12, 20], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', group: 'pv-b', prog: 'push' },
      { lift: 'Ab_Roller', sets: 3, reps: [8, 12], rpe: 9, cls: 'r-iso', cat: 'core', group: 'pv-b', prog: 'push' },
      { lift: 'Hanging_Leg_Raise', sets: 3, reps: [8, 15], rpe: 9, cls: 'r-iso', cat: 'core', prog: 'push' },
    ],
  },
  {
    key: 'ppl4LegsPull',
    label: 'Legs + Pull',
    variant: 'Volume',
    note: 'Squat first while fresh, then 2 deadlift sets, back volume, a curl/rear-delt superset on the same incline bench, and cable curls. ~65 min.',
    blocks: [
      { lift: 'squat', alts: ['pausesquat'], sets: 3, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'deadlift', alts: ['rdl'], sets: 2, reps: [2, 4], rpe: 8, cls: 'r-hi', cat: 'hinge', prog: 'hold' },
      { lift: 'latpulldown', alts: ['chinup'], sets: 3, reps: [10, 15], rpe: 9, cls: 'r-mid', cat: 'vpull', prog: 'hold' },
      { lift: 'csrow', alts: ['dbrow'], sets: 3, reps: [10, 12], rpe: 8, cls: 'r-mid', cat: 'hpull', prog: 'hold' },
      { lift: 'spider', alts: ['inclinecurl'], sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', group: 'lp-arm', prog: 'push' },
      { lift: 'reardelt', alts: ['facepull'], sets: 5, reps: [15, 20], rpe: '9–10', cls: 'r-iso', cat: 'reardelt', group: 'lp-arm', prog: 'push' },
      { lift: 'cablecurl', alts: ['dbcurl'], sets: 3, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
];

/** Day templates per program id — the day-based programs the week engine can run. */
export const PROGRAM_DAYS: Record<string, Day[]> = {
  'ppl-cut': DAYS,
  'upper-lower-arms': ULA_DAYS,
  ...STAPLE_DAYS,
};

/** The program id of the user-built routine. */
export const CUSTOM_PROGRAM_ID = 'custom';

/**
 * The user's custom routine days, mirrored here from state so the pure day
 * engine (daysForProgram / defaultDay / pickBase) can resolve them without
 * threading state through every caller. The store keeps this in sync.
 */
let CUSTOM_DAYS: Day[] = [];
export function setCustomDays(days: Day[]): void {
  CUSTOM_DAYS = days;
}
export function getCustomDays(): Day[] {
  return CUSTOM_DAYS;
}

/** The day list for a program (falls back to the PPL days). */
export function daysForProgram(programId: string): Day[] {
  if (programId === CUSTOM_PROGRAM_ID) return CUSTOM_DAYS;
  return PROGRAM_DAYS[programId] ?? DAYS;
}

/** Resolve a day by key across every registered program (day keys are unique). */
export function defaultDay(key: string): Day | undefined {
  for (const days of [...Object.values(PROGRAM_DAYS), CUSTOM_DAYS]) {
    const found = days.find((d) => d.key === key);
    if (found) return found;
  }
  return undefined;
}

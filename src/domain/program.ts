import type { Day } from './types';

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
 * 4-Day PPL + Volume Upper — grow arms and delts, keep legs to low-rep
 * strength, hold muscle on a cut. Chest and back are each trained twice: one
 * heavy day (3–7 reps) and one volume day (8–15). Compounds hold their load;
 * arms, delts and flyes double-progress to RPE 9–10. (a/b pairs in the source
 * are supersets — run them back to back.)
 */
export const ULA_DAYS: Day[] = [
  {
    key: 'pplvPush',
    label: 'Push',
    variant: 'Heavy',
    note: 'Heavy chest & shoulder press, then side delts and triceps.',
    blocks: [
      { lift: 'bench', alts: ['dbbench', 'inclinebench'], sets: 4, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'hpress', prog: 'hold' },
      { lift: 'ohp', alts: ['seatedbb', 'dbohp'], sets: 3, reps: [5, 7], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cgbench', alts: ['dips'], sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'triceps', prog: 'hold' },
      { lift: 'cablelatraise', alts: ['latraise'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'cableohext', alts: ['ohext'], sets: 3, reps: [10, 15], rpe: 9, cls: 'r-iso', cat: 'triceps', group: 'push-tri', prog: 'push' },
      { lift: 'ropepushdown', alts: ['pushdown', 'singlepushdown'], sets: 2, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'triceps', group: 'push-tri', prog: 'push' },
    ],
  },
  {
    key: 'pplvPull',
    label: 'Pull',
    variant: 'Heavy',
    note: 'Heavy row & chin-up, then rear delts and biceps.',
    blocks: [
      { lift: 'row', alts: ['pendlay', 'csrow', 'dbrow'], sets: 4, reps: [5, 7], rpe: 8, cls: 'r-hi', cat: 'hpull', prog: 'hold' },
      { lift: 'chinup', alts: ['pullup', 'neutralpullup'], sets: 3, reps: [4, 6], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'facepull', alts: ['reardelt'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', group: 'pull-delt', prog: 'push' },
      { lift: 'leanlatraise', alts: ['cablelatraise', 'latraise'], sets: 3, reps: [12, 15], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', group: 'pull-delt', prog: 'push' },
      { lift: 'ezcurl', alts: ['dbcurl'], sets: 3, reps: [6, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'inclinecurl', alts: ['spider'], sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'pplvUpper',
    label: 'Upper',
    variant: 'Volume',
    note: 'Higher-rep chest & back volume, delts and a curl.',
    blocks: [
      { lift: 'dbincline', alts: ['inclinebench', 'dbbench'], sets: 3, reps: [8, 12], rpe: 8, cls: 'r-mid', cat: 'hpress', prog: 'hold' },
      { lift: 'csrow', alts: ['row', 'dbrow'], sets: 3, reps: [10, 12], rpe: 8, cls: 'r-mid', cat: 'hpull', prog: 'hold' },
      { lift: 'latpulldown', alts: ['chinup'], sets: 3, reps: [10, 15], rpe: 9, cls: 'r-mid', cat: 'vpull', prog: 'hold' },
      { lift: 'cablefly', alts: ['dbbench'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'hpress', prog: 'push' },
      { lift: 'dbrow', alts: ['csrow'], sets: 2, reps: [12, 15], rpe: 9, cls: 'r-mid', cat: 'hpull', prog: 'hold' },
      { lift: 'cableyraise', alts: ['latraise'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', group: 'upper-delt', prog: 'push' },
      { lift: 'reversecablefly', alts: ['facepull'], sets: 3, reps: [15, 20], rpe: 9, cls: 'r-iso', cat: 'reardelt', group: 'upper-delt', prog: 'push' },
      { lift: 'hammer', alts: ['zottman'], sets: 2, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'pplvLegsArms',
    label: 'Legs + Arms',
    variant: 'Strength + arms',
    note: 'Low-rep squat & deadlift, then a superset arm block.',
    blocks: [
      { lift: 'squat', alts: ['pausesquat', 'frontsquat'], sets: 3, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'deadlift', alts: ['rdl', 'stiffleg'], sets: 2, reps: [2, 4], rpe: 8, cls: 'r-hi', cat: 'hinge', prog: 'hold' },
      { lift: 'spider', alts: ['inclinecurl'], sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'biceps', group: 'la-arm1', prog: 'push' },
      { lift: 'skull', alts: ['jmpress', 'cableohext'], sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'triceps', group: 'la-arm1', prog: 'push' },
      { lift: 'cablecurl', alts: ['dbcurl'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'biceps', group: 'la-arm2', prog: 'push' },
      { lift: 'singlepushdown', alts: ['ropepushdown', 'pushdown'], sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'triceps', group: 'la-arm2', prog: 'push' },
      { lift: 'latraise', alts: ['cablelatraise'], sets: 3, reps: [12, 20], rpe: '9–10', cls: 'r-iso', cat: 'latdelt', prog: 'push' },
    ],
  },
];

/** Day templates per program id — the day-based programs the week engine can run. */
export const PROGRAM_DAYS: Record<string, Day[]> = {
  'ppl-cut': DAYS,
  'upper-lower-arms': ULA_DAYS,
};

/** The day list for a program (falls back to the PPL days). */
export function daysForProgram(programId: string): Day[] {
  return PROGRAM_DAYS[programId] ?? DAYS;
}

/** Resolve a day by key across every registered program (day keys are unique). */
export function defaultDay(key: string): Day | undefined {
  for (const days of Object.values(PROGRAM_DAYS)) {
    const found = days.find((d) => d.key === key);
    if (found) return found;
  }
  return undefined;
}

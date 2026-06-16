import type { Category, Lift } from './types';

/** Category display names. */
export const CAT: Record<Category, string> = {
  hpress: 'Horizontal press',
  vpress: 'Vertical press',
  hpull: 'Horizontal pull',
  vpull: 'Vertical pull',
  squat: 'Squat',
  hinge: 'Hinge',
  uni: 'Single-leg',
  latdelt: 'Lateral delt',
  reardelt: 'Rear delt',
  biceps: 'Biceps',
  triceps: 'Triceps',
  calf: 'Calves',
};

/** Order categories appear in the "Add exercise" picker. */
export const CAT_ORDER: Category[] = [
  'hpress',
  'vpress',
  'hpull',
  'vpull',
  'squat',
  'hinge',
  'uni',
  'latdelt',
  'reardelt',
  'biceps',
  'triceps',
  'calf',
];

/** Lift catalogue. cats = movement roles it can fill. uni = per-leg. */
export const LIFTS: Record<string, Lift> = {
  // horizontal press
  bench: { id: 'bench', name: 'Bench press', type: 'computed', unit: 'kg on bar', cats: ['hpress'] },
  dbbench: { id: 'dbbench', name: 'Flat DB press', type: 'computed', unit: 'kg / DB', cats: ['hpress'] },
  inclinebench: { id: 'inclinebench', name: 'Incline barbell press', type: 'computed', unit: 'kg on bar', cats: ['hpress'] },
  dbincline: { id: 'dbincline', name: 'DB incline press', type: 'computed', unit: 'kg / DB', cats: ['hpress'] },
  floorpress: { id: 'floorpress', name: 'Floor press', type: 'computed', unit: 'kg on bar', cats: ['hpress', 'triceps'] },
  cgbench: { id: 'cgbench', name: 'Close-grip bench', type: 'computed', unit: 'kg on bar', cats: ['hpress', 'triceps'] },
  dips: { id: 'dips', name: 'Dips', type: 'manual', unit: 'added kg', cats: ['hpress', 'triceps'] },
  // vertical press
  ohp: { id: 'ohp', name: 'Overhead press', type: 'computed', unit: 'kg on bar', cats: ['vpress'] },
  dbohp: { id: 'dbohp', name: 'Seated DB shoulder press', type: 'computed', unit: 'kg / DB', cats: ['vpress'] },
  seatedbb: { id: 'seatedbb', name: 'Seated barbell press', type: 'computed', unit: 'kg on bar', cats: ['vpress'] },
  pushpress: { id: 'pushpress', name: 'Push press', type: 'computed', unit: 'kg on bar', cats: ['vpress'] },
  arnold: { id: 'arnold', name: 'Arnold press', type: 'computed', unit: 'kg / DB', cats: ['vpress'] },
  // horizontal pull
  row: { id: 'row', name: 'Barbell row', type: 'computed', unit: 'kg on bar', cats: ['hpull'] },
  pendlay: { id: 'pendlay', name: 'Pendlay row', type: 'computed', unit: 'kg on bar', cats: ['hpull'] },
  yates: { id: 'yates', name: 'Yates row', type: 'computed', unit: 'kg on bar', cats: ['hpull'] },
  csrow: { id: 'csrow', name: 'Chest-supported DB row', type: 'computed', unit: 'kg / DB', cats: ['hpull'] },
  dbrow: { id: 'dbrow', name: '1-arm DB row', type: 'computed', unit: 'kg / DB', cats: ['hpull'], uni: true },
  // vertical pull
  pullup: { id: 'pullup', name: 'Pull-up', type: 'manual', unit: 'added kg', cats: ['vpull'] },
  chinup: { id: 'chinup', name: 'Chin-up', type: 'manual', unit: 'added kg', cats: ['vpull', 'biceps'] },
  neutralpullup: { id: 'neutralpullup', name: 'Neutral-grip pull-up', type: 'manual', unit: 'added kg', cats: ['vpull'] },
  // squat
  squat: { id: 'squat', name: 'Back squat', type: 'computed', unit: 'kg on bar', cats: ['squat'] },
  frontsquat: { id: 'frontsquat', name: 'Front squat', type: 'computed', unit: 'kg on bar', cats: ['squat'] },
  pausesquat: { id: 'pausesquat', name: 'Pause squat', type: 'computed', unit: 'kg on bar', cats: ['squat'] },
  boxsquat: { id: 'boxsquat', name: 'Box squat', type: 'computed', unit: 'kg on bar', cats: ['squat'] },
  zercher: { id: 'zercher', name: 'Zercher squat', type: 'computed', unit: 'kg on bar', cats: ['squat'] },
  goblet: { id: 'goblet', name: 'Goblet squat', type: 'computed', unit: 'kg', cats: ['squat'] },
  // hinge
  rdl: { id: 'rdl', name: 'Romanian deadlift', type: 'computed', unit: 'kg on bar', cats: ['hinge'] },
  deadlift: { id: 'deadlift', name: 'Deadlift', type: 'computed', unit: 'kg on bar', cats: ['hinge'] },
  stiffleg: { id: 'stiffleg', name: 'Stiff-leg deadlift', type: 'computed', unit: 'kg on bar', cats: ['hinge'] },
  dbrdl: { id: 'dbrdl', name: 'DB Romanian deadlift', type: 'computed', unit: 'kg / DB', cats: ['hinge'] },
  goodmorning: { id: 'goodmorning', name: 'Good morning', type: 'computed', unit: 'kg on bar', cats: ['hinge'] },
  // single-leg
  bss: { id: 'bss', name: 'Bulgarian split squat', type: 'computed', unit: 'kg / DB', cats: ['uni', 'squat'], uni: true },
  lunge: { id: 'lunge', name: 'Walking lunge', type: 'computed', unit: 'kg / DB', cats: ['uni'], uni: true },
  reverselunge: { id: 'reverselunge', name: 'Reverse lunge', type: 'computed', unit: 'kg / DB', cats: ['uni'], uni: true },
  stepup: { id: 'stepup', name: 'Step-up', type: 'computed', unit: 'kg / DB', cats: ['uni'], uni: true },
  splitsquat: { id: 'splitsquat', name: 'Split squat', type: 'computed', unit: 'kg / DB', cats: ['uni'], uni: true },
  // lateral delt
  latraise: { id: 'latraise', name: 'DB lateral raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  leanlatraise: { id: 'leanlatraise', name: 'Leaning lateral raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  seatedlatraise: { id: 'seatedlatraise', name: 'Seated lateral raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  // rear delt
  reardelt: { id: 'reardelt', name: 'Rear delt fly', type: 'manual', unit: 'kg / DB', cats: ['reardelt'] },
  bentreardelt: { id: 'bentreardelt', name: 'Bent-over rear raise', type: 'manual', unit: 'kg / DB', cats: ['reardelt'] },
  reardeltrow: { id: 'reardeltrow', name: 'Rear delt row', type: 'manual', unit: 'kg / DB', cats: ['reardelt'] },
  // biceps
  ezcurl: { id: 'ezcurl', name: 'EZ curl', type: 'manual', unit: 'kg on bar', cats: ['biceps'] },
  dbcurl: { id: 'dbcurl', name: 'DB curl', type: 'manual', unit: 'kg / DB', cats: ['biceps'] },
  inclinecurl: { id: 'inclinecurl', name: 'Incline DB curl', type: 'manual', unit: 'kg / DB', cats: ['biceps'] },
  hammer: { id: 'hammer', name: 'Hammer curl', type: 'manual', unit: 'kg / DB', cats: ['biceps'] },
  preacher: { id: 'preacher', name: 'Preacher curl', type: 'manual', unit: 'kg', cats: ['biceps'] },
  concentration: { id: 'concentration', name: 'Concentration curl', type: 'manual', unit: 'kg', cats: ['biceps'] },
  spider: { id: 'spider', name: 'Spider curl', type: 'manual', unit: 'kg / DB', cats: ['biceps'] },
  zottman: { id: 'zottman', name: 'Zottman curl', type: 'manual', unit: 'kg / DB', cats: ['biceps'] },
  // triceps
  skull: { id: 'skull', name: 'Skullcrusher', type: 'manual', unit: 'kg on bar', cats: ['triceps'] },
  ohext: { id: 'ohext', name: 'Overhead triceps ext.', type: 'manual', unit: 'kg', cats: ['triceps'] },
  jmpress: { id: 'jmpress', name: 'JM press', type: 'manual', unit: 'kg on bar', cats: ['triceps'] },
  tate: { id: 'tate', name: 'Tate press', type: 'manual', unit: 'kg / DB', cats: ['triceps'] },
  kickback: { id: 'kickback', name: 'DB kickback', type: 'manual', unit: 'kg / DB', cats: ['triceps'] },
  // calves
  calf: { id: 'calf', name: 'Standing calf raise', type: 'manual', unit: 'kg', cats: ['calf'] },
  seatedcalf: { id: 'seatedcalf', name: 'Seated calf raise', type: 'manual', unit: 'kg', cats: ['calf'] },
  singlecalf: { id: 'singlecalf', name: 'Single-leg calf raise', type: 'manual', unit: 'kg', cats: ['calf'], uni: true },
};

/** Lift ids whose `cats` include the given category. */
export function liftsInCategory(cat: Category): string[] {
  return Object.keys(LIFTS).filter((id) => LIFTS[id].cats.includes(cat));
}

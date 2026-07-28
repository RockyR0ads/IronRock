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

/**
 * Curated lift id → free-exercise-db id, linking a catalogue lift to its how-to
 * guide (photos + instructions) on the exercise page's About tab. Only the lifts
 * with a sensible match are mapped; the rest simply show no About tab.
 */
const LIFT_LIB: Record<string, string> = {
  bench: 'Barbell_Bench_Press_-_Medium_Grip',
  squat: 'Barbell_Full_Squat',
  deadlift: 'Barbell_Deadlift',
  ohp: 'Barbell_Shoulder_Press',
  row: 'Bent_Over_Barbell_Row',
  inclinebench: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  frontsquat: 'Front_Barbell_Squat',
  rdl: 'Romanian_Deadlift',
  pendlay: 'Bent_Over_Barbell_Row',
  pushpress: 'Push_Press',
  cgbench: 'Close-Grip_Barbell_Bench_Press',
  pullup: 'Pullups',
  chinup: 'Chin-Up',
  dips: 'Dips_-_Triceps_Version',
  dbbench: 'Dumbbell_Bench_Press',
  dbincline: 'Incline_Dumbbell_Press',
  dbohp: 'Seated_Dumbbell_Press',
  arnold: 'Arnold_Dumbbell_Press',
  dbrow: 'One-Arm_Dumbbell_Row',
  csrow: 'Dumbbell_Incline_Row',
  lunge: 'Bodyweight_Walking_Lunge',
  dbcurl: 'Dumbbell_Bicep_Curl',
  ezcurl: 'EZ-Bar_Curl',
  hammer: 'Hammer_Curls',
  skull: 'EZ-Bar_Skullcrusher',
  latraise: 'Side_Lateral_Raise',
  reardelt: 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
  calf: 'Standing_Calf_Raises',
  seatedcalf: 'Seated_Calf_Raise',
};
for (const [id, lib] of Object.entries(LIFT_LIB)) {
  if (LIFTS[id]) LIFTS[id].lib = lib;
}

/** Lift ids whose `cats` include the given category. */
export function liftsInCategory(cat: Category): string[] {
  return Object.keys(LIFTS).filter((id) => LIFTS[id].cats.includes(cat));
}

/**
 * The 30 lifts worth charting — the big barbell compounds first, then the
 * common dumbbell, bodyweight and isolation movements. Drives the exercise
 * charts picker.
 */
export const TOP_LIFTS: string[] = [
  'bench', 'squat', 'deadlift', 'ohp', 'row',
  'inclinebench', 'frontsquat', 'rdl', 'pendlay', 'pushpress',
  'cgbench', 'pullup', 'chinup', 'dips', 'dbbench',
  'dbincline', 'dbohp', 'arnold', 'dbrow', 'csrow',
  'bss', 'lunge', 'dbcurl', 'ezcurl', 'hammer',
  'skull', 'latraise', 'reardelt', 'calf', 'seatedcalf',
];

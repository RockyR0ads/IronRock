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
  cablelatraise: { id: 'cablelatraise', name: 'Cable lateral raise', type: 'manual', unit: 'kg', cats: ['latdelt'] },
  leanlatraise: { id: 'leanlatraise', name: 'Leaning lateral raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  seatedlatraise: { id: 'seatedlatraise', name: 'Seated lateral raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  machinelatraise: { id: 'machinelatraise', name: 'Machine lateral raise', type: 'manual', unit: 'kg', cats: ['latdelt'] },
  // machines & accessories used by the published programs
  powerclean: { id: 'powerclean', name: 'Power clean', type: 'manual', unit: 'kg on bar', cats: ['hinge'] },
  sumo: { id: 'sumo', name: 'Sumo deadlift', type: 'computed', unit: 'kg on bar', cats: ['hinge'] },
  backext: { id: 'backext', name: 'Back extension', type: 'manual', unit: 'added kg', cats: ['hinge'] },
  legcurl: { id: 'legcurl', name: 'Lying leg curl', type: 'manual', unit: 'kg', cats: ['hinge'] },
  legpress: { id: 'legpress', name: 'Leg press', type: 'manual', unit: 'kg', cats: ['squat'] },
  hacksquat: { id: 'hacksquat', name: 'Hack squat', type: 'manual', unit: 'kg', cats: ['squat'] },
  legext: { id: 'legext', name: 'Leg extension', type: 'manual', unit: 'kg', cats: ['squat'] },
  singlecablerow: { id: 'singlecablerow', name: 'Single-arm cable row', type: 'manual', unit: 'kg', cats: ['hpull'], uni: true },
  straightarmpd: { id: 'straightarmpd', name: 'Straight-arm cable pulldown', type: 'manual', unit: 'kg', cats: ['vpull'] },
  cablerow: { id: 'cablerow', name: 'Seated cable row', type: 'manual', unit: 'kg', cats: ['hpull'] },
  shrug: { id: 'shrug', name: 'Barbell shrug', type: 'manual', unit: 'kg on bar', cats: ['hpull'] },
  // timed holds & conditioning — measured in time / distance, not weight × reps
  plank: { id: 'plank', name: 'Plank', type: 'manual', unit: 'time', cats: [] },
  deadhang: { id: 'deadhang', name: 'Dead hang', type: 'manual', unit: 'time', cats: [] },
  run: { id: 'run', name: 'Running', type: 'manual', unit: 'distance', cats: [] },
  rowerg: { id: 'rowerg', name: 'Rowing machine', type: 'manual', unit: 'distance', cats: [] },
  bike: { id: 'bike', name: 'Cycling', type: 'manual', unit: 'distance', cats: [] },
  // rear delt
  facepull: { id: 'facepull', name: 'Face pull', type: 'manual', unit: 'kg', cats: ['reardelt'] },
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
  cableohext: { id: 'cableohext', name: 'Cable rope overhead ext.', type: 'manual', unit: 'kg', cats: ['triceps'] },
  jmpress: { id: 'jmpress', name: 'JM press', type: 'manual', unit: 'kg on bar', cats: ['triceps'] },
  tate: { id: 'tate', name: 'Tate press', type: 'manual', unit: 'kg / DB', cats: ['triceps'] },
  kickback: { id: 'kickback', name: 'DB kickback', type: 'manual', unit: 'kg / DB', cats: ['triceps'] },
  // cable / machine isolation (Upper-Lower + Arms program)
  latpulldown: { id: 'latpulldown', name: 'Cable lat pulldown', type: 'manual', unit: 'kg', cats: ['vpull'] },
  reversecablefly: { id: 'reversecablefly', name: 'Reverse cable fly', type: 'manual', unit: 'kg', cats: ['reardelt'] },
  cablefly: { id: 'cablefly', name: 'Cable fly', type: 'manual', unit: 'kg', cats: ['hpress'] },
  dbyraise: { id: 'dbyraise', name: 'Chest-supported DB Y-raise', type: 'manual', unit: 'kg / DB', cats: ['latdelt'] },
  cableyraise: { id: 'cableyraise', name: 'Cable Y-raise', type: 'manual', unit: 'kg', cats: ['latdelt'] },
  cablecurl: { id: 'cablecurl', name: 'Cable curl', type: 'manual', unit: 'kg', cats: ['biceps'] },
  reversecurl: { id: 'reversecurl', name: 'Cable reverse curl', type: 'manual', unit: 'kg', cats: ['biceps'] },
  pushdown: { id: 'pushdown', name: 'Cable pushdown', type: 'manual', unit: 'kg', cats: ['triceps'] },
  ropepushdown: { id: 'ropepushdown', name: 'Rope pushdown', type: 'manual', unit: 'kg', cats: ['triceps'] },
  singlepushdown: { id: 'singlepushdown', name: 'Single-arm pushdown', type: 'manual', unit: 'kg', cats: ['triceps'] },
  // calves
  calf: { id: 'calf', name: 'Standing calf raise', type: 'manual', unit: 'kg', cats: ['calf'] },
  seatedcalf: { id: 'seatedcalf', name: 'Seated calf raise', type: 'manual', unit: 'kg', cats: ['calf'] },
  singlecalf: { id: 'singlecalf', name: 'Single-leg calf raise', type: 'manual', unit: 'kg', cats: ['calf'], uni: true },
};

/**
 * Library exercises that are the *same movement* as a built-in lift. They're
 * folded into the built-in id everywhere — hidden from the picker, re-filed on
 * load, and resolved to on import — so one movement keeps one history instead
 * of splitting across near-identical entries. Genuine variants (other grips,
 * equipment or bands/chains) are deliberately left out.
 */
export const LIB_DUPES: Record<string, string> = {
  // push
  'Barbell_Bench_Press_-_Medium_Grip': 'bench',
  Dumbbell_Bench_Press: 'dbbench',
  'Barbell_Incline_Bench_Press_-_Medium_Grip': 'inclinebench',
  Incline_Dumbbell_Press: 'dbincline',
  Floor_Press: 'floorpress',
  'Close-Grip_Barbell_Bench_Press': 'cgbench',
  'Dips_-_Triceps_Version': 'dips',
  'Dips_-_Chest_Version': 'dips',
  Parallel_Bar_Dip: 'dips',
  Barbell_Shoulder_Press: 'ohp',
  Standing_Military_Press: 'ohp',
  Seated_Dumbbell_Press: 'dbohp',
  Dumbbell_Shoulder_Press: 'dbohp',
  Seated_Barbell_Military_Press: 'seatedbb',
  Push_Press: 'pushpress',
  Arnold_Dumbbell_Press: 'arnold',
  Cable_Crossover: 'cablefly',
  // pull
  Bent_Over_Barbell_Row: 'row',
  'supp-pendlay-row': 'pendlay',
  'One-Arm_Dumbbell_Row': 'dbrow',
  Dumbbell_Incline_Row: 'csrow',
  Pullups: 'pullup',
  'Chin-Up': 'chinup',
  'Wide-Grip_Lat_Pulldown': 'latpulldown',
  // legs
  Barbell_Full_Squat: 'squat',
  Barbell_Squat: 'squat',
  Front_Barbell_Squat: 'frontsquat',
  Box_Squat: 'boxsquat',
  Zercher_Squats: 'zercher',
  Goblet_Squat: 'goblet',
  Barbell_Deadlift: 'deadlift',
  Romanian_Deadlift: 'rdl',
  Good_Morning: 'goodmorning',
  Split_Squats: 'splitsquat',
  Dumbbell_Rear_Lunge: 'reverselunge',
  Standing_Calf_Raises: 'calf',
  Seated_Calf_Raise: 'seatedcalf',
  // shoulders
  'supp-standing-cable-lateral-raise': 'cablelatraise',
  Side_Lateral_Raise: 'latraise',
  Seated_Side_Lateral_Raise: 'seatedlatraise',
  Face_Pull: 'facepull',
  Cable_Rear_Delt_Fly: 'reversecablefly',
  Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench: 'reardelt',
  // arms
  'EZ-Bar_Curl': 'ezcurl',
  Dumbbell_Bicep_Curl: 'dbcurl',
  Incline_Dumbbell_Curl: 'inclinecurl',
  Hammer_Curls: 'hammer',
  Preacher_Curl: 'preacher',
  Concentration_Curls: 'concentration',
  Spider_Curl: 'spider',
  Zottman_Curl: 'zottman',
  Reverse_Cable_Curl: 'reversecurl',
  'EZ-Bar_Skullcrusher': 'skull',
  Cable_Rope_Overhead_Triceps_Extension: 'cableohext',
  Triceps_Overhead_Extension_with_Rope: 'cableohext',
  JM_Press: 'jmpress',
  Tate_Press: 'tate',
  Tricep_Dumbbell_Kickback: 'kickback',
  Triceps_Pushdown: 'pushdown',
  // machines & accessories promoted to built-ins
  Power_Clean: 'powerclean',
  Sumo_Deadlift: 'sumo',
  Hyperextensions_Back_Extensions: 'backext',
  Lying_Leg_Curls: 'legcurl',
  Leg_Press: 'legpress',
  Hack_Squat: 'hacksquat',
  Leg_Extensions: 'legext',
  Seated_Cable_Rows: 'cablerow',
  'Seated_One-arm_Cable_Pulley_Rows': 'singlecablerow',
  'Straight-Arm_Pulldown': 'straightarmpd',
  'Rope_Straight-Arm_Pulldown': 'straightarmpd',
  Barbell_Shrug: 'shrug',
  // timed & conditioning
  Plank: 'plank',
  Running_Treadmill: 'run',
  Jogging_Treadmill: 'run',
  Rowing_Stationary: 'rowerg',
  Bicycling_Stationary: 'bike',
  Bicycling: 'bike',
  'Triceps_Pushdown_-_Rope_Attachment': 'ropepushdown',
};

/** The id a lift should be filed under: its built-in twin if it's a duplicate. */
export function canonicalLiftId(id: string): string {
  return LIB_DUPES[id] ?? id;
}

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
  cablelatraise: 'supp-standing-cable-lateral-raise',
  singlecablerow: 'Seated_One-arm_Cable_Pulley_Rows',
  straightarmpd: 'Straight-Arm_Pulldown',
  cableohext: 'Cable_Rope_Overhead_Triceps_Extension',
  facepull: 'Face_Pull',
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

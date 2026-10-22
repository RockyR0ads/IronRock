import type { Block, BlockClass, Category, Day, Reps } from './types';

/**
 * Day templates for the well-known published programs, so they run on the same
 * week engine as the built-in plans. Each keeps the program's lift selection,
 * day structure and sets × reps; loading and progression run on IronRock's
 * RPE rule (compounds add weight once the top of the range lands at the target
 * RPE; accessories double-progress) rather than each program's own percentage
 * tables. Where a program ramps or uses AMRAP sets, the day note says so.
 */

/** Compact block builder: lift, sets, reps, rpe, class, movement role, progression. */
function b(
  lift: string,
  sets: number,
  reps: Reps,
  rpe: number | string,
  cls: BlockClass,
  cat: Category,
  prog: 'hold' | 'push' = cls === 'r-iso' ? 'push' : 'hold',
  alts?: string[]
): Block {
  return { lift, sets, reps, rpe, cls, cat, prog, ...(alts ? { alts } : {}) };
}

const day = (key: string, label: string, variant: string, note: string, blocks: Block[]): Day => ({
  key,
  label,
  variant,
  note,
  blocks,
});

// machine / accessory built-ins used across several programs
const LEG_PRESS = 'legpress';
const LEG_CURL = 'legcurl';
const LEG_EXT = 'legext';
const POWER_CLEAN = 'powerclean';
const SUMO = 'sumo';
const CABLE_ROW = 'cablerow';
const BACK_EXT = 'backext';
const SHRUG = 'shrug';
const HACK = 'hacksquat';

export const STAPLE_DAYS: Record<string, Day[]> = {
  'starting-strength': [
    day('ssA', 'Workout A', 'Squat · bench · pull', 'Alternate A and B, three days a week. Add weight every session while the bar moves.', [
      b('squat', 3, 5, 8, 'r-hi', 'squat'),
      b('bench', 3, 5, 8, 'r-hi', 'hpress'),
      b('deadlift', 1, 5, 8, 'r-hi', 'hinge'),
    ]),
    day('ssB', 'Workout B', 'Squat · press · clean', 'Alternate A and B, three days a week.', [
      b('squat', 3, 5, 8, 'r-hi', 'squat'),
      b('ohp', 3, 5, 8, 'r-hi', 'vpress'),
      b(POWER_CLEAN, 5, 3, 8, 'r-hi', 'hinge'),
    ]),
  ],

  'stronglifts-5x5': [
    day('slA', 'Workout A', '5×5', 'Alternate A and B. Add 2.5 kg each session you complete all 5×5.', [
      b('squat', 5, 5, 8, 'r-hi', 'squat'),
      b('bench', 5, 5, 8, 'r-hi', 'hpress'),
      b('row', 5, 5, 8, 'r-hi', 'hpull', 'hold', ['pendlay']),
    ]),
    day('slB', 'Workout B', '5×5', 'Alternate A and B. Deadlift is one heavy set of 5.', [
      b('squat', 5, 5, 8, 'r-hi', 'squat'),
      b('ohp', 5, 5, 8, 'r-hi', 'vpress'),
      b('deadlift', 1, 5, 8, 'r-hi', 'hinge'),
    ]),
  ],

  gzclp: [
    day('gz1', 'Day 1', 'T1 squat', 'T1 heavy (last set AMRAP), T2 volume, T3 pump work to failure.', [
      b('squat', 5, 3, 8, 'r-hi', 'squat'),
      b('bench', 3, 10, 8, 'r-mid', 'hpress'),
      b('latpulldown', 3, 15, 9, 'r-iso', 'vpull', 'push'),
    ]),
    day('gz2', 'Day 2', 'T1 press', 'T1 heavy (last set AMRAP), T2 volume, T3 pump work to failure.', [
      b('ohp', 5, 3, 8, 'r-hi', 'vpress'),
      b('deadlift', 3, 10, 8, 'r-mid', 'hinge'),
      b('dbrow', 3, 15, 9, 'r-iso', 'hpull', 'push'),
    ]),
    day('gz3', 'Day 3', 'T1 bench', 'T1 heavy (last set AMRAP), T2 volume, T3 pump work to failure.', [
      b('bench', 5, 3, 8, 'r-hi', 'hpress'),
      b('squat', 3, 10, 8, 'r-mid', 'squat'),
      b('latpulldown', 3, 15, 9, 'r-iso', 'vpull', 'push'),
    ]),
    day('gz4', 'Day 4', 'T1 deadlift', 'T1 heavy (last set AMRAP), T2 volume, T3 pump work to failure.', [
      b('deadlift', 5, 3, 8, 'r-hi', 'hinge'),
      b('ohp', 3, 10, 8, 'r-mid', 'vpress'),
      b('dbrow', 3, 15, 9, 'r-iso', 'hpull', 'push'),
    ]),
  ],

  'madcow-5x5': [
    day('mcMon', 'Monday', 'Heavy 5s', 'Ramp to one top set of 5 across the five sets.', [
      b('squat', 5, 5, 8, 'r-hi', 'squat'),
      b('bench', 5, 5, 8, 'r-hi', 'hpress'),
      b('row', 5, 5, 8, 'r-hi', 'hpull'),
    ]),
    day('mcWed', 'Wednesday', 'Light', 'Light squats for recovery; press and deadlift ramped.', [
      b('squat', 4, 5, 6, 'r-mid', 'squat'),
      b('ohp', 4, 5, 8, 'r-hi', 'vpress'),
      b('deadlift', 4, 5, 8, 'r-hi', 'hinge'),
    ]),
    day('mcFri', 'Friday', 'PR triple', 'Ramp up, hit a new top triple, then one back-off set of 8.', [
      b('squat', 5, [3, 5], 9, 'r-hi', 'squat'),
      b('bench', 5, [3, 5], 9, 'r-hi', 'hpress'),
      b('row', 5, [3, 5], 9, 'r-hi', 'hpull'),
    ]),
  ],

  'texas-method': [
    day('tmVol', 'Volume', 'Monday', 'Volume day: 5×5 at ~90% of your 5RM.', [
      b('squat', 5, 5, 7, 'r-hi', 'squat'),
      b('bench', 5, 5, 7, 'r-hi', 'hpress', 'hold', ['ohp']),
      b('deadlift', 1, 5, 8, 'r-hi', 'hinge'),
    ]),
    day('tmRec', 'Recovery', 'Wednesday', 'Light day — leave fresh for Friday.', [
      b('squat', 2, 5, 6, 'r-mid', 'squat'),
      b('ohp', 3, 5, 7, 'r-hi', 'vpress', 'hold', ['bench']),
      b('chinup', 3, [5, 8], 8, 'r-mid', 'vpull'),
      b(BACK_EXT, 2, [10, 12], 8, 'r-iso', 'hinge'),
    ]),
    day('tmInt', 'Intensity', 'Friday', 'Intensity day: one new 5RM per lift.', [
      b('squat', 1, 5, 9, 'r-hi', 'squat'),
      b('bench', 1, 5, 9, 'r-hi', 'hpress', 'hold', ['ohp']),
      b(POWER_CLEAN, 5, 3, 8, 'r-hi', 'hinge'),
    ]),
  ],

  'nsuns-531': [
    day('ns1', 'Day 1', 'Bench / OHP', 'T1 is nine sets climbing then descending in reps — the 1+ set is AMRAP.', [
      b('bench', 9, [1, 8], 8, 'r-hi', 'hpress'),
      b('ohp', 8, [3, 8], 7, 'r-mid', 'vpress'),
      b('facepull', 3, [12, 15], 9, 'r-iso', 'reardelt'),
    ]),
    day('ns2', 'Day 2', 'Squat / Sumo', 'T1 is nine sets climbing then descending in reps — the 1+ set is AMRAP.', [
      b('squat', 9, [1, 8], 8, 'r-hi', 'squat'),
      b(SUMO, 8, [3, 8], 7, 'r-mid', 'hinge'),
      b(LEG_CURL, 3, [10, 15], 9, 'r-iso', 'hinge'),
    ]),
    day('ns3', 'Day 3', 'OHP / Incline', 'T1 is nine sets climbing then descending in reps — the 1+ set is AMRAP.', [
      b('ohp', 9, [1, 8], 8, 'r-hi', 'vpress'),
      b('inclinebench', 8, [3, 8], 7, 'r-mid', 'hpress'),
      b('latraise', 3, [12, 15], 9, 'r-iso', 'latdelt'),
    ]),
    day('ns4', 'Day 4', 'Deadlift / Front squat', 'T1 is nine sets climbing then descending in reps — the 1+ set is AMRAP.', [
      b('deadlift', 9, [1, 8], 8, 'r-hi', 'hinge'),
      b('frontsquat', 8, [3, 8], 7, 'r-mid', 'squat'),
      b('latpulldown', 3, [8, 12], 9, 'r-iso', 'vpull'),
    ]),
    day('ns5', 'Day 5', 'Bench / CG bench', 'T1 is nine sets climbing then descending in reps — the 1+ set is AMRAP.', [
      b('bench', 9, [1, 8], 8, 'r-hi', 'hpress'),
      b('cgbench', 8, [3, 8], 7, 'r-mid', 'triceps'),
      b('ezcurl', 3, [8, 12], 9, 'r-iso', 'biceps'),
    ]),
  ],

  phul: [
    day('phulUP', 'Upper', 'Power', 'Heavy compounds, 3–5 reps.', [
      b('bench', 4, [3, 5], 8, 'r-hi', 'hpress'),
      b('dbincline', 4, [6, 10], 8, 'r-mid', 'hpress'),
      b('row', 4, [3, 5], 8, 'r-hi', 'hpull'),
      b('latpulldown', 4, [6, 10], 8, 'r-mid', 'vpull'),
      b('ohp', 3, [5, 8], 8, 'r-hi', 'vpress'),
      b('ezcurl', 3, [6, 10], 9, 'r-iso', 'biceps'),
      b('skull', 3, [6, 10], 9, 'r-iso', 'triceps'),
    ]),
    day('phulLP', 'Lower', 'Power', 'Heavy compounds, 3–5 reps.', [
      b('squat', 4, [3, 5], 8, 'r-hi', 'squat'),
      b('deadlift', 4, [3, 5], 8, 'r-hi', 'hinge'),
      b(LEG_PRESS, 5, [10, 15], 8, 'r-mid', 'squat'),
      b(LEG_CURL, 4, [6, 10], 9, 'r-iso', 'hinge'),
      b('calf', 4, [6, 10], 9, 'r-iso', 'calf'),
    ]),
    day('phulUH', 'Upper', 'Hypertrophy', 'Moderate weights, 8–12 reps.', [
      b('dbincline', 4, [8, 12], 8, 'r-mid', 'hpress'),
      b('cablefly', 3, [8, 12], 9, 'r-iso', 'hpress'),
      b(CABLE_ROW, 4, [8, 12], 8, 'r-mid', 'hpull'),
      b('dbrow', 4, [8, 12], 8, 'r-mid', 'hpull'),
      b('latraise', 4, [8, 12], 9, 'r-iso', 'latdelt'),
      b('dbcurl', 4, [8, 12], 9, 'r-iso', 'biceps'),
      b('pushdown', 4, [8, 12], 9, 'r-iso', 'triceps'),
    ]),
    day('phulLH', 'Lower', 'Hypertrophy', 'Moderate weights, 8–15 reps.', [
      b('frontsquat', 4, [8, 12], 8, 'r-mid', 'squat'),
      b('lunge', 3, [8, 12], 8, 'r-mid', 'uni'),
      b(LEG_EXT, 4, [10, 15], 9, 'r-iso', 'squat'),
      b(LEG_CURL, 4, [10, 15], 9, 'r-iso', 'hinge'),
      b('seatedcalf', 4, [8, 12], 9, 'r-iso', 'calf'),
      b('calf', 3, [8, 12], 9, 'r-iso', 'calf'),
    ]),
  ],

  phat: [
    day('phatUP', 'Upper', 'Power', 'Heavy pulls and presses.', [
      b('row', 3, [3, 5], 8, 'r-hi', 'hpull'),
      b('pullup', 2, [6, 10], 8, 'r-mid', 'vpull'),
      b('bench', 3, [3, 5], 8, 'r-hi', 'hpress'),
      b('dips', 2, [6, 10], 8, 'r-mid', 'triceps'),
      b('dbohp', 3, [6, 10], 8, 'r-mid', 'vpress'),
      b('ezcurl', 3, [6, 10], 9, 'r-iso', 'biceps'),
      b('skull', 3, [6, 10], 9, 'r-iso', 'triceps'),
    ]),
    day('phatLP', 'Lower', 'Power', 'Heavy squats and hinges.', [
      b('squat', 3, [3, 5], 8, 'r-hi', 'squat'),
      b(LEG_PRESS, 2, [6, 10], 8, 'r-mid', 'squat'),
      b(LEG_EXT, 2, [6, 10], 9, 'r-iso', 'squat'),
      b('rdl', 3, [5, 8], 8, 'r-hi', 'hinge'),
      b(LEG_CURL, 2, [6, 10], 9, 'r-iso', 'hinge'),
      b('calf', 3, [6, 10], 9, 'r-iso', 'calf'),
    ]),
    day('phatBS', 'Back & Shoulders', 'Hypertrophy', 'Speed rows first (6×3 at ~65%), then volume.', [
      b('row', 6, 3, 6, 'r-mid', 'hpull'),
      b('pullup', 3, [8, 12], 8, 'r-mid', 'vpull'),
      b(CABLE_ROW, 3, [8, 12], 8, 'r-mid', 'hpull'),
      b('dbrow', 2, [12, 15], 9, 'r-mid', 'hpull'),
      b('dbohp', 3, [8, 12], 8, 'r-mid', 'vpress'),
      b('latraise', 3, [12, 20], 9, 'r-iso', 'latdelt'),
      b(SHRUG, 2, [12, 15], 9, 'r-iso', 'hpull'),
    ]),
    day('phatLH', 'Lower', 'Hypertrophy', 'Speed squats first (6×3 at ~65%), then volume.', [
      b('squat', 6, 3, 6, 'r-mid', 'squat'),
      b(HACK, 3, [8, 12], 8, 'r-mid', 'squat'),
      b(LEG_PRESS, 2, [12, 15], 8, 'r-mid', 'squat'),
      b(LEG_EXT, 3, [15, 20], 9, 'r-iso', 'squat'),
      b('rdl', 3, [8, 12], 8, 'r-mid', 'hinge'),
      b(LEG_CURL, 2, [12, 15], 9, 'r-iso', 'hinge'),
      b('seatedcalf', 4, [10, 15], 9, 'r-iso', 'calf'),
    ]),
    day('phatCA', 'Chest & Arms', 'Hypertrophy', 'Speed bench first (6×3 at ~65%), then volume.', [
      b('bench', 6, 3, 6, 'r-mid', 'hpress'),
      b('dbincline', 3, [8, 12], 8, 'r-mid', 'hpress'),
      b('cablefly', 2, [15, 20], 9, 'r-iso', 'hpress'),
      b('preacher', 3, [8, 12], 9, 'r-iso', 'biceps'),
      b('inclinecurl', 2, [12, 15], 9, 'r-iso', 'biceps'),
      b('cgbench', 3, [8, 12], 8, 'r-mid', 'triceps'),
      b('pushdown', 2, [12, 15], 9, 'r-iso', 'triceps'),
    ]),
  ],

  'reddit-ppl': [
    day('rpPullA', 'Pull', 'A · deadlift', 'Last set of the first lift is AMRAP.', [
      b('deadlift', 1, 5, 9, 'r-hi', 'hinge'),
      b('latpulldown', 3, [8, 12], 8, 'r-mid', 'vpull', 'hold', ['pullup']),
      b(CABLE_ROW, 3, [8, 12], 8, 'r-mid', 'hpull'),
      b('facepull', 5, [15, 20], 9, 'r-iso', 'reardelt'),
      b('hammer', 4, [8, 12], 9, 'r-iso', 'biceps'),
      b('dbcurl', 4, [8, 12], 9, 'r-iso', 'biceps'),
    ]),
    day('rpPushA', 'Push', 'A · bench', 'Last set of bench is AMRAP.', [
      b('bench', 5, 5, 8, 'r-hi', 'hpress'),
      b('ohp', 3, [8, 12], 8, 'r-mid', 'vpress'),
      b('dbincline', 3, [8, 12], 8, 'r-mid', 'hpress'),
      b('pushdown', 3, [8, 12], 9, 'r-iso', 'triceps'),
      b('latraise', 3, [15, 20], 9, 'r-iso', 'latdelt'),
      b('cableohext', 3, [8, 12], 9, 'r-iso', 'triceps'),
    ]),
    day('rpLegsA', 'Legs', 'A', 'Last set of squat is AMRAP.', [
      b('squat', 3, 5, 8, 'r-hi', 'squat'),
      b('rdl', 3, [8, 12], 8, 'r-mid', 'hinge'),
      b(LEG_PRESS, 3, [8, 12], 8, 'r-mid', 'squat'),
      b(LEG_CURL, 3, [8, 12], 9, 'r-iso', 'hinge'),
      b('calf', 5, [8, 12], 9, 'r-iso', 'calf'),
    ]),
    day('rpPullB', 'Pull', 'B · row', 'Last set of the first lift is AMRAP.', [
      b('row', 5, 5, 8, 'r-hi', 'hpull'),
      b('pullup', 3, [8, 12], 8, 'r-mid', 'vpull', 'hold', ['latpulldown']),
      b(CABLE_ROW, 3, [8, 12], 8, 'r-mid', 'hpull'),
      b('facepull', 5, [15, 20], 9, 'r-iso', 'reardelt'),
      b('hammer', 4, [8, 12], 9, 'r-iso', 'biceps'),
      b('dbcurl', 4, [8, 12], 9, 'r-iso', 'biceps'),
    ]),
    day('rpPushB', 'Push', 'B · press', 'Last set of OHP is AMRAP.', [
      b('ohp', 5, 5, 8, 'r-hi', 'vpress'),
      b('bench', 3, [8, 12], 8, 'r-mid', 'hpress'),
      b('dbincline', 3, [8, 12], 8, 'r-mid', 'hpress'),
      b('pushdown', 3, [8, 12], 9, 'r-iso', 'triceps'),
      b('latraise', 3, [15, 20], 9, 'r-iso', 'latdelt'),
      b('cableohext', 3, [8, 12], 9, 'r-iso', 'triceps'),
    ]),
    day('rpLegsB', 'Legs', 'B', 'Last set of squat is AMRAP.', [
      b('squat', 3, 5, 8, 'r-hi', 'squat'),
      b('rdl', 3, [8, 12], 8, 'r-mid', 'hinge'),
      b(LEG_PRESS, 3, [8, 12], 8, 'r-mid', 'squat'),
      b(LEG_CURL, 3, [8, 12], 9, 'r-iso', 'hinge'),
      b('calf', 5, [8, 12], 9, 'r-iso', 'calf'),
    ]),
  ],
};

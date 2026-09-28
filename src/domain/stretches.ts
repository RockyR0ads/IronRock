// The stretch catalogue — the movement library for the Stretching programmer.
// Separate from the lifting LIFTS catalogue: stretches are timed holds, not
// weighted reps, so they carry a hold cue and a target area, not a load.

/** The body area a stretch targets — drives filtering and session balance. */
export type StretchArea =
  | 'hipflexor'
  | 'hamstring'
  | 'glute'
  | 'quad'
  | 'adductor'
  | 'tspine'
  | 'calf'
  | 'general';

/** Display names for each area. */
export const AREA_LABEL: Record<StretchArea, string> = {
  hipflexor: 'Hip flexors',
  hamstring: 'Hamstrings',
  glute: 'Glutes',
  quad: 'Quads',
  adductor: 'Adductors',
  tspine: 'Upper back',
  calf: 'Calves',
  general: 'Full body',
};

/**
 * How the stretch is performed:
 * - `dynamic`  — moving through range to warm up (timed, not held)
 * - `static`   — eased into a position and held
 * - `pnf`      — contract-relax: hold, contract into it, then ease deeper
 */
export type StretchType = 'dynamic' | 'static' | 'pnf';

export interface Stretch {
  id: string;
  name: string;
  area: StretchArea;
  type: StretchType;
  /** Done one side at a time (each side gets its own timed hold). */
  perSide: boolean;
  /** One-line coaching cue shown during the hold. */
  cue: string;
}

/** The catalogue. Focused on the desk-sitting chain: hip flexors + hamstrings, with support. */
export const STRETCHES: Record<string, Stretch> = {
  // --- dynamic warm-ups ---
  legswings: { id: 'legswings', name: 'Leg swings', area: 'hamstring', type: 'dynamic', perSide: true, cue: 'Hold support; swing the leg front-to-back, relaxed, building range each rep.' },
  worldsgreatest: { id: 'worldsgreatest', name: "World's greatest stretch", area: 'general', type: 'dynamic', perSide: true, cue: 'Deep lunge, back hand to the floor, rotate the front arm up to the ceiling.' },
  catcow: { id: 'catcow', name: 'Cat–cow', area: 'tspine', type: 'dynamic', perSide: false, cue: 'On all fours, alternate arching and rounding the spine with your breath.' },
  hipcircles: { id: 'hipcircles', name: 'Hip CARs', area: 'hipflexor', type: 'dynamic', perSide: true, cue: 'On all fours, draw the biggest slow circle you can with one knee.' },

  // --- hip flexors ---
  kneelinghipflexor: { id: 'kneelinghipflexor', name: 'Half-kneeling hip flexor', area: 'hipflexor', type: 'static', perSide: true, cue: 'Tuck the tailbone under, squeeze the back glute, ease the hips forward. Tall chest.' },
  couchstretch: { id: 'couchstretch', name: 'Couch stretch', area: 'hipflexor', type: 'static', perSide: true, cue: 'Back shin up a wall/couch, torso tall. Ease upright only as far as you can hold calm.' },
  standinglunge: { id: 'standinglunge', name: 'Standing lunge reach', area: 'hipflexor', type: 'static', perSide: true, cue: 'Long stance, back leg straight, same-side arm overhead and slightly across.' },
  ninety90: { id: 'ninety90', name: '90/90 hip switch', area: 'glute', type: 'static', perSide: true, cue: 'Front shin and back shin at 90°. Sit tall over the front hip; hold, then switch.' },

  // --- hamstrings ---
  supinestrap: { id: 'supinestrap', name: 'Supine strap hamstring', area: 'hamstring', type: 'static', perSide: true, cue: 'On your back, strap round the foot, leg straight up. Ease it toward you, keep the knee soft-straight.' },
  seatedfold: { id: 'seatedfold', name: 'Seated forward fold', area: 'hamstring', type: 'static', perSide: false, cue: 'Sit tall, hinge from the hips over straight legs. Long spine — lead with the chest, not the head.' },
  singlelegrdl: { id: 'singlelegrdl', name: 'Active single-leg RDL', area: 'hamstring', type: 'dynamic', perSide: true, cue: 'Hinge on one leg, reach toward the floor, then stand tall. Controlled, feel the hamstring load.' },
  hamstringpnf: { id: 'hamstringpnf', name: 'Hamstring contract–relax', area: 'hamstring', type: 'pnf', perSide: true, cue: 'Strap stretch: push the leg into the strap ~5s, then relax and ease it deeper. Repeat.' },

  // --- glutes & support ---
  figure4: { id: 'figure4', name: 'Figure-4 glute', area: 'glute', type: 'static', perSide: true, cue: 'Ankle over the opposite knee; draw the thigh toward your chest. Keep the near foot flexed.' },
  pigeon: { id: 'pigeon', name: 'Pigeon', area: 'glute', type: 'static', perSide: true, cue: 'Front shin across, hips square, walk the hands forward. Breathe into the glute.' },
  tspineopener: { id: 'tspineopener', name: 'Open-book t-spine', area: 'tspine', type: 'static', perSide: true, cue: 'Side-lying, knees stacked; open the top arm across and follow it with your eyes.' },
  childs: { id: 'childs', name: "Child's pose reach", area: 'tspine', type: 'static', perSide: false, cue: 'Hips to heels, arms long, chest sinking. Walk the hands to each side for the lats.' },
  frog: { id: 'frog', name: 'Frog stretch', area: 'adductor', type: 'static', perSide: false, cue: 'Knees wide, shins in line with thighs, rock the hips back gently. Never force it.' },
  calfwall: { id: 'calfwall', name: 'Wall calf stretch', area: 'calf', type: 'static', perSide: true, cue: 'Back heel down, back leg straight, lean into the wall. Feel the calf lengthen.' },
};

export function stretchById(id: string): Stretch {
  return STRETCHES[id] ?? { id, name: id, area: 'general', type: 'static', perSide: false, cue: '' };
}

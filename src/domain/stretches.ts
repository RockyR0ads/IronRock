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
  /** Library exercise with start/end photos and steps for this stretch. */
  lib?: string;
  /** Hand-written how-to; overrides the library's steps (or stands in for it). */
  steps?: string[];
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

/** How-to links: library exercises with photos, for the stretches that have one. */
const STRETCH_LIB: Record<string, string> = {
  worldsgreatest: 'Worlds_Greatest_Stretch',
  catcow: 'Cat_Stretch',
  hipcircles: 'Hip_Circles_prone',
  kneelinghipflexor: 'Kneeling_Hip_Flexor',
  standinglunge: 'Standing_Hip_Flexors',
  supinestrap: 'Hamstring_Stretch',
  seatedfold: 'Seated_Floor_Hamstring_Stretch',
  hamstringpnf: 'Hamstring_Stretch',
  childs: 'Childs_Pose',
  calfwall: 'Calf_Stretch_Hands_Against_Wall'
};

/** Hand-written steps for stretches the library lacks (or does differently). */
const STRETCH_STEPS: Record<string, string[]> = {
  legswings: [
    "Stand side-on to a wall or rack and hold it with one hand.",
    "Swing the outside leg forward and back like a pendulum, knee soft, torso tall.",
    "Start small and let each swing go a little higher as the hamstring and hip loosen.",
    "Do the time on one leg, then turn around for the other."
  ],
  couchstretch: [
    "Kneel with your back to a couch or wall. Slide one shin up it so the knee is in the corner.",
    "Step the other foot forward into a half-kneel, hands on the front knee.",
    "Squeeze the back glute and tuck the tailbone under — the stretch should land in the front of the back thigh.",
    "Slowly bring the torso upright only as far as you can breathe calmly. Back off if the knee complains."
  ],
  ninety90: [
    "Sit on the floor with the front leg bent 90° in front of you and the back leg bent 90° out to the side.",
    "Sit tall and hinge your chest forward over the front shin until you feel the outside of the hip.",
    "Hold, then rotate both knees over to the other side to switch legs."
  ],
  singlelegrdl: [
    "Stand on one leg with a slight bend in the knee. Hold a wall if you need balance.",
    "Hinge at the hip, reaching your hands toward the floor while the free leg extends straight behind you.",
    "Go until you feel the standing hamstring load, keeping the back flat and hips square.",
    "Drive the hip forward to stand tall. Slow and controlled; switch legs."
  ],
  hamstringpnf: [
    "Lie on your back with a strap around one foot, leg straight up.",
    "Pull the leg in until you feel a stretch, and hold for a few seconds.",
    "Push the leg into the strap at about half effort for 5 s without letting it move.",
    "Relax, breathe out and ease the leg deeper. Repeat the push–relax cycle."
  ],
  figure4: [
    "Lie on your back with both knees bent and feet flat.",
    "Cross one ankle over the opposite knee, foot flexed.",
    "Thread your hands behind the bottom thigh and pull it toward your chest.",
    "Keep your head and lower back on the floor; feel it in the glute of the crossed leg."
  ],
  pigeon: [
    "From all fours, bring one knee forward behind the same-side wrist, shin angled across your body.",
    "Slide the other leg straight back, top of the foot on the floor.",
    "Square your hips toward the floor; prop a cushion under the front hip if it lifts.",
    "Walk your hands forward and lower your chest as far as is comfortable. Breathe into the glute."
  ],
  tspineopener: [
    "Lie on your side with knees bent to 90° and stacked, arms straight out in front, palms together.",
    "Keep the knees pinned together (press them with the bottom hand if needed).",
    "Lift the top arm and open it across to the other side like a book, following the hand with your eyes.",
    "Let the shoulder sink toward the floor, breathe, then close the book. Repeat on the other side."
  ],
  frog: [
    "Start on all fours on a soft surface. Slide your knees out wide.",
    "Turn your feet out so the inside edges touch the floor and shins line up with the thighs.",
    "Drop onto your forearms and gently rock the hips back toward your heels.",
    "Stop at a strong but calm stretch in the inner thighs — never bounce or force it."
  ]
};

for (const st of Object.values(STRETCHES)) {
  st.lib = STRETCH_LIB[st.id];
  st.steps = STRETCH_STEPS[st.id];
}

export function stretchById(id: string): Stretch {
  return STRETCHES[id] ?? { id, name: id, area: 'general', type: 'static', perSide: false, cue: '' };
}

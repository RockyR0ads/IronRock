import type { LibraryExercise } from '../domain/library';

/**
 * Staple exercises the vendored free-exercise-db is missing. Kept separate from
 * the (script-regenerated) exercises.json so gap-fills survive a data refresh.
 * Ids are prefixed `supp-` and carry no images (the app tolerates an empty
 * `images` array).
 */
export const SUPPLEMENT_EXERCISES: LibraryExercise[] = [
  {
    id: 'supp-standing-cable-lateral-raise',
    name: 'Standing Cable Lateral Raise',
    equipment: 'cable',
    muscles: ['shoulders'],
    images: [],
    instructions: [
      'Stand side-on to a low pulley so the cable crosses in front of your body. Grasp the handle with the hand furthest from the machine, arm hanging across your hips with a slight bend at the elbow. This is the starting position.',
      'Keeping the elbow soft and the torso upright, raise the arm out to the side until the upper arm is roughly parallel to the floor at shoulder height. Exhale and hold the contraction for a second.',
      'Slowly lower back to the start against the cable tension as you inhale.',
      'Complete all reps on one side, then turn around and repeat with the other arm. Tip: let the cable — not momentum — do the work; keep the raise smooth on the way up and down.',
    ],
  },
  {
    id: 'supp-pendlay-row',
    name: 'Pendlay Row',
    equipment: 'barbell',
    muscles: ['middle back', 'lats'],
    images: [],
    instructions: [
      'Load a barbell on the floor. Stand with feet hip-width, hinge at the hips until your torso is roughly parallel to the floor, and take a double-overhand grip just outside your knees. Keep a flat back and a braced core.',
      'From this dead stop, explosively pull the bar off the floor to your lower chest / upper stomach, driving the elbows up and back and squeezing the shoulder blades together.',
      'Lower the bar all the way back to the floor under control so it comes to a complete rest between every rep.',
      'Reset your bracing and back angle, then repeat. Tip: the torso stays parallel throughout — unlike a standard bent-over row, each rep starts fresh from the floor.',
    ],
  },
  {
    id: 'supp-nordic-hamstring-curl',
    name: 'Nordic Hamstring Curl',
    equipment: 'body only',
    muscles: ['hamstrings'],
    images: [],
    instructions: [
      'Kneel on a pad with your torso upright. Anchor your heels/ankles under a loaded barbell, a partner\'s hands, or a foot strap so they cannot lift. Keep your hips extended so knees, hips and shoulders form a straight line.',
      'Bracing your core and squeezing your glutes, slowly lower your torso toward the floor as far as you can while resisting with the hamstrings — fight gravity the whole way down.',
      'When you can no longer control the descent, catch yourself with your hands in a push-up position, then push off just enough to help the hamstrings pull you back up to the start.',
      'Return under hamstring tension to the upright kneeling position. Tip: this is very hard — shorten the range or add a band/hand assist until you can control a full rep.',
    ],
  },
];

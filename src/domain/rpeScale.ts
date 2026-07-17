/**
 * The RPE scale as lifters actually use it: each rating is defined by how many
 * reps you had left in the tank (reps in reserve). Mirrors the reps-to-failure
 * model in `calc.ts`, where rtf = reps + (10 − rpe).
 */
export interface RpeStep {
  value: number;
  /** What that rating should feel like, in one sentence. */
  feel: string;
}

/** Hardest first — the top of the list is where most working sets land. */
export const RPE_SCALE: RpeStep[] = [
  { value: 10, feel: 'Maximal. No more reps, and no more weight.' },
  { value: 9.5, feel: 'No more reps, but you could have added a little weight.' },
  { value: 9, feel: '1 rep left in the tank.' },
  { value: 8.5, feel: 'Definitely 1 more rep, maybe 2.' },
  { value: 8, feel: '2 reps left in the tank.' },
  { value: 7.5, feel: 'Definitely 2 more reps, maybe 3.' },
  { value: 7, feel: '3 reps left. Strong and fast.' },
  { value: 6.5, feel: 'Definitely 3 more reps, maybe 4.' },
  { value: 6, feel: '4 reps left. Moving quickly, no strain.' },
  { value: 5.5, feel: 'Definitely 4 more reps, maybe 5.' },
  { value: 5, feel: '5 reps left. Comfortable working weight.' },
  { value: 4.5, feel: 'Easy. Around 5 to 6 reps left.' },
  { value: 4, feel: 'Easy. About 6 reps left.' },
  { value: 3.5, feel: 'Light. Warm-up territory.' },
  { value: 3, feel: 'Light warm-up. Effort barely registers.' },
  { value: 2.5, feel: 'Very light warm-up.' },
  { value: 2, feel: 'Very light. Little more than the movement itself.' },
  { value: 1.5, feel: 'Almost no effort.' },
  { value: 1, feel: 'No effort at all.' },
];

/** The scale entry for a rating, or null if it isn't on the scale. */
export function rpeStep(rpe: number): RpeStep | null {
  return RPE_SCALE.find((s) => s.value === rpe) ?? null;
}

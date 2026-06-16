// %1RM model keyed by reps-to-failure (rtf). Ported exactly from the reference.

export const PCT: Record<number, number> = {
  0: 1.0,
  1: 0.955,
  2: 0.922,
  3: 0.892,
  4: 0.892,
  5: 0.863,
  6: 0.837,
  7: 0.811,
  8: 0.786,
  9: 0.762,
  10: 0.739,
  11: 0.717,
  12: 0.694,
  13: 0.673,
  14: 0.653,
  15: 0.634,
};

/**
 * Fraction of 1RM for a given reps-to-failure.
 * Clamps rtf <= 0 to 1.0 and rtf >= 15 to 0.634; otherwise linear-interpolates
 * between the two nearest integer entries.
 */
export function pctFor(rtf: number): number {
  if (rtf <= 0) return 1.0;
  if (rtf >= 15) return PCT[15];
  const lo = Math.floor(rtf);
  const hi = Math.ceil(rtf);
  if (lo === hi) return PCT[lo];
  return PCT[lo] + (PCT[hi] - PCT[lo]) * (rtf - lo);
}

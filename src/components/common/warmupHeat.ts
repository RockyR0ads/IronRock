/**
 * Warm-up "heating up" ramp: each successive warm-up set reads warmer, from a
 * cold blue through yellow and orange to a hot red as you approach working
 * weight. Beyond the last colour it stays red. Shared by the live logging card
 * and the archived-session view so warm-ups look the same in both.
 */
export const WARMUP_HEAT = ['#4C8DF0', '#F0BE4B', '#F5883E', '#FF5247'];

/** Colour for the nth warm-up set (0-based), clamped to the hottest. */
export const heatColor = (i: number): string => WARMUP_HEAT[Math.min(i, WARMUP_HEAT.length - 1)];

// Barbell plate math — pure, framework-agnostic.

/** Standard Olympic barbell weight (kg). */
export const BAR_KG = 20;

/** Plate denominations commonly available in a gym (kg), heaviest first. */
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Greedy decomposition of the plates loaded on ONE side of the bar to reach
 * `total` kg, heaviest first. Returns [] for an empty or sub-bar weight.
 * Any remainder smaller than the lightest plate is dropped.
 */
export function platesPerSide(total: number, bar = BAR_KG, available = PLATES): number[] {
  let perSide = (total - bar) / 2;
  if (!(perSide > 0)) return [];
  const out: number[] = [];
  for (const plate of available) {
    while (perSide >= plate - 1e-9) {
      out.push(plate);
      perSide -= plate;
    }
  }
  return out;
}

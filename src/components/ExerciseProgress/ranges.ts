/** A selectable time window for the progress charts. */
export interface Range {
  key: string;
  label: string;
  /** Days back from now; Infinity means the whole history. */
  days: number;
}

export const RANGES: Range[] = [
  { key: '3m', label: '3M', days: 90 },
  { key: '6m', label: '6M', days: 182 },
  { key: '1y', label: '1Y', days: 365 },
  { key: 'all', label: 'All', days: Infinity },
];

export function rangeFor(key: string): Range {
  return RANGES.find((r) => r.key === key) ?? RANGES[RANGES.length - 1];
}

/**
 * Keep only the points within `days` of now (measured from the latest point, so
 * an imported history that ends in the past still shows its own recent window).
 * A window that would leave fewer than two points falls back to the full series
 * — a one-dot chart is never what the filter was for.
 */
export function sliceByRange<T extends { at: string }>(points: T[], days: number): T[] {
  if (!Number.isFinite(days) || points.length < 2) return points;
  const end = new Date(points[points.length - 1].at).getTime();
  const cut = end - days * 86_400_000;
  const kept = points.filter((p) => new Date(p.at).getTime() >= cut);
  return kept.length >= 2 ? kept : points;
}

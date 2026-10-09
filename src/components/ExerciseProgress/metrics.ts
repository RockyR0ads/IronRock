import type { ProgressPoint } from '../../domain/progress';
import { C } from './charts/chartUtils';

/** A plottable metric: how to pull it from a point, and how to colour it. */
export interface Metric {
  key: string;
  label: string;
  unit: string;
  color: string;
  pick: (p: ProgressPoint) => number;
}

export const METRICS: Metric[] = [
  { key: 'e1rm', label: 'Est. 1RM', unit: 'kg', color: C.accent, pick: (p) => p.e1rm },
  { key: 'top', label: 'Top set', unit: 'kg', color: C.blue, pick: (p) => p.topWeight },
  { key: 'volume', label: 'Volume', unit: 'kg', color: C.green, pick: (p) => p.volume },
  { key: 'reps', label: 'Reps', unit: '', color: C.yellow, pick: (p) => p.reps },
  { key: 'intensity', label: 'Intensity', unit: '%', color: C.ink, pick: (p) => p.intensity },
  { key: 'time', label: 'Time', unit: 'm', color: '#4CC9D6', pick: (p) => Math.round(p.exerciseSec / 60) },
];

export function metricFor(key: string): Metric {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}

/**
 * Metrics worth offering for a series. "Time" only appears once at least one
 * session carries per-exercise timing, so lifts with no timed sessions (all
 * imported/older history) don't get a flat-zero chart option.
 */
export function availableMetrics(series: { exerciseSec: number }[]): Metric[] {
  const hasTime = series.some((p) => p.exerciseSec > 0);
  return hasTime ? METRICS : METRICS.filter((m) => m.key !== 'time');
}

import type { ProgressPoint } from '../../domain/progress';
import { C } from './charts/chartUtils';
import type { Measure } from '../../domain/measure';

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
];

/** Metrics for timed holds (plank, dead hang). */
export const TIME_METRICS: Metric[] = [
  { key: 'hold', label: 'Best time', unit: 's', color: C.accent, pick: (p) => p.bestSecs },
  { key: 'ttime', label: 'Total time', unit: 's', color: C.blue, pick: (p) => p.totalSecs },
];

/** Metrics for conditioning (run, row, bike). */
export const DIST_METRICS: Metric[] = [
  { key: 'dist', label: 'Distance', unit: 'km', color: C.green, pick: (p) => Math.round(p.dist / 100) / 10 },
  { key: 'dur', label: 'Duration', unit: 'min', color: C.blue, pick: (p) => Math.round(p.totalSecs / 6) / 10 },
];

/** The metric set that fits how a lift is measured. */
export function metricsFor(measure: Measure): Metric[] {
  return measure === 'time' ? TIME_METRICS : measure === 'distance' ? DIST_METRICS : METRICS;
}

export function metricFor(key: string): Metric {
  return [...METRICS, ...TIME_METRICS, ...DIST_METRICS].find((m) => m.key === key) ?? METRICS[0];
}

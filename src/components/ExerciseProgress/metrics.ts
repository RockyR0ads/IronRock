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
];

export function metricFor(key: string): Metric {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}

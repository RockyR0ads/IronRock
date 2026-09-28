// Archived stretching sessions and the flexibility benchmarks that track whether
// the program is actually working.

import type { StretchArea } from './stretches';
import type { StretchSessionType } from './stretchProgram';

/** A completed stretching session, archived to history. */
export interface StretchSession {
  id: string;
  /** ISO timestamp completed. */
  at: string;
  type: StretchSessionType;
  /** Held steps completed. */
  steps: number;
  /** Total seconds held across the session. */
  holdSec: number;
  /** Areas worked, for the history summary. */
  areas: StretchArea[];
}

/** Which flexibility self-test a benchmark records. */
export type FlexMetric = 'hamstring' | 'hipflexor';

/** A single flexibility measurement over time. */
export interface FlexBenchmark {
  /** ISO date (day granularity). */
  at: string;
  metric: FlexMetric;
  /** The measured value, in the metric's unit. */
  value: number;
}

export interface FlexMetricMeta {
  label: string;
  unit: string;
  /** 'up' when a bigger number is better (more flexible), else 'down'. */
  better: 'up' | 'down';
  /** How to take the measurement, shown on the entry sheet. */
  how: string;
}

/**
 * The two self-measurable benchmarks. Both track a trend from a repeatable home
 * test — absolute accuracy matters less than measuring the same way each time.
 */
export const FLEX_METRICS: Record<FlexMetric, FlexMetricMeta> = {
  hamstring: {
    label: 'Sit & reach',
    unit: 'cm',
    better: 'up',
    how: 'Sit with legs straight, feet against a box. Reach forward; measure how far your fingertips pass (+) or fall short of (−) your toes, in cm.',
  },
  hipflexor: {
    label: 'Couch-stretch reach',
    unit: 'cm',
    better: 'up',
    how: 'In the couch stretch (back shin up a wall), rise as tall as you can hold calmly. Measure the gap from the wall to your front heel, in cm. Same setup each time.',
  },
};

/** Latest value logged for a metric, if any. */
export function latestBenchmark(list: FlexBenchmark[], metric: FlexMetric): FlexBenchmark | undefined {
  const sorted = list.filter((b) => b.metric === metric).sort((a, b) => a.at.localeCompare(b.at));
  return sorted.length ? sorted[sorted.length - 1] : undefined;
}

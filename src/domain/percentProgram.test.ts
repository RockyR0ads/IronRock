import { describe, it, expect } from 'vitest';
import {
  pctWeight,
  resolveSets,
  straightSets,
  trainingMax,
  cycleWeek,
} from './percentProgram';

describe('percentProgram', () => {
  it('rounds a %-of-TM weight to the increment', () => {
    expect(pctWeight(100, 85, 2.5)).toBe(85);
    expect(pctWeight(102.5, 90, 5)).toBe(90); // 92.25 → 90
  });

  it('resolves a scheme, carrying reps and amrap through', () => {
    const sets = resolveSets(100, [
      { pct: 75, reps: 5 },
      { pct: 95, reps: 1, amrap: true },
    ], 2.5);
    expect(sets).toEqual([
      { pct: 75, reps: 5, weight: 75 },
      { pct: 95, reps: 1, amrap: true, weight: 95 },
    ]);
  });

  it('builds straight supplemental sets', () => {
    const b = straightSets(120, { pct: 50, sets: 5, reps: 10 }, 2.5);
    expect(b).toHaveLength(5);
    expect(b.every((s) => s.reps === 10 && s.weight === 60)).toBe(true);
  });

  it('derives a training max at a configurable percentage', () => {
    expect(trainingMax(100, 2.5)).toBe(90);
    expect(trainingMax(100, 2.5, 85)).toBe(85);
  });

  it('cycles the week over an arbitrary cycle length', () => {
    const DAY = 864e5;
    const start = '2026-01-01T00:00:00Z';
    const at = (d: number) => new Date(new Date(start).getTime() + d * DAY);
    expect(cycleWeek(start, 4, at(0))).toBe(1);
    expect(cycleWeek(start, 4, at(21))).toBe(4);
    expect(cycleWeek(start, 4, at(28))).toBe(1);
    expect(cycleWeek(start, 3, at(21))).toBe(1); // 3-week cycle
    expect(cycleWeek(undefined, 4)).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { mainSets, bbbSets, cycleWeek, tmFromOneRm, tmIncrement } from './wendler531';

describe('wendler531', () => {
  it('computes week 1 (5s) percentages off the TM', () => {
    const s = mainSets(100, 1, 2.5);
    expect(s.map((x) => x.weight)).toEqual([65, 75, 85]);
    expect(s.map((x) => x.reps)).toEqual([5, 5, 5]);
    expect(s[2].amrap).toBe(true); // top set is AMRAP
    expect(s[0].amrap).toBeFalsy();
  });

  it('computes week 3 (5/3/1) with a heavy single AMRAP', () => {
    const s = mainSets(100, 3, 2.5);
    expect(s.map((x) => [x.weight, x.reps])).toEqual([
      [75, 5],
      [85, 3],
      [95, 1],
    ]);
    expect(s[2].amrap).toBe(true);
  });

  it('has no AMRAP on the deload week', () => {
    const s = mainSets(100, 4, 2.5);
    expect(s.map((x) => x.weight)).toEqual([40, 50, 60]);
    expect(s.some((x) => x.amrap)).toBe(false);
  });

  it('rounds to the increment', () => {
    expect(mainSets(102.5, 1, 5).map((x) => x.weight)).toEqual([65, 75, 85]);
  });

  it('BBB is five sets of ten at 50% TM by default', () => {
    const b = bbbSets(120, 2.5);
    expect(b).toHaveLength(5);
    expect(b.every((x) => x.reps === 10 && x.weight === 60)).toBe(true);
  });

  it('cycles the wave week every 4 weeks', () => {
    const DAY = 864e5;
    const start = '2026-01-01T00:00:00Z';
    const at = (d: number) => new Date(new Date(start).getTime() + d * DAY);
    expect(cycleWeek(start, at(0))).toBe(1);
    expect(cycleWeek(start, at(7))).toBe(2);
    expect(cycleWeek(start, at(21))).toBe(4);
    expect(cycleWeek(start, at(28))).toBe(1); // new cycle
    expect(cycleWeek(undefined)).toBe(1);
  });

  it('derives TM from 1RM at 90% and bumps upper/lower differently', () => {
    expect(tmFromOneRm(100, 2.5)).toBe(90);
    expect(tmIncrement('bench')).toBe(2.5);
    expect(tmIncrement('squat')).toBe(5);
  });
});

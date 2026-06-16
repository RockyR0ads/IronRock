import { describe, it, expect } from 'vitest';
import { estimate1Rm, targetLoad, midReps, round, repsToFailure } from './calc';

describe('repsToFailure', () => {
  it('is reps + (10 - rpe)', () => {
    expect(repsToFailure(5, 8)).toBe(7);
    expect(repsToFailure(8, 10)).toBe(8);
  });
});

describe('estimate1Rm', () => {
  it('100kg x 5 @ RPE 8 ≈ 123kg', () => {
    // rtf = 7 → pctFor(7) = 0.811 → 100 / 0.811 ≈ 123.3
    const e1rm = estimate1Rm(100, 5, 8);
    expect(e1rm).not.toBeNull();
    expect(e1rm!).toBeCloseTo(123.3, 1);
  });

  it('returns null for missing or non-positive inputs', () => {
    expect(estimate1Rm(0, 5, 8)).toBeNull();
    expect(estimate1Rm(100, 0, 8)).toBeNull();
    expect(estimate1Rm(100, 5, 0)).toBeNull();
    expect(estimate1Rm(-100, 5, 8)).toBeNull();
  });
});

describe('midReps', () => {
  it('returns the value for a fixed number', () => {
    expect(midReps(5)).toBe(5);
  });
  it('returns the midpoint for a range', () => {
    expect(midReps([8, 10])).toBe(9);
    expect(midReps([6, 8])).toBe(7);
  });
});

describe('round', () => {
  it('rounds to the chosen increment', () => {
    expect(round(101.2, 2.5)).toBe(100);
    expect(round(101.3, 2.5)).toBe(102.5);
    expect(round(102, 5)).toBe(100);
    expect(round(101.6, 1)).toBe(102);
  });
});

describe('targetLoad', () => {
  it('Push A bench 4×5 @ RPE 8 from a 100×5@8 reference ≈ 100kg', () => {
    const e1rm = estimate1Rm(100, 5, 8)!;
    // mid reps 5, rpe 8 → pctFor(7) = 0.811 → 123.3 * 0.811 ≈ 100, round 2.5 → 100
    expect(targetLoad(e1rm, midReps(5), 8, 2.5)).toBe(100);
  });

  it('respects the rounding increment', () => {
    const e1rm = estimate1Rm(100, 5, 8)!;
    expect(targetLoad(e1rm, 9, 8, 5) % 5).toBe(0);
    expect(targetLoad(e1rm, 9, 8, 1) % 1).toBe(0);
  });
});

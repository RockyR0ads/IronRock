import { describe, expect, it } from 'vitest';
import { RPE_SCALE, rpeStep } from './rpeScale';
import { repsToFailure } from './calc';

describe('RPE_SCALE', () => {
  it('covers 1 to 10 in half-point steps, hardest first', () => {
    expect(RPE_SCALE).toHaveLength(19);
    expect(RPE_SCALE[0].value).toBe(10);
    expect(RPE_SCALE[RPE_SCALE.length - 1].value).toBe(1);
    const values = RPE_SCALE.map((s) => s.value);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    for (let i = 1; i < values.length; i++) expect(values[i - 1] - values[i]).toBeCloseTo(0.5);
  });

  it('gives every step a description', () => {
    for (const step of RPE_SCALE) expect(step.feel.length).toBeGreaterThan(0);
  });

  it('describes reps left consistently with the reps-to-failure model', () => {
    // an RPE 9 set of 5 is 6 reps from failure — i.e. "1 rep left"
    expect(repsToFailure(5, 9)).toBe(6);
    expect(rpeStep(9)?.feel).toMatch(/1 rep left/);
    expect(rpeStep(8)?.feel).toMatch(/2 reps left/);
  });
});

describe('rpeStep', () => {
  it('finds a rating on the scale', () => {
    expect(rpeStep(7.5)?.feel).toBeTruthy();
  });

  it('returns null for a rating off the scale', () => {
    expect(rpeStep(8.25)).toBeNull();
    expect(rpeStep(11)).toBeNull();
  });
});

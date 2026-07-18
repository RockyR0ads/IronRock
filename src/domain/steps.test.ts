import { describe, expect, it } from 'vitest';
import { STEPS, stepValue, formatStepValue } from './steps';

describe('STEPS', () => {
  it('offers symmetric weight steps ascending', () => {
    expect(STEPS.weight.map((s) => s.delta)).toEqual([-10, -5, -2.5, 2.5, 5, 10]);
  });

  it('mirrors every field so each up-step has a matching down-step', () => {
    for (const steps of Object.values(STEPS)) {
      const deltas = steps.map((s) => s.delta);
      const positives = deltas.filter((d) => d > 0).sort((a, b) => a - b);
      const negatives = deltas.filter((d) => d < 0).map(Math.abs).sort((a, b) => a - b);
      expect(negatives).toEqual(positives);
    }
  });

  it('labels negatives with a real minus sign', () => {
    expect(STEPS.reps[0].label).toBe('−2');
    expect(STEPS.weight[4].label).toBe('+5');
  });
});

describe('stepValue', () => {
  it('adds to a weight and keeps it on the 0.5 grid', () => {
    expect(stepValue('weight', 50, 2.5)).toBe(52.5);
    expect(stepValue('weight', 52.5, 2.5)).toBe(55);
    expect(stepValue('weight', 100, 10)).toBe(110);
  });

  it('never lets weight or reps go below zero', () => {
    expect(stepValue('weight', 2.5, -2.5)).toBe(0);
    expect(stepValue('weight', 0, -2.5)).toBe(0);
    expect(stepValue('reps', 1, -1)).toBe(0);
  });

  it('keeps reps whole', () => {
    expect(stepValue('reps', 5, 2)).toBe(7);
    expect(stepValue('reps', 8, -1)).toBe(7);
  });

  it('clamps rpe to 1–10 and snaps to halves', () => {
    expect(stepValue('rpe', 8, 0.5)).toBe(8.5);
    expect(stepValue('rpe', 10, 1)).toBe(10);
    expect(stepValue('rpe', 1, -0.5)).toBe(1);
  });

  it('treats a blank base as zero', () => {
    expect(stepValue('weight', NaN, 5)).toBe(5);
  });
});

describe('formatStepValue', () => {
  it('drops trailing zeros', () => {
    expect(formatStepValue(55)).toBe('55');
    expect(formatStepValue(52.5)).toBe('52.5');
    expect(formatStepValue(8.5)).toBe('8.5');
  });
});

import { describe, it, expect } from 'vitest';
import { pctFor, PCT } from './rpe';

describe('pctFor', () => {
  it('clamps rtf <= 0 to 1.0', () => {
    expect(pctFor(0)).toBe(1.0);
    expect(pctFor(-3)).toBe(1.0);
  });

  it('clamps rtf >= 15 to 0.634', () => {
    expect(pctFor(15)).toBe(0.634);
    expect(pctFor(20)).toBe(0.634);
  });

  it('returns exact table entries for integer rtf', () => {
    expect(pctFor(2)).toBe(PCT[2]);
    expect(pctFor(7)).toBe(0.811);
    expect(pctFor(12)).toBe(0.694);
  });

  it('linear-interpolates between the two nearest integer entries', () => {
    // halfway between rtf 7 (0.811) and rtf 8 (0.786) = 0.7985
    expect(pctFor(7.5)).toBeCloseTo(0.7985, 6);
    // quarter of the way between rtf 10 (0.739) and rtf 11 (0.717)
    expect(pctFor(10.25)).toBeCloseTo(0.739 + (0.717 - 0.739) * 0.25, 6);
  });
});

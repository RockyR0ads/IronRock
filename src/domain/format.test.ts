import { describe, expect, it } from 'vitest';
import { rpeHue } from './format';

describe('rpeHue', () => {
  it('puts the easy end on green and the maximal end on red', () => {
    expect(rpeHue(1)).toBe(140);
    expect(rpeHue(10)).toBe(0);
  });

  it('runs warmer as the RPE climbs', () => {
    const hues = [1, 5, 7, 8, 9, 10].map(rpeHue);
    for (let i = 1; i < hues.length; i++) expect(hues[i]).toBeLessThan(hues[i - 1]);
  });

  it('lands the working range in yellow/orange territory', () => {
    expect(rpeHue(8)).toBeLessThan(60); // orange
    expect(rpeHue(8)).toBeGreaterThan(0);
  });

  it('clamps values outside 1–10', () => {
    expect(rpeHue(0)).toBe(140);
    expect(rpeHue(-4)).toBe(140);
    expect(rpeHue(12)).toBe(0);
  });
});

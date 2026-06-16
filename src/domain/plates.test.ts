import { describe, it, expect } from 'vitest';
import { platesPerSide, BAR_KG } from './plates';

describe('platesPerSide', () => {
  it('returns no plates for an empty or sub-bar weight', () => {
    expect(platesPerSide(BAR_KG)).toEqual([]);
    expect(platesPerSide(10)).toEqual([]);
    expect(platesPerSide(0)).toEqual([]);
  });

  it('decomposes per side, heaviest first', () => {
    // 100kg → 40 per side → 25 + 15
    expect(platesPerSide(100)).toEqual([25, 15]);
    // 60kg → 20 per side → single 20
    expect(platesPerSide(60)).toEqual([20]);
    // 140kg → 60 per side → 25 + 25 + 10
    expect(platesPerSide(140)).toEqual([25, 25, 10]);
  });

  it('handles fractional plates', () => {
    // 22.5kg → 1.25 per side
    expect(platesPerSide(22.5)).toEqual([1.25]);
    // 25kg → 2.5 per side
    expect(platesPerSide(25)).toEqual([2.5]);
  });

  it('respects a custom bar weight', () => {
    // 50kg on a 15kg bar → 17.5 per side → 15 + 2.5
    expect(platesPerSide(50, 15)).toEqual([15, 2.5]);
  });
});

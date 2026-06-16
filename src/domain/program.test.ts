import { describe, it, expect } from 'vitest';
import { DAYS } from './program';
import { LIFTS } from './lifts';

describe('program data', () => {
  it('has the six expected days', () => {
    expect(DAYS.map((d) => d.key)).toEqual([
      'pushA',
      'pullA',
      'legsA',
      'pushB',
      'pullB',
      'legsB',
    ]);
  });

  it('references only lifts that exist in the catalogue', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        expect(LIFTS[block.lift], `${day.key}: ${block.lift}`).toBeDefined();
      }
    }
  });

  it('every block category is one the lift can fill', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        expect(LIFTS[block.lift].cats).toContain(block.cat);
      }
    }
  });

  it('string-rpe blocks are always manual lifts', () => {
    for (const day of DAYS) {
      for (const block of day.blocks) {
        if (typeof block.rpe === 'string') {
          expect(LIFTS[block.lift].type).toBe('manual');
        }
      }
    }
  });
});

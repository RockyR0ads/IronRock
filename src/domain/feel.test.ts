import { describe, expect, it } from 'vitest';
import { FEEL_OPTIONS, feelOption } from './feel';

describe('warm-up feel scale', () => {
  it('covers E, S and H in readiness order', () => {
    expect(FEEL_OPTIONS.map((o) => o.value)).toEqual(['E', 'S', 'H']);
  });

  it('describes every option in relative terms', () => {
    for (const o of FEEL_OPTIONS) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.blurb.length).toBeGreaterThan(0);
    }
  });

  it('looks up an option by code', () => {
    expect(feelOption('H').label).toBe('Harder');
  });
});

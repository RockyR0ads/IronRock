import { describe, it, expect } from 'vitest';
import { initialState } from './store';
import { currentBodyweight } from './selectors';

const base = initialState();

describe('currentBodyweight', () => {
  it('is 0 when nothing is set', () => {
    expect(currentBodyweight(base)).toBe(0);
  });

  it('uses the Settings bodyweight when no weigh-ins exist', () => {
    expect(currentBodyweight({ ...base, bw: '90', bwAt: '2026-07-20T09:00:00Z' })).toBe(90);
  });

  it('uses the latest weigh-in when the Settings weight is blank', () => {
    const s = { ...base, weighIns: [{ at: '2026-07-25', kg: 88 }] };
    expect(currentBodyweight(s)).toBe(88);
  });

  it('prefers the Settings weight when it was set after the latest weigh-in', () => {
    const s = {
      ...base,
      bw: '87',
      bwAt: '2026-07-26T08:00:00Z',
      weighIns: [{ at: '2026-07-25', kg: 88 }],
    };
    expect(currentBodyweight(s)).toBe(87);
  });

  it('prefers the weigh-in when it is newer than the Settings weight', () => {
    const s = {
      ...base,
      bw: '90',
      bwAt: '2026-07-20T08:00:00Z',
      weighIns: [{ at: '2026-07-25', kg: 88 }],
    };
    expect(currentBodyweight(s)).toBe(88);
  });
});

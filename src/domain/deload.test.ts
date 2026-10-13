import { describe, expect, it } from 'vitest';
import { deloadStatus, isDeloadActive } from './deload';
import { initialState, type State } from '../state/store';
import type { LoggedSet, Session } from './types';

const set = (w: string): LoggedSet => ({ w, reps: '5', rpe: '8', done: true });
// a session training `bench` and `squat` (both r-hi in the PPL program) at a weight
const sess = (at: string, bench: string, squat: string): Session => ({
  id: at,
  at,
  dayKey: 'pushA',
  title: 'T',
  exercises: [
    { liftId: 'bench', name: 'Bench', sets: [set(bench)] },
    { liftId: 'squat', name: 'Squat', sets: [set(squat)] },
  ],
});

describe('deloadStatus', () => {
  it('is not due with no regression', () => {
    const s: State = {
      ...initialState(),
      sessions: [sess('2026-03-01T10:00:00Z', '100', '140'), sess('2026-03-08T10:00:00Z', '102.5', '142.5')],
    };
    expect(deloadStatus(s).due).toBe(false);
  });

  it('is due when 2+ heavy lifts fall two sessions running', () => {
    const s: State = {
      ...initialState(),
      // three sessions, both lifts dropping each step
      sessions: [
        sess('2026-03-15T10:00:00Z', '90', '130'),
        sess('2026-03-08T10:00:00Z', '95', '135'),
        sess('2026-03-01T10:00:00Z', '100', '140'),
      ],
    };
    const status = deloadStatus(s);
    expect(status.due).toBe(true);
    expect(status.regressing).toEqual(expect.arrayContaining(['bench', 'squat']));
  });

  it('is due when the block has run its length', () => {
    const old = new Date(Date.now() - 9 * 7 * 86_400_000).toISOString();
    const s: State = { ...initialState(), programStart: old };
    expect(deloadStatus(s).due).toBe(true);
  });
});

describe('isDeloadActive', () => {
  it('is active within 7 days of the start and not after', () => {
    expect(isDeloadActive({ ...initialState(), deload: new Date().toISOString() })).toBe(true);
    const old = new Date(Date.now() - 8 * 86_400_000).toISOString();
    expect(isDeloadActive({ ...initialState(), deload: old })).toBe(false);
    expect(isDeloadActive(initialState())).toBe(false);
  });
});

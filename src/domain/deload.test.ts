import { describe, expect, it } from 'vitest';
import { deloadStatus, isDeloadActive } from './deload';
import { initialState, reducer, type State } from '../state/store';
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

describe('deload prompt spam guards', () => {
  const WEEK = 7 * 86_400_000;
  const old = new Date(Date.now() - 20 * WEEK).toISOString(); // block long past

  it('stays quiet while snoozed', () => {
    const until = new Date(Date.now() + WEEK).toISOString();
    expect(deloadStatus({ ...initialState(), programStart: old, deloadSnoozeUntil: until }).due).toBe(false);
  });

  it('comes back once the snooze expires', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(deloadStatus({ ...initialState(), programStart: old, deloadSnoozeUntil: past }).due).toBe(true);
  });

  it('gives a grace period after a deload', () => {
    const recent = new Date(Date.now() - WEEK).toISOString();
    expect(deloadStatus({ ...initialState(), programStart: old, lastDeload: recent }).due).toBe(false);
  });

  it('measures the block from the last deload, not forever from the start', () => {
    // last deload 4 weeks ago, 6-week block → not yet due despite an ancient start
    const fourWeeks = new Date(Date.now() - 4 * WEEK).toISOString();
    expect(deloadStatus({ ...initialState(), programStart: old, lastDeload: fourWeeks }).due).toBe(false);
  });

  it('starting a deload records it and clears the snooze', () => {
    let s = reducer(initialState(), { type: 'snoozeDeload', until: new Date(Date.now() + WEEK).toISOString() });
    s = reducer(s, { type: 'startDeload', at: new Date().toISOString() });
    expect(s.lastDeload).toBeTruthy();
    expect(s.deloadSnoozeUntil).toBeUndefined();
  });
});

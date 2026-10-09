import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './store';
import type { Session } from '../domain/types';

const sess = (id: string, durationSec?: number): Session => ({
  id,
  at: '2024-01-01T10:00:00Z',
  dayKey: '__freestyle__',
  title: 'Imported',
  durationSec,
  exercises: [{ liftId: 'bench', name: 'Bench', sets: [{ w: '100', reps: '5', rpe: '8', done: true }] }],
});

describe('importSessions', () => {
  it('adds new sessions and skips duplicate ids', () => {
    const s0 = { ...initialState(), sessions: [sess('a')] };
    const s1 = reducer(s0, { type: 'importSessions', sessions: [sess('a'), sess('b')], customLifts: {} });
    expect(s1.sessions.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('backfills a missing duration onto an existing session', () => {
    const s0 = { ...initialState(), sessions: [sess('a')] }; // no duration
    const s1 = reducer(s0, { type: 'importSessions', sessions: [sess('a', 3600)], customLifts: {} });
    expect(s1.sessions).toHaveLength(1);
    expect(s1.sessions[0].durationSec).toBe(3600);
  });

  it('never overwrites an existing duration', () => {
    const s0 = { ...initialState(), sessions: [sess('a', 1800)] };
    const s1 = reducer(s0, { type: 'importSessions', sessions: [sess('a', 3600)], customLifts: {} });
    expect(s1.sessions[0].durationSec).toBe(1800);
  });
});

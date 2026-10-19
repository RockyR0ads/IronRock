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

  it('re-maps an already-imported workout onto the freshly resolved lift', () => {
    // an older importer filed this workout's lateral raises under a custom id
    const old: Session = {
      ...sess('strong-1'),
      exercises: [{ liftId: 'strong-cable-lateral-raise', name: 'Lateral Raise (Cable)', sets: [{ w: '10', reps: '15', rpe: '', done: true }] }],
    };
    const fresh: Session = {
      ...sess('strong-1'),
      exercises: [{ liftId: 'cablelatraise', name: 'Cable lateral raise', sets: [{ w: '10', reps: '15', rpe: '', done: true }] }],
    };
    const s0 = { ...initialState(), sessions: [old] };
    const s1 = reducer(s0, { type: 'importSessions', sessions: [fresh], customLifts: {} });
    expect(s1.sessions).toHaveLength(1);
    expect(s1.sessions[0].exercises[0].liftId).toBe('cablelatraise');
  });

  it('leaves non-imported workouts untouched on a re-import', () => {
    const native = { ...sess('a'), exercises: [{ liftId: 'bench', name: 'Bench', sets: [] }] };
    const incoming = { ...sess('a'), exercises: [{ liftId: 'squat', name: 'Squat', sets: [] }] };
    const s1 = reducer({ ...initialState(), sessions: [native] }, { type: 'importSessions', sessions: [incoming], customLifts: {} });
    expect(s1.sessions[0].exercises[0].liftId).toBe('bench');
  });

  it('never overwrites an existing duration', () => {
    const s0 = { ...initialState(), sessions: [sess('a', 1800)] };
    const s1 = reducer(s0, { type: 'importSessions', sessions: [sess('a', 3600)], customLifts: {} });
    expect(s1.sessions[0].durationSec).toBe(1800);
  });
});

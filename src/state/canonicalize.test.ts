import { describe, expect, it } from 'vitest';
import { canonicalizeLifts, initialState, liftById } from './store';
import { resolveExercise } from '../domain/strongImport';
import { LIB_DUPES, LIFTS } from '../domain/lifts';
import type { Session } from '../domain/types';

const sess = (liftId: string): Session => ({
  id: 'n1', at: '2026-08-10T10:00:00Z', dayKey: '__freestyle__', title: 'F',
  exercises: [{ liftId, name: 'Standing Cable Lateral Raise', sets: [{ w: '10', reps: '15', rpe: '', done: true }] }],
});

describe('library duplicates fold onto built-in lifts', () => {
  it('every duplicate points at a real built-in lift', () => {
    for (const [lib, built] of Object.entries(LIB_DUPES)) expect(LIFTS[built], `${lib} → ${built}`).toBeTruthy();
  });

  it('re-files sessions logged under a duplicate', () => {
    const s = canonicalizeLifts({ ...initialState(), sessions: [sess('supp-standing-cable-lateral-raise')] });
    expect(s.sessions[0].exercises[0]).toMatchObject({ liftId: 'cablelatraise', name: 'Cable lateral raise' });
    expect(s.sessions[0].exercises[0].sets).toHaveLength(1);
  });

  it('re-keys history/settings without clobbering the built-in entry', () => {
    const s = canonicalizeLifts({
      ...initialState(),
      history: {
        Side_Lateral_Raise: { w: '8', reps: '15', rpe: '' },
        Face_Pull: { w: '20', reps: '12', rpe: '' },
        facepull: { w: '25', reps: '12', rpe: '' },
      },
    });
    expect(s.history.latraise?.w).toBe('8');
    expect(s.history.facepull?.w).toBe('25'); // built-in kept
    expect(s.history.Side_Lateral_Raise).toBeUndefined();
  });

  it('canonicalises routine/plan blocks and is idempotent', () => {
    const base = {
      ...initialState(),
      routineDays: [{ key: 'r1', label: 'D', variant: '', note: '', blocks: [{ lift: 'Hammer_Curls', sets: 3, reps: 10, rpe: 9, cls: 'r-iso' as const, cat: 'biceps' as const }] }],
    };
    const once = canonicalizeLifts(base);
    expect(once.routineDays[0].blocks[0].lift).toBe('hammer');
    expect(canonicalizeLifts(once)).toEqual(once);
  });

  it('liftById resolves a duplicate to its built-in twin', () => {
    expect(liftById(initialState(), 'Side_Lateral_Raise').id).toBe('latraise');
  });

  it('Strong machine lateral raises get their own lift', () => {
    expect(resolveExercise('Lateral Raise (Machine)').liftId).toBe('machinelatraise');
    expect(resolveExercise('Lateral Raise (Dumbbell)').liftId).toBe('latraise');
  });
});

import { describe, expect, it } from 'vitest';
import { repsInRange, setOnPlan, exerciseOnPlan } from './onPlan';
import { reducer, initialState, type State } from '../state/store';
import { deloadStatus } from './deload';
import type { Block, LoggedSet, Session } from './types';

const set = (reps: string, extra: Partial<LoggedSet> = {}): LoggedSet => ({ w: '100', reps, rpe: '8', done: true, ...extra });
const PLAN: Block[] = [
  { lift: 'bench', alts: ['dbbench'], sets: 4, reps: 5, rpe: 8, cls: 'r-hi', cat: 'hpress' },
  { lift: 'cablelatraise', sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt' },
];

describe('on-plan rules', () => {
  it('allows a little slack around the rep target', () => {
    expect(repsInRange(7, 5)).toBe(true);
    expect(repsInRange(8, 5)).toBe(false);
    expect(repsInRange(10, [12, 15])).toBe(true);
    expect(repsInRange(20, [12, 15])).toBe(false);
  });

  it('counts an option the plan offers, rejects a lift it does not have', () => {
    expect(setOnPlan(PLAN, 'dbbench', set('5'))).toBe(true);
    expect(setOnPlan(PLAN, 'row', set('5'))).toBe(false);
    expect(setOnPlan(PLAN, 'bench', set('15'))).toBe(false);
  });

  it('a day with no prescription (freestyle) is never off-plan', () => {
    expect(setOnPlan(null, 'row', set('20'))).toBe(true);
    expect(exerciseOnPlan(null, 'row', [set('20')])).toBe(true);
  });

  it('judges an exercise by the majority of its working sets, ignoring warm-ups', () => {
    expect(exerciseOnPlan(PLAN, 'bench', [set('5'), set('5'), set('12')])).toBe(true);
    expect(exerciseOnPlan(PLAN, 'bench', [set('12'), set('12'), set('5')])).toBe(false);
    expect(exerciseOnPlan(PLAN, 'bench', [set('15', { warmup: true }), set('5')])).toBe(true);
  });
});

describe('an off-plan program day', () => {
  // pushA leads with bench (5 reps, options DB bench / incline bench)
  function train(state: State, index: number, reps: string) {
    let s = reducer(state, { type: 'addSet', dayKey: 'pushA', index, set: { w: '60', reps, rpe: '8', done: false } });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index, setIndex: 0, at: '2026-10-01T10:00:00Z' });
    return s;
  }

  it('does not let an off-plan set become the "last time" for progression', () => {
    let s = train(initialState(), 0, '5');
    expect(s.history.bench?.reps).toBe('5');
    s = reducer(s, { type: 'clearDaySets', dayKey: 'pushA' });
    s = train(s, 0, '15'); // way outside 5 reps
    expect(s.history.bench?.reps).toBe('5'); // unchanged
  });

  it('tags a swapped-in lift off-plan when the workout is archived, but keeps it', () => {
    let s = reducer(initialState(), { type: 'swapBlock', dayKey: 'pushA', index: 0, liftId: 'row' });
    s = train(s, 0, '10');
    expect(s.history.row).toBeUndefined();
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: '2026-10-01T11:00:00Z', id: 'w1' });
    const w = s.sessions[0];
    expect(w.offPlan).toBe(true);
    expect(w.exercises[0]).toMatchObject({ liftId: 'row', offPlan: true });
    expect(w.exercises[0].sets).toHaveLength(1);
  });

  it('a normal program day is not tagged', () => {
    let s = train(initialState(), 0, '5');
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: '2026-10-01T11:00:00Z', id: 'w2' });
    expect(s.sessions[0].offPlan).toBeUndefined();
  });
});

describe('deload ignores off-plan work', () => {
  const sess = (at: string, w: string, offPlan = false): Session => ({
    id: at, at, dayKey: 'pushA', title: 'T', ...(offPlan ? { offPlan: true } : {}),
    exercises: [
      { liftId: 'bench', name: 'Bench', sets: [{ w, reps: '5', rpe: '8', done: true }], ...(offPlan ? { offPlan: true } : {}) },
      { liftId: 'squat', name: 'Squat', sets: [{ w: String(Number(w) + 40), reps: '5', rpe: '8', done: true }], ...(offPlan ? { offPlan: true } : {}) },
    ],
  });

  it('two light off-plan days are not read as a regression', () => {
    const s: State = {
      ...initialState(),
      sessions: [sess('2026-03-15T10:00:00Z', '60', true), sess('2026-03-08T10:00:00Z', '70', true), sess('2026-03-01T10:00:00Z', '100')],
    };
    expect(deloadStatus(s).regressing).toEqual([]);
  });
});

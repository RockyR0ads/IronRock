import { describe, expect, it } from 'vitest';
import { reducer, initialState, effBlocks } from './store';
import { daysForProgram, setCustomDays, defaultDay } from '../domain/program';

describe('custom routine builder', () => {
  it('adds days and exercises, and the day engine resolves them', () => {
    let s = reducer(initialState(), { type: 'addCustomDay' });
    const key = s.routineDays[0].key;
    expect(s.routineDays).toHaveLength(1);
    s = reducer(s, { type: 'customAddBlock', key, liftId: 'bench' });
    s = reducer(s, { type: 'customAddBlock', key, liftId: 'row' });
    expect(s.routineDays[0].blocks.map((b) => b.lift)).toEqual(['bench', 'row']);

    // mirror into the engine (the provider effect does this live)
    setCustomDays(s.routineDays);
    expect(daysForProgram('custom')).toHaveLength(1);
    expect(defaultDay(key)?.blocks).toHaveLength(2);
    expect(effBlocks(s, key).map((b) => b.lift)).toEqual(['bench', 'row']);
  });

  it('edits a slot scheme, reorders and removes', () => {
    let s = reducer(initialState(), { type: 'addCustomDay' });
    const key = s.routineDays[0].key;
    s = reducer(s, { type: 'customAddBlock', key, liftId: 'bench' });
    s = reducer(s, { type: 'customAddBlock', key, liftId: 'squat' });

    s = reducer(s, { type: 'customSetScheme', key, index: 0, sets: 5, reps: [3, 5], rpe: 8 });
    expect(s.routineDays[0].blocks[0]).toMatchObject({ sets: 5, reps: [3, 5], rpe: 8 });

    s = reducer(s, { type: 'customMoveBlock', key, from: 1, to: 0 });
    expect(s.routineDays[0].blocks.map((b) => b.lift)).toEqual(['squat', 'bench']);

    s = reducer(s, { type: 'customRemoveBlock', key, index: 0 });
    expect(s.routineDays[0].blocks.map((b) => b.lift)).toEqual(['bench']);
  });

  it('keeps the routine across a completed workout (not a one-off deviation)', () => {
    let s = reducer(initialState(), { type: 'addCustomDay' });
    const key = s.routineDays[0].key;
    s = reducer(s, { type: 'customAddBlock', key, liftId: 'bench' });
    setCustomDays(s.routineDays);
    s = reducer(s, { type: 'setActiveProgram', id: 'custom' });
    expect(s.day).toBe(key);
    // log + complete a workout on the custom day
    s = reducer(s, { type: 'addSet', dayKey: key, index: 0, set: { w: '100', reps: '5', rpe: '8', done: true } });
    s = reducer(s, { type: 'completeWorkout', dayKey: key, title: 'Custom', at: '2026-01-01T10:00:00Z', id: 'x' });
    expect(s.routineDays[0].blocks.map((b) => b.lift)).toEqual(['bench']); // still there
  });

  it('removes a day', () => {
    let s = reducer(initialState(), { type: 'addCustomDay' });
    const key = s.routineDays[0].key;
    s = reducer(s, { type: 'removeCustomDay', key });
    expect(s.routineDays).toHaveLength(0);
  });
});

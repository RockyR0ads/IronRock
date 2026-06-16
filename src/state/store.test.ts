import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialState,
  effBlocks,
  computedInUse,
  newBlock,
  type State,
} from './store';
import { defaultDay } from '../domain/program';

function withRef(s: State): State {
  let next = reducer(s, { type: 'setRef', id: 'bench', field: 'w', value: '100' });
  next = reducer(next, { type: 'setRef', id: 'bench', field: 'reps', value: '5' });
  next = reducer(next, { type: 'setRef', id: 'bench', field: 'rpe', value: '8' });
  return next;
}

describe('reducer', () => {
  it('does not mutate the default program when swapping', () => {
    const s = reducer(initialState(), {
      type: 'swapBlock',
      dayKey: 'pushA',
      index: 0,
      liftId: 'inclinebench',
    });
    expect(effBlocks(s, 'pushA')[0].lift).toBe('inclinebench');
    // template untouched
    expect(defaultDay('pushA')!.blocks[0].lift).toBe('bench');
  });

  it('updates perLeg from the new lift on swap', () => {
    const s = reducer(initialState(), {
      type: 'swapBlock',
      dayKey: 'legsA',
      index: 0,
      liftId: 'bss',
    });
    expect(effBlocks(s, 'legsA')[0].perLeg).toBe(true);
  });

  it('adds and removes blocks against an override', () => {
    let s = reducer(initialState(), { type: 'addBlock', dayKey: 'legsA', liftId: 'dbcurl' });
    const len = effBlocks(s, 'legsA').length;
    expect(len).toBe(defaultDay('legsA')!.blocks.length + 1);
    s = reducer(s, { type: 'removeBlock', dayKey: 'legsA', index: len - 1 });
    expect(effBlocks(s, 'legsA').length).toBe(len - 1);
  });

  it('restoreDay drops the override', () => {
    let s = reducer(initialState(), { type: 'removeBlock', dayKey: 'pushA', index: 0 });
    expect(s.customDays.pushA).toBeDefined();
    s = reducer(s, { type: 'restoreDay', dayKey: 'pushA' });
    expect(s.customDays.pushA).toBeUndefined();
  });

  it('clearAll keeps inc and day but wipes entries', () => {
    let s = withRef(initialState());
    s = reducer(s, { type: 'setInc', value: 5 });
    s = reducer(s, { type: 'setDay', key: 'legsB' });
    s = reducer(s, { type: 'clearAll' });
    expect(s.refs).toEqual({});
    expect(s.inc).toBe(5);
    expect(s.day).toBe('legsB');
  });

  it('newBlock gives manual lifts the iso default scheme', () => {
    expect(newBlock('dbcurl')).toMatchObject({ sets: 3, reps: 12, rpe: 9, cls: 'r-iso' });
    expect(newBlock('bench')).toMatchObject({ sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi' });
  });
});

describe('computedInUse', () => {
  it('lists computed lifts in first-use order', () => {
    const ids = computedInUse(initialState());
    expect(ids[0]).toBe('bench'); // first block of pushA
    expect(ids).toContain('squat');
    expect(ids).not.toContain('latraise'); // manual, excluded
  });

  it('reflects swaps — a swapped-in computed lift appears', () => {
    const s = reducer(initialState(), {
      type: 'swapBlock',
      dayKey: 'legsA',
      index: 0,
      liftId: 'frontsquat',
    });
    expect(computedInUse(s)).toContain('frontsquat');
  });
});

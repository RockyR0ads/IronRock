import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialState,
  effBlocks,
  computedInUse,
  newBlock,
  setsFor,
  type State,
} from './store';
import { defaultDay } from '../domain/program';
import { isBlockComplete } from './selectors';
import type { LoggedSet } from '../domain/types';

const SET = (w: string, reps: string, rpe: string): LoggedSet => ({ w, reps, rpe });

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
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    s = reducer(s, { type: 'setInc', value: 5 });
    s = reducer(s, { type: 'setDay', key: 'legsB' });
    s = reducer(s, { type: 'clearAll' });
    expect(s.refs).toEqual({});
    expect(s.logs).toEqual({});
    expect(s.history).toEqual({});
    expect(s.inc).toBe(5);
    expect(s.day).toBe('legsB');
  });

  it('newBlock gives manual lifts the iso default scheme', () => {
    expect(newBlock('dbcurl')).toMatchObject({ sets: 3, reps: 12, rpe: 9, cls: 'r-iso' });
    expect(newBlock('bench')).toMatchObject({ sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi' });
  });
});

describe('set logging', () => {
  it('logs, updates, and removes sets for a block', () => {
    let s = reducer(initialState(), {
      type: 'addSet',
      dayKey: 'pushA',
      index: 0,
      set: SET('100', '5', '8'),
    });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(1);
    s = reducer(s, {
      type: 'updateSet',
      dayKey: 'pushA',
      index: 0,
      setIndex: 0,
      field: 'reps',
      value: '6',
    });
    expect(setsFor(s, 'pushA', 0)[0].reps).toBe('6');
    s = reducer(s, { type: 'removeSet', dayKey: 'pushA', index: 0, setIndex: 0 });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0);
  });

  it('marks a block complete once prescribed sets are checked done', () => {
    const block = defaultDay('legsA')!.blocks[0]; // squat 5×3
    let s = initialState();
    for (let i = 0; i < block.sets; i++) {
      s = reducer(s, { type: 'addSet', dayKey: 'legsA', index: 0, set: SET('120', '3', '8') });
      s = reducer(s, { type: 'toggleSetDone', dayKey: 'legsA', index: 0, setIndex: i });
      expect(isBlockComplete(block, setsFor(s, 'legsA', 0))).toBe(i === block.sets - 1);
    }
  });

  it('a logged-but-unchecked set does not count toward completion', () => {
    const block = defaultDay('legsA')!.blocks[1]; // rdl 3×[4,5]
    let s = initialState();
    for (let i = 0; i < 3; i++)
      s = reducer(s, { type: 'addSet', dayKey: 'legsA', index: 1, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'legsA', index: 1, setIndex: 0 });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'legsA', index: 1, setIndex: 1 });
    expect(isBlockComplete(block, setsFor(s, 'legsA', 1))).toBe(false); // only 2 of 3 checked
  });

  it('records last-set history per lift when a set is checked done', () => {
    let s = reducer(initialState(), {
      type: 'addSet',
      dayKey: 'pushA',
      index: 0,
      set: SET('102.5', '5', '8'),
    });
    expect(s.history.bench).toBeUndefined();
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    expect(s.history.bench).toEqual({ w: '102.5', reps: '5', rpe: '8' });
  });

  it('keeps logs aligned when a block is removed', () => {
    let s = initialState();
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 2, set: SET('14', '15', '9') });
    // remove block 0 — the logged set should shift to index 1
    s = reducer(s, { type: 'removeBlock', dayKey: 'pushA', index: 0 });
    expect(setsFor(s, 'pushA', 1)).toHaveLength(1);
    expect(setsFor(s, 'pushA', 2)).toHaveLength(0);
  });

  it('clears the slot log on swap', () => {
    let s = initialState();
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'swapBlock', dayKey: 'pushA', index: 0, liftId: 'inclinebench' });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0);
  });

  it('restoreDay drops that day’s logs', () => {
    let s = initialState();
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'restoreDay', dayKey: 'pushA' });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0);
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

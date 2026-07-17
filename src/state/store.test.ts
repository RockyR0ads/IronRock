import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialState,
  effBlocks,
  computedInUse,
  newBlock,
  setsFor,
  FREESTYLE_KEY,
  type State,
} from './store';
import { defaultDay } from '../domain/program';
import { LIFTS } from '../domain/lifts';
import { isBlockComplete } from './selectors';
import type { LoggedSet } from '../domain/types';

const SET = (w: string, reps: string, rpe: string): LoggedSet => ({ w, reps, rpe });

/** Fixed archive timestamp, so session tests don't depend on the clock. */
const AT = '2026-07-17T18:30:00.000Z';

/** A max-effort reference set: 100 kg for 5 reps. Effort is implicit (RPE 10). */
function withRef(s: State): State {
  const next = reducer(s, { type: 'setRef', id: 'bench', field: 'w', value: '100' });
  return reducer(next, { type: 'setRef', id: 'bench', field: 'reps', value: '5' });
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
    expect(newBlock(LIFTS.dbcurl)).toMatchObject({ sets: 3, reps: 12, rpe: 9, cls: 'r-iso' });
    expect(newBlock(LIFTS.bench)).toMatchObject({ sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi' });
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

  it('resetWeek clears all logged sets but keeps history, refs and edits', () => {
    let s = withRef(initialState());
    s = reducer(s, { type: 'swapBlock', dayKey: 'legsA', index: 0, liftId: 'frontsquat' });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    s = reducer(s, { type: 'addSet', dayKey: 'legsA', index: 0, set: SET('120', '3', '8') });
    s = reducer(s, { type: 'resetWeek' });
    expect(s.logs).toEqual({});
    expect(s.history.bench).toEqual({ w: '100', reps: '5', rpe: '8' }); // preserved
    expect(s.refs.bench).toBeDefined(); // references kept
    expect(s.customDays.legsA).toBeDefined(); // swapped exercise kept
  });

  it('resetWeek keeps the freestyle workout but clears program logs', () => {
    let s = reducer(initialState(), { type: 'addBlock', dayKey: FREESTYLE_KEY, liftId: 'deadlift' });
    s = reducer(s, { type: 'addSet', dayKey: FREESTYLE_KEY, index: 0, set: SET('140', '5', '8') });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'resetWeek' });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0); // program cleared
    expect(setsFor(s, FREESTYLE_KEY, 0)).toHaveLength(1); // freestyle kept
    expect(effBlocks(s, FREESTYLE_KEY)).toHaveLength(1); // freestyle exercises kept
  });

  it('restoreDay drops that day’s logs', () => {
    let s = initialState();
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'restoreDay', dayKey: 'pushA' });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0);
  });
});

describe('completeWorkout', () => {
  const complete = (s: State, dayKey: string) =>
    reducer(s, { type: 'completeWorkout', dayKey, title: 'Push', at: AT, id: 'sess-1' });

  /** Log a set on pushA block 0 and check it off. */
  function withDoneSet(s: State, dayKey = 'pushA'): State {
    let next = reducer(s, { type: 'addSet', dayKey, index: 0, set: SET('100', '5', '8') });
    next = reducer(next, { type: 'toggleSetDone', dayKey, index: 0, setIndex: 0 });
    return next;
  }

  it('archives the checked-off sets and clears the day', () => {
    const s = complete(withDoneSet(initialState()), 'pushA');
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0]).toMatchObject({ id: 'sess-1', at: AT, dayKey: 'pushA', title: 'Push' });
    expect(s.sessions[0].exercises).toHaveLength(1);
    expect(s.sessions[0].exercises[0]).toMatchObject({ liftId: 'bench', name: LIFTS.bench.name });
    expect(setsFor(s, 'pushA', 0)).toHaveLength(0);
  });

  it('archives only sets that were checked off', () => {
    let s = withDoneSet(initialState());
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '4', '9') });
    s = complete(s, 'pushA');
    expect(s.sessions[0].exercises[0].sets).toHaveLength(1);
    expect(s.sessions[0].exercises[0].sets[0]).toMatchObject({ reps: '5' });
  });

  it('does nothing when no set is checked off, keeping half-entered work', () => {
    let s = reducer(initialState(), {
      type: 'addSet',
      dayKey: 'pushA',
      index: 0,
      set: SET('100', '5', '8'),
    });
    s = complete(s, 'pushA');
    expect(s.sessions).toHaveLength(0);
    expect(setsFor(s, 'pushA', 0)).toHaveLength(1); // not destroyed
  });

  it('puts the newest session first', () => {
    let s = complete(withDoneSet(initialState()), 'pushA');
    s = withDoneSet(s);
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: AT, id: 'sess-2' });
    expect(s.sessions.map((x) => x.id)).toEqual(['sess-2', 'sess-1']);
  });

  it('keeps a program day’s blocks but blanks the freestyle slate', () => {
    let s = reducer(initialState(), { type: 'addBlock', dayKey: FREESTYLE_KEY, liftId: 'bench' });
    s = withDoneSet(s, FREESTYLE_KEY);
    const blocksBefore = effBlocks(s, 'pushA').length;

    s = reducer(s, {
      type: 'completeWorkout',
      dayKey: FREESTYLE_KEY,
      title: 'Freestyle',
      at: AT,
      id: 'sess-f',
    });
    expect(effBlocks(s, FREESTYLE_KEY)).toHaveLength(0);
    expect(effBlocks(s, 'pushA')).toHaveLength(blocksBefore);
  });

  it('survives resetWeek — history is not a log', () => {
    let s = complete(withDoneSet(initialState()), 'pushA');
    s = reducer(s, { type: 'resetWeek' });
    expect(s.sessions).toHaveLength(1);
  });

  it('removeSession drops just that session', () => {
    let s = complete(withDoneSet(initialState()), 'pushA');
    s = reducer(s, { type: 'removeSession', id: 'nope' });
    expect(s.sessions).toHaveLength(1);
    s = reducer(s, { type: 'removeSession', id: 'sess-1' });
    expect(s.sessions).toHaveLength(0);
  });

  it('clearAll wipes history too', () => {
    let s = complete(withDoneSet(initialState()), 'pushA');
    s = reducer(s, { type: 'clearAll' });
    expect(s.sessions).toEqual([]);
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

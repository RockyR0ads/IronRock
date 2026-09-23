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
import { isBlockComplete, doneSetCount, workingSetCount } from './selectors';
import { workoutStats } from '../domain/stats';
import { sessionEntries } from '../domain/session';
import type { LoggedSet } from '../domain/types';

const SET = (w: string, reps: string, rpe: string): LoggedSet => ({ w, reps, rpe });
const WARM = (w: string, reps: string): LoggedSet => ({ w, reps, rpe: '', warmup: true });

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

  it('an in-day edit is a session deviation, not a plan change', () => {
    let s = reducer(initialState(), { type: 'removeBlock', dayKey: 'pushA', index: 0 });
    expect(s.sessionDays.pushA).toBeDefined();
    expect(s.planDays.pushA).toBeUndefined();
    s = reducer(s, { type: 'restoreDay', dayKey: 'pushA' });
    expect(s.sessionDays.pushA).toBeUndefined();
    expect(s.planDays.pushA).toBeUndefined();
  });

  it('saveDayToProgram promotes the deviation into the plan', () => {
    let s = reducer(initialState(), { type: 'removeBlock', dayKey: 'pushA', index: 0 });
    const len = effBlocks(s, 'pushA').length;
    s = reducer(s, { type: 'saveDayToProgram', dayKey: 'pushA' });
    expect(s.sessionDays.pushA).toBeUndefined();
    expect(s.planDays.pushA).toBeDefined();
    expect(effBlocks(s, 'pushA').length).toBe(len);
  });

  it('completing a workout clears the day deviation (back to plan next time)', () => {
    let s = reducer(initialState(), { type: 'swapBlock', dayKey: 'pushA', index: 0, liftId: 'dbbench' });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: '2026-01-01T00:00:00Z', id: 'x' });
    expect(s.sessionDays.pushA).toBeUndefined(); // deviation did not carry over
    expect(s.sessions.length).toBe(1); // but the workout was archived as performed
  });

  it('picks a slot option without deviating, and stamps the pool', () => {
    // pushA[0] is bench with alts [dbbench, inclinebench]
    let s = reducer(initialState(), { type: 'pickOption', dayKey: 'pushA', index: 0, liftId: 'dbbench' });
    const b = effBlocks(s, 'pushA')[0];
    expect(b.lift).toBe('dbbench'); // active is the picked option
    expect(b.pool).toEqual(['bench', 'dbbench', 'inclinebench']); // anchor first, stable
    expect(s.sessionDays.pushA).toBeUndefined(); // a free choice, not a deviation
    // picking the anchor again clears the pick
    s = reducer(s, { type: 'pickOption', dayKey: 'pushA', index: 0, liftId: 'bench' });
    expect(effBlocks(s, 'pushA')[0].lift).toBe('bench');
    expect(s.sessionPicks.pushA).toBeUndefined();
  });

  it('rejects an option that is not one of the slot options', () => {
    const s = reducer(initialState(), { type: 'pickOption', dayKey: 'pushA', index: 0, liftId: 'squat' });
    expect(s.sessionPicks.pushA).toBeUndefined();
    expect(effBlocks(s, 'pushA')[0].lift).toBe('bench');
  });

  it('switching a slot option clears that slot’s logged sets', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'pickOption', dayKey: 'pushA', index: 0, liftId: 'dbbench' });
    expect(setsFor(s, 'pushA', 0)).toEqual([]);
  });

  it('completing a workout resets the option pick to the slot default', () => {
    let s = reducer(initialState(), { type: 'pickOption', dayKey: 'pushA', index: 0, liftId: 'dbbench' });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('40', '8', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: AT, id: 'x' });
    expect(s.sessionPicks.pushA).toBeUndefined();
    expect(effBlocks(s, 'pushA')[0].lift).toBe('bench');
  });

  it('adds a user option into the plan and can pick it', () => {
    // legsA[0] is squat with alts [pausesquat, boxsquat]; add front squat too
    let s = reducer(initialState(), { type: 'addOption', dayKey: 'legsA', index: 0, liftId: 'frontsquat' });
    expect(s.planDays.legsA).toBeDefined(); // a persistent plan edit
    expect(effBlocks(s, 'legsA')[0].pool).toContain('frontsquat');
    s = reducer(s, { type: 'pickOption', dayKey: 'legsA', index: 0, liftId: 'frontsquat' });
    expect(effBlocks(s, 'legsA')[0].lift).toBe('frontsquat');
  });

  it('removes an option, re-anchoring when needed', () => {
    // drop the anchor (bench) — the slot re-anchors to the first remaining option
    let s = reducer(initialState(), { type: 'removeOption', dayKey: 'pushA', index: 0, liftId: 'dbbench' });
    expect(effBlocks(s, 'pushA')[0].pool).toEqual(['bench', 'inclinebench']);
    s = reducer(s, { type: 'removeOption', dayKey: 'pushA', index: 0, liftId: 'bench' });
    const b = effBlocks(s, 'pushA')[0];
    expect(b.lift).toBe('inclinebench'); // re-anchored
    expect(b.pool).toBeUndefined(); // a single-exercise slot now
  });

  it('stamps a set with a completion time, and clears it on undo', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0, at: AT });
    expect(setsFor(s, 'pushA', 0)[0].at).toBe(AT);
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0, at: AT });
    expect(setsFor(s, 'pushA', 0)[0].at).toBeUndefined();
  });

  it('records an exercise start and clears it when the workout completes', () => {
    let s = reducer(initialState(), { type: 'startExercise', dayKey: 'pushA', index: 0, at: AT });
    expect(s.exerciseStart.pushA[0]).toBe(AT);
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0, at: AT });
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: AT, id: 'x' });
    expect(s.exerciseStart.pushA).toBeUndefined();
  });

  it('drops the day start anchors when a block is removed (indices shift)', () => {
    let s = reducer(initialState(), { type: 'startExercise', dayKey: 'pushA', index: 1, at: AT });
    s = reducer(s, { type: 'removeBlock', dayKey: 'pushA', index: 0 });
    expect(s.exerciseStart.pushA).toBeUndefined();
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

  it('resetWeek clears logs and this-week deviations but keeps history, refs and plan edits', () => {
    let s = withRef(initialState());
    // a saved plan edit persists across the reset
    s = reducer(s, { type: 'swapBlock', dayKey: 'legsA', index: 0, liftId: 'frontsquat' });
    s = reducer(s, { type: 'saveDayToProgram', dayKey: 'legsA' });
    // a today-only deviation on another day should be dropped
    s = reducer(s, { type: 'removeBlock', dayKey: 'pullA', index: 0 });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    s = reducer(s, { type: 'resetWeek' });
    expect(s.logs).toEqual({});
    expect(s.history.bench).toEqual({ w: '100', reps: '5', rpe: '8' }); // preserved
    expect(s.refs.bench).toBeDefined(); // references kept
    expect(s.planDays.legsA).toBeDefined(); // saved plan edit kept
    expect(s.sessionDays.pullA).toBeUndefined(); // this-week deviation cleared
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

  it('archives every performed set, keeping its done flag', () => {
    let s = withDoneSet(initialState()); // 100×5, checked off
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '4', '9') }); // entered, not checked
    s = complete(s, 'pushA');
    const sets = s.sessions[0].exercises[0].sets;
    expect(sets).toHaveLength(2); // both captured — the archive shows everything
    expect(sets[0]).toMatchObject({ reps: '5', done: true });
    expect(sets[1]).toMatchObject({ reps: '4' });
    expect(sets[1].done).toBeFalsy(); // the un-checked set is kept, marked not-done
  });

  it('drops blank prefill rows that were never touched', () => {
    let s = withDoneSet(initialState());
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('', '', '') });
    s = complete(s, 'pushA');
    expect(s.sessions[0].exercises[0].sets).toHaveLength(1); // the empty row is noise
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

describe('warm-up sets', () => {
  const done = (s: LoggedSet): LoggedSet => ({ ...s, done: true });

  it('do not count toward completion or the working-set tally', () => {
    const block = { ...defaultDay('pushA')!.blocks[0], sets: 2 };
    const sets = [done(WARM('40', '5')), done(WARM('60', '3')), done(SET('100', '5', '8'))];
    expect(workingSetCount(sets)).toBe(1);
    expect(doneSetCount(sets)).toBe(1); // the two done warm-ups are ignored
    expect(isBlockComplete(block, sets)).toBe(false); // 1 of 2 working sets
    expect(isBlockComplete(block, [...sets, done(SET('100', '5', '9'))])).toBe(true);
  });

  it('are archived (so history shows everything) but never counted in stats', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'pushA', index: 0, set: WARM('40', '8') });
    s = reducer(s, { type: 'addSet', dayKey: 'pushA', index: 0, set: SET('100', '5', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 1 });
    s = reducer(s, { type: 'completeWorkout', dayKey: 'pushA', title: 'Push', at: AT, id: 'sess-w' });
    const archived = s.sessions[0].exercises[0].sets;
    expect(archived).toHaveLength(2); // warm-up kept for the record
    expect(archived.some((x) => x.warmup)).toBe(true);
    // but it must not inflate the numbers
    const stats = workoutStats(sessionEntries(s.sessions[0]), s.inc);
    expect(stats.sets).toBe(1);
    expect(stats.volume).toBe(500); // 100×5 only, warm-up's 40×8 excluded
  });

  it('do not overwrite the last-time history hint', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'pushA', index: 0, set: WARM('40', '8') });
    s = reducer(s, { type: 'toggleSetDone', dayKey: 'pushA', index: 0, setIndex: 0 });
    expect(s.history.bench).toBeUndefined();
  });
});

describe('per-side reps', () => {
  it('toggleSetPerSide flips a single set on, then off', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'legsB', index: 1, set: SET('20', '5', '8') });
    s = reducer(s, { type: 'addSet', dayKey: 'legsB', index: 1, set: SET('20', '5', '8') });
    s = reducer(s, { type: 'toggleSetPerSide', dayKey: 'legsB', index: 1, setIndex: 0 });
    expect(s.logs.legsB[1][0].perSide).toBe(true);
    expect(s.logs.legsB[1][1].perSide).toBeUndefined(); // only the one set toggled
    s = reducer(s, { type: 'toggleSetPerSide', dayKey: 'legsB', index: 1, setIndex: 0 });
    expect(s.logs.legsB[1][0].perSide).toBeUndefined();
  });

  it('is a no-op when the set does not exist', () => {
    const before = initialState();
    const after = reducer(before, { type: 'toggleSetPerSide', dayKey: 'legsB', index: 1, setIndex: 0 });
    expect(after).toBe(before); // unchanged reference — nothing to toggle
  });

  it('updateSet can write the right-side reps', () => {
    let s = reducer(initialState(), { type: 'addSet', dayKey: 'legsB', index: 1, set: SET('20', '8', '8') });
    s = reducer(s, { type: 'toggleSetPerSide', dayKey: 'legsB', index: 1, setIndex: 0 });
    s = reducer(s, { type: 'updateSet', dayKey: 'legsB', index: 1, setIndex: 0, field: 'repsR', value: '6' });
    expect(s.logs.legsB[1][0]).toMatchObject({ reps: '8', repsR: '6', perSide: true });
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

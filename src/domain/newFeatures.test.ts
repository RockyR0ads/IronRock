import { describe, expect, it } from 'vitest';
import { PROGRAM_DAYS } from './program';
import { STAPLE_DAYS } from './staplePrograms';
import { PROGRAMS } from './programs';
import { LIFTS } from './lifts';
import { LIBRARY_BY_ID } from './library';
import { fmtSecs, parseSecs, fmtDist, liftMeasure } from './measure';
import { parseStrong } from './strongImport';
import { exerciseSeries } from './progress';
import { reducer, initialState, blocksFromSession } from '../state/store';
import type { Session } from './types';

describe('staple programs are playable', () => {
  it('every staple program is ready and has days', () => {
    for (const id of Object.keys(STAPLE_DAYS)) {
      const meta = PROGRAMS.find((p) => p.id === id);
      expect(meta?.ready, id).toBe(true);
      expect(PROGRAM_DAYS[id]?.length, id).toBeGreaterThan(0);
    }
  });

  it('day keys are unique across every program', () => {
    const keys = Object.values(PROGRAM_DAYS).flatMap((ds) => ds.map((d) => d.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every lift in every template resolves to a real exercise', () => {
    for (const [id, days] of Object.entries(STAPLE_DAYS)) {
      for (const d of days) {
        for (const b of d.blocks) {
          for (const lift of [b.lift, ...(b.alts ?? [])]) {
            expect(LIFTS[lift] || LIBRARY_BY_ID[lift], `${id}/${d.key}/${lift}`).toBeTruthy();
          }
        }
      }
    }
  });

  it('activating one lands on its first day', () => {
    const s = reducer(initialState(), { type: 'setActiveProgram', id: 'stronglifts-5x5' });
    expect(s.day).toBe('slA');
  });
});

describe('timed and distance sets', () => {
  it('formats and parses times and distances', () => {
    expect(fmtSecs(75)).toBe('1:15');
    expect(fmtSecs(3725)).toBe('1:02:05');
    expect(parseSecs('90')).toBe(90);
    expect(parseSecs('1:30')).toBe(90);
    expect(parseSecs('1:02:05')).toBe(3725);
    expect(parseSecs('abc')).toBeNull();
    expect(fmtDist(800)).toBe('800 m');
    expect(fmtDist(5200)).toBe('5.2 km');
  });

  it('reads a lift\'s measure from its unit', () => {
    expect(liftMeasure(LIFTS.plank)).toBe('time');
    expect(liftMeasure(LIFTS.run)).toBe('distance');
    expect(liftMeasure(LIFTS.bench)).toBe('weight');
  });

  it('imports real timed/distance rows and skips rest timers', () => {
    const csv = [
      'Workout #;Date;Workout Name;Duration (sec);Exercise Name;Set Order;Weight (kg);Reps;RPE;Distance (meters);Seconds;Notes;Workout Notes',
      '1;2024-01-02 18:00:00;Core;1800;Plank;1;;;;;60;;',
      '1;2024-01-02 18:00:00;Core;1800;Plank;Rest Timer;;;;;120;;',
      '1;2024-01-02 18:00:00;Core;1800;Running (Treadmill);1;;;;5200;2580;;',
      '1;2024-01-02 18:00:00;Core;1800;Bench Press (Barbell);Rest Timer;;;;;180;;',
    ].join('\n');
    const r = parseStrong(csv);
    const ex = r.sessions[0].exercises;
    expect(ex.map((e) => e.liftId)).toEqual(['plank', 'run']);
    expect(ex[0].sets).toEqual([expect.objectContaining({ secs: '60' })]);
    expect(ex[1].sets[0]).toMatchObject({ dist: '5200', secs: '2580' });
  });

  it('charts timed holds and distance work', () => {
    const s: Session = {
      id: 'x', at: '2024-01-02T18:00:00Z', dayKey: '__freestyle__', title: 'C',
      exercises: [{ liftId: 'plank', name: 'Plank', sets: [{ w: '', reps: '', rpe: '', secs: '45', done: true }, { w: '', reps: '', rpe: '', secs: '60', done: true }] }],
    };
    const [p] = exerciseSeries([s], 'plank', 2.5);
    expect(p.bestSecs).toBe(60);
    expect(p.totalSecs).toBe(105);
  });
});

describe('edit a past workout', () => {
  const base: Session = {
    id: 'w', at: '2025-03-01T10:00:00Z', dayKey: '__freestyle__', title: 'Push',
    exercises: [
      { liftId: 'bench', name: 'Bench press', sets: [{ w: '100', reps: '5', rpe: '8', done: true }, { w: '100', reps: '4', rpe: '9', done: true }] },
      { liftId: 'dips', name: 'Dips', sets: [{ w: '0', reps: '10', rpe: '8', done: true }] },
    ],
  };
  const other: Session = { ...base, id: 'o', at: '2025-03-05T10:00:00Z', title: 'Pull' };

  it('saves edits, drops emptied exercises and re-sorts by date', () => {
    const s0 = { ...initialState(), sessions: [other, base] };
    const edited: Session = {
      ...base,
      at: '2025-03-09T10:00:00Z', // moved after `other`
      exercises: [{ ...base.exercises[0], sets: [{ w: '102.5', reps: '5', rpe: '8', done: true }] }, { ...base.exercises[1], sets: [] }],
    };
    const s1 = reducer(s0, { type: 'updateSession', session: edited });
    expect(s1.sessions.map((x) => x.id)).toEqual(['w', 'o']);
    expect(s1.sessions[0].exercises).toHaveLength(1);
    expect(s1.sessions[0].exercises[0].sets[0].w).toBe('102.5');
  });

  it('removes the workout if every exercise was emptied', () => {
    const s0 = { ...initialState(), sessions: [base] };
    const s1 = reducer(s0, { type: 'updateSession', session: { ...base, exercises: base.exercises.map((e) => ({ ...e, sets: [] })) } });
    expect(s1.sessions).toHaveLength(0);
  });
});

describe('save a workout as a routine day', () => {
  it('builds slots from what was logged and adds them to the custom routine', () => {
    const w: Session = {
      id: 'w', at: '2025-03-01T10:00:00Z', dayKey: '__freestyle__', title: 'Arms',
      exercises: [
        { liftId: 'ezcurl', name: 'EZ curl', sets: [
          { w: '20', reps: '10', rpe: '', warmup: true, done: true },
          { w: '30', reps: '12', rpe: '9', done: true },
          { w: '30', reps: '10', rpe: '9.5', done: true },
        ] },
      ],
    };
    const blocks = blocksFromSession(initialState(), w);
    expect(blocks[0]).toMatchObject({ lift: 'ezcurl', sets: 2, reps: [10, 12], rpe: 9.5 });
    const s = reducer(initialState(), { type: 'addCustomDay', label: 'Arms', blocks });
    expect(s.routineDays[0]).toMatchObject({ label: 'Arms' });
    expect(s.routineDays[0].blocks).toHaveLength(1);
  });
});

describe('cable attachments', () => {
  it('knows which lifts are on a cable and their usual handle', async () => {
    const { isCable, attachmentFor } = await import('./attachments');
    expect(isCable(LIFTS.pushdown)).toBe(true);
    expect(isCable(LIFTS.bench)).toBe(false);
    expect(attachmentFor(LIFTS.cableohext, undefined)).toBe('rope');
    expect(attachmentFor(LIFTS.pushdown, 'rope')).toBe('rope');
    expect(attachmentFor(LIFTS.bench, 'rope')).toBeUndefined();
  });

  it('stamps the chosen attachment on the archived workout', () => {
    let s = reducer(initialState(), { type: 'setExerciseConfig', id: 'pushdown', patch: { attachment: 'rope' } });
    s = reducer(s, { type: 'addBlock', dayKey: 'freestyle', liftId: 'pushdown' });
    s = { ...s, logs: { freestyle: [[{ w: '30', reps: '12', rpe: '9', done: true }]] } };
    s = reducer(s, { type: 'completeWorkout', dayKey: 'freestyle', id: 'c', at: '2025-03-01T10:00:00Z', title: 'Arms' });
    expect(s.sessions[0].exercises[0]).toMatchObject({ liftId: 'pushdown', attachment: 'rope' });
  });

  it('reads the handle out of Strong exercise names', async () => {
    const { attachmentFromName } = await import('./strongImport');
    expect(attachmentFromName('Triceps Pushdown (Cable - Straight Bar)')).toBe('straight');
    expect(attachmentFromName('Lat Pulldown - Wide Grip (Cable)')).toBe('lat');
    expect(attachmentFromName('Bench Press (Barbell)')).toBeUndefined();
  });
});

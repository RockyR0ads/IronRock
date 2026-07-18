import { describe, expect, it } from 'vitest';
import { workoutStats, volumeLabel } from './stats';

const set = (w: string, reps: string, rpe: string, done = true) => ({ w, reps, rpe, done });

describe('workoutStats', () => {
  it('counts only sets checked off as done', () => {
    const s = workoutStats(
      [{ name: 'Bench', sets: [set('100', '5', '8'), set('100', '5', '8', false)] }],
      2.5
    );
    expect(s.sets).toBe(1);
    expect(s.reps).toBe(5);
    expect(s.volume).toBe(500);
  });

  it('never counts warm-up sets, even when checked off', () => {
    const s = workoutStats(
      [
        {
          name: 'Bench',
          sets: [
            { w: '40', reps: '8', rpe: '', done: true, warmup: true },
            set('100', '5', '8'),
          ],
        },
      ],
      2.5
    );
    expect(s.sets).toBe(1);
    expect(s.volume).toBe(500); // warm-up 40×8 ignored
  });

  it('drops exercises with nothing completed', () => {
    const s = workoutStats(
      [
        { name: 'Bench', sets: [set('100', '5', '8')] },
        { name: 'Curl', sets: [set('20', '10', '9', false)] },
        { name: 'Row', sets: [] },
      ],
      2.5
    );
    expect(s.exercises.map((e) => e.name)).toEqual(['Bench']);
  });

  it('sums volume across exercises and picks the biggest', () => {
    const s = workoutStats(
      [
        { name: 'Squat', sets: [set('140', '5', '8'), set('140', '5', '9')] },
        { name: 'Curl', sets: [set('20', '10', '9')] },
      ],
      2.5
    );
    expect(s.volume).toBe(1600);
    expect(s.sets).toBe(3);
    expect(s.reps).toBe(20);
    expect(s.topExercise?.name).toBe('Squat');
  });

  it('takes the heaviest done set as the top set, breaking ties on reps', () => {
    const s = workoutStats(
      [{ name: 'Bench', sets: [set('100', '5', '8'), set('100', '8', '9'), set('90', '10', '9')] }],
      2.5
    );
    expect(s.exercises[0].topSet).toMatchObject({ w: '100', reps: '8' });
    expect(s.exercises[0].e1rm).toBeGreaterThan(100);
  });

  it('averages RPE over done sets that recorded one', () => {
    const s = workoutStats(
      [{ name: 'Bench', sets: [set('100', '5', '8'), set('100', '5', '9'), set('100', '5', '')] }],
      2.5
    );
    expect(s.avgRpe).toBe(8.5);
  });

  it('reports empty totals for an empty workout', () => {
    const s = workoutStats([], 2.5);
    expect(s).toMatchObject({ sets: 0, reps: 0, volume: 0, avgRpe: null, topExercise: null });
  });

  it('ignores unparseable inputs rather than producing NaN', () => {
    const s = workoutStats([{ name: 'Bench', sets: [set('', 'x', '8')] }], 2.5);
    expect(s.volume).toBe(0);
    expect(s.reps).toBe(0);
    expect(s.exercises[0].e1rm).toBeNull();
  });
});

describe('volumeLabel', () => {
  it('shows kg below a tonne and tonnes above', () => {
    expect(volumeLabel(940)).toBe('940 kg');
    expect(volumeLabel(7420)).toBe('7.4 t');
  });
});

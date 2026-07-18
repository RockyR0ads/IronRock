import { describe, expect, it } from 'vitest';
import { exerciseSeries, seriesDelta, shortDate, summarize } from './progress';
import type { LoggedSet, Session } from './types';

const set = (s: Partial<LoggedSet>): LoggedSet => ({ w: '', reps: '', rpe: '', ...s });

function session(at: string, sets: LoggedSet[], liftId = 'bench'): Session {
  return {
    id: at,
    at,
    dayKey: 'freestyle',
    title: 'Test',
    exercises: [{ liftId, name: 'Bench press', sets }],
  };
}

describe('exerciseSeries', () => {
  it('returns one point per session that trained the lift, oldest first', () => {
    const sessions: Session[] = [
      session('2026-02-01T10:00:00Z', [set({ w: '100', reps: '5', rpe: '8', done: true })]),
      session('2026-01-01T10:00:00Z', [set({ w: '90', reps: '5', rpe: '8', done: true })]),
    ];
    const series = exerciseSeries(sessions, 'bench', 2.5);
    expect(series.map((p) => p.topWeight)).toEqual([90, 100]);
  });

  it('skips sessions where the lift has no counted working set', () => {
    const sessions: Session[] = [
      session('2026-01-01T10:00:00Z', [set({ w: '90', reps: '5', rpe: '8', done: false })]),
      session('2026-01-02T10:00:00Z', [set({ w: '95', reps: '5', rpe: '8', warmup: true, done: true })]),
      session('2026-01-03T10:00:00Z', [set({ w: '100', reps: '5', rpe: '8', done: true })]),
    ];
    const series = exerciseSeries(sessions, 'bench', 2.5);
    expect(series).toHaveLength(1);
    expect(series[0].topWeight).toBe(100);
  });

  it('ignores other lifts and other lifts’ sets', () => {
    const s: Session = {
      id: '1',
      at: '2026-01-01T10:00:00Z',
      dayKey: 'freestyle',
      title: 'Push',
      exercises: [
        { liftId: 'bench', name: 'Bench press', sets: [set({ w: '100', reps: '5', rpe: '8', done: true })] },
        { liftId: 'ohp', name: 'Overhead press', sets: [set({ w: '60', reps: '5', rpe: '8', done: true })] },
      ],
    };
    const series = exerciseSeries([s], 'bench', 2.5);
    expect(series).toHaveLength(1);
    expect(series[0].topWeight).toBe(100);
  });

  it('takes the heaviest set as the top set and sums volume over working sets', () => {
    const sessions = [
      session('2026-01-01T10:00:00Z', [
        set({ w: '80', reps: '10', rpe: '7', done: true }),
        set({ w: '100', reps: '4', rpe: '9', done: true }),
        set({ w: '95', reps: '3', rpe: '8', warmup: true, done: true }), // excluded
      ]),
    ];
    const series = exerciseSeries(sessions, 'bench', 2.5);
    expect(series[0].topWeight).toBe(100);
    expect(series[0].topReps).toBe(4);
    expect(series[0].volume).toBe(80 * 10 + 100 * 4); // 1200, warm-up excluded
    expect(series[0].sets).toBe(2);
    expect(series[0].avgRpe).toBe(8); // (7 + 9) / 2
  });

  it('falls back to the top weight when no RPE was recorded', () => {
    const sessions = [
      session('2026-01-01T10:00:00Z', [set({ w: '100', reps: '5', rpe: '', done: true })]),
    ];
    const series = exerciseSeries(sessions, 'bench', 2.5);
    expect(series[0].e1rm).toBe(100);
  });

  it('estimates 1RM above the top weight for a sub-maximal set', () => {
    const sessions = [
      session('2026-01-01T10:00:00Z', [set({ w: '100', reps: '5', rpe: '8', done: true })]),
    ];
    const series = exerciseSeries(sessions, 'bench', 2.5);
    expect(series[0].e1rm).toBeGreaterThan(100);
  });
});

describe('seriesDelta', () => {
  it('reports absolute and percentage change from first to last', () => {
    expect(seriesDelta([100, 110])).toEqual({ abs: 10, pct: 10 });
  });

  it('has no delta for a single point', () => {
    expect(seriesDelta([100])).toEqual({ abs: 0, pct: null });
  });
});

describe('summarize', () => {
  it('reports first, latest, peak and mean', () => {
    expect(summarize([100, 120, 110])).toEqual({
      first: 100,
      latest: 110,
      peak: 120,
      peakIndex: 1,
      mean: 110,
    });
  });

  it('takes the first occurrence of the peak', () => {
    const s = summarize([90, 100, 100, 95]);
    expect(s?.peakIndex).toBe(1);
  });

  it('is null for an empty series', () => {
    expect(summarize([])).toBeNull();
  });
});

describe('shortDate', () => {
  it('formats a timestamp to a short day/month label', () => {
    expect(shortDate('2026-07-12T10:00:00Z')).toMatch(/12|Jul/);
  });

  it('returns empty for an invalid date', () => {
    expect(shortDate('not-a-date')).toBe('');
  });
});

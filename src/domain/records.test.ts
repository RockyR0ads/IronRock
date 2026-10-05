import { describe, expect, it } from 'vitest';
import { liftRecords } from './records';
import type { LoggedSet, Session } from './types';

const set = (s: Partial<LoggedSet>): LoggedSet => ({ w: '', reps: '', rpe: '', done: true, ...s });
const session = (at: string, sets: LoggedSet[], liftId = 'bench'): Session => ({
  id: at,
  at,
  dayKey: 'freestyle',
  title: 'T',
  exercises: [{ liftId, name: 'Bench', sets }],
});

describe('liftRecords', () => {
  const sessions: Session[] = [
    session('2026-01-01T10:00:00Z', [
      set({ w: '100', reps: '5' }),
      set({ w: '110', reps: '1' }),
    ]),
    session('2026-02-01T10:00:00Z', [
      set({ w: '105', reps: '5' }),
      set({ w: '60', reps: '5', warmup: true }), // ignored
      set({ w: '120', reps: '5', done: false }), // ignored
    ]),
  ];

  it('tracks the heaviest weight per rep count', () => {
    const r = liftRecords(sessions, 'bench', 2.5);
    const rm5 = r.repMaxes.find((m) => m.reps === 5);
    const rm1 = r.repMaxes.find((m) => m.reps === 1);
    expect(rm5?.weight).toBe(105); // 105 > 100
    expect(rm1?.weight).toBe(110);
  });

  it('reports the heaviest single set and best est. 1RM', () => {
    const r = liftRecords(sessions, 'bench', 2.5);
    expect(r.heaviest?.weight).toBe(110);
    expect(r.bestE1rm && r.bestE1rm.value).toBeGreaterThanOrEqual(110);
  });

  it('ignores warm-ups and uncompleted sets in session volume', () => {
    const r = liftRecords(sessions, 'bench', 2.5);
    // Feb session volume = 105*5 = 525 only
    expect(r.bestVolume?.volume).toBe(100 * 5 + 110 * 1); // Jan = 610 is the max
  });

  it('returns nulls for a lift with no history', () => {
    const r = liftRecords(sessions, 'squat', 2.5);
    expect(r.bestE1rm).toBeNull();
    expect(r.repMaxes).toHaveLength(0);
  });
});

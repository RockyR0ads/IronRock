import { describe, expect, it } from 'vitest';
import { buildOverview, muscleGroupOf } from './overview';
import type { LoggedSet, Session } from './types';

const set = (s: Partial<LoggedSet>): LoggedSet => ({ w: '', reps: '', rpe: '', done: true, ...s });
const session = (at: string, liftId: string, sets: LoggedSet[]): Session => ({
  id: at + liftId,
  at,
  dayKey: 'freestyle',
  title: 'T',
  exercises: [{ liftId, name: liftId, sets }],
});

describe('muscleGroupOf', () => {
  it('maps catalogue lifts by their first category', () => {
    expect(muscleGroupOf('bench', {})).toBe('Chest');
    expect(muscleGroupOf('squat', {})).toBe('Legs');
    expect(muscleGroupOf('row', {})).toBe('Back');
  });
  it('falls back to a custom lift group, then Other', () => {
    expect(muscleGroupOf('my-thing', { 'my-thing': 'Legs' })).toBe('Legs');
    expect(muscleGroupOf('mystery', {})).toBe('Other');
  });
});

describe('buildOverview', () => {
  const sessions: Session[] = [
    session('2026-09-07T10:00:00Z', 'bench', [set({ w: '100', reps: '5' }), set({ w: '100', reps: '5' })]),
    session('2026-09-14T10:00:00Z', 'squat', [set({ w: '140', reps: '5' })]),
    session('2026-09-21T10:00:00Z', 'bench', [set({ w: '100', reps: '5' })]),
  ];

  it('counts workouts and volume into weekly buckets', () => {
    const ov = buildOverview(sessions, { days: Infinity });
    expect(ov.granularity).toBe('week');
    expect(ov.totalWorkouts).toBe(3);
    expect(ov.buckets.reduce((a, b) => a + b.workouts, 0)).toBe(3);
    // total volume = 100*5*2 + 140*5 + 100*5 = 1000 + 700 + 500 = 2200
    expect(ov.buckets.reduce((a, b) => a + b.volume, 0)).toBe(2200);
  });

  it('counts sets per muscle group', () => {
    const ov = buildOverview(sessions, { days: Infinity });
    const chest = ov.byGroup.find((g) => g.group === 'Chest');
    const legs = ov.byGroup.find((g) => g.group === 'Legs');
    expect(chest?.sets).toBe(3); // 2 + 1 bench sets
    expect(legs?.sets).toBe(1);
  });

  it('counts a trailing weekly streak over three consecutive weeks', () => {
    const ov = buildOverview(sessions, { days: Infinity });
    expect(ov.streakWeeks).toBe(3);
  });

  it('is empty for no sessions', () => {
    const ov = buildOverview([], {});
    expect(ov.buckets).toHaveLength(0);
    expect(ov.totalWorkouts).toBe(0);
  });
});

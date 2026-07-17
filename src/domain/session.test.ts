import { describe, expect, it } from 'vitest';
import { sessionDayLabel, sessionEntries, doneOnly } from './session';
import type { Session } from './types';

const NOW = new Date('2026-07-17T20:00:00');

describe('sessionDayLabel', () => {
  it('names today and yesterday', () => {
    expect(sessionDayLabel('2026-07-17T06:30:00', NOW)).toBe('Today');
    expect(sessionDayLabel('2026-07-16T23:59:00', NOW)).toBe('Yesterday');
  });

  it('compares calendar days, not elapsed hours', () => {
    // only 90 minutes earlier, but the previous calendar day
    expect(sessionDayLabel('2026-07-16T23:30:00', new Date('2026-07-17T01:00:00'))).toBe(
      'Yesterday'
    );
  });

  it('falls back to a short date further back', () => {
    const label = sessionDayLabel('2026-07-10T18:00:00', NOW);
    expect(label).not.toBe('Today');
    expect(label).not.toBe('Yesterday');
    expect(label.length).toBeGreaterThan(0);
  });

  it('returns an empty label for an unparseable timestamp', () => {
    expect(sessionDayLabel('not-a-date', NOW)).toBe('');
  });
});

describe('doneOnly', () => {
  it('keeps just the checked-off sets', () => {
    const sets = [
      { w: '100', reps: '5', rpe: '8', done: true },
      { w: '100', reps: '5', rpe: '9' },
    ];
    expect(doneOnly(sets)).toHaveLength(1);
  });
});

describe('sessionEntries', () => {
  it('maps a session onto stats entries', () => {
    const session: Session = {
      id: 'a',
      at: NOW.toISOString(),
      dayKey: 'pushA',
      title: 'Push',
      exercises: [{ liftId: 'bench', name: 'Bench press', sets: [] }],
    };
    expect(sessionEntries(session)).toEqual([{ name: 'Bench press', sets: [] }]);
  });
});

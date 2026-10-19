import { describe, expect, it } from 'vitest';
import { filterSessions, groupByMonth, monthCounts, dayCounts, yearsWithData, dateLabel } from './historyFilter';
import { reducer, initialState, liftInLayout } from '../state/store';
import type { Session } from './types';

// local-time dates so calendar maths matches what the user sees
const at = (y: number, m: number, d: number) => new Date(y, m, d, 18, 0).toISOString();
const s = (id: string, when: string, title: string, lifts: string[], note?: string): Session => ({
  id,
  at: when,
  dayKey: '__freestyle__',
  title,
  note,
  exercises: lifts.map((liftId) => ({ liftId, name: liftId, sets: [{ w: '50', reps: '5', rpe: '', done: true }] })),
});

const SESSIONS = [
  s('c', at(2024, 2, 14), 'Pull', ['row', 'cablelatraise'], 'shoulder twinge'),
  s('b', at(2023, 2, 2), 'Push', ['bench']),
  s('a', at(2021, 6, 9), 'Push', ['bench', 'cablelatraise']),
];
const nameOf = (id: string) => ({ row: 'Barbell row', bench: 'Bench press', cablelatraise: 'Cable lateral raise' })[id] ?? id;

describe('history filter', () => {
  it('matches text across title, exercise names and notes', () => {
    const f = (text: string) => filterSessions(SESSIONS, { text, liftId: null, date: { kind: 'all' } }, nameOf).map((x) => x.id);
    expect(f('lateral')).toEqual(['c', 'a']);
    expect(f('twinge')).toEqual(['c']);
    expect(f('push bench')).toEqual(['b', 'a']);
  });

  it('filters by exercise and by year / month / day', () => {
    const q = (liftId: string | null, date: Parameters<typeof filterSessions>[1]['date']) =>
      filterSessions(SESSIONS, { text: '', liftId, date }, nameOf).map((x) => x.id);
    expect(q('cablelatraise', { kind: 'all' })).toEqual(['c', 'a']);
    expect(q(null, { kind: 'year', y: 2023 })).toEqual(['b']);
    expect(q(null, { kind: 'month', y: 2024, m: 2 })).toEqual(['c']);
    expect(q(null, { kind: 'day', y: 2024, m: 2, d: 15 })).toEqual([]);
    expect(q(null, { kind: 'day', y: 2024, m: 2, d: 14 })).toEqual(['c']);
  });

  it('builds calendar counts and month groups', () => {
    expect(yearsWithData(SESSIONS)).toEqual([2024, 2023, 2021]);
    expect(monthCounts(SESSIONS, 2024)[2]).toBe(1);
    expect(dayCounts(SESSIONS, 2021, 6).get(9)).toBe(1);
    expect(groupByMonth(SESSIONS).map((g) => g.label)).toEqual(['March 2024', 'March 2023', 'July 2021']);
    expect(dateLabel({ kind: 'month', y: 2024, m: 2 })).toBe('March 2024');
  });
});

describe('delete / merge an exercise', () => {
  const base = {
    ...initialState(),
    customLifts: { 'custom-r': { name: 'Custom raises', unit: 'kg', group: 'Shoulders' } },
    sessions: [s('x', at(2025, 0, 1), 'F', ['custom-r']), s('y', at(2025, 0, 2), 'F', ['custom-r', 'bench'])],
    history: { 'custom-r': { w: '8', reps: '15', rpe: '' } },
  };

  it('delete removes the lift, its sets and any workout left empty', () => {
    const next = reducer(base, { type: 'deleteLift', id: 'custom-r' });
    expect(next.sessions.map((x) => x.id)).toEqual(['y']);
    expect(next.sessions[0].exercises.map((e) => e.liftId)).toEqual(['bench']);
    expect(next.customLifts['custom-r']).toBeUndefined();
    expect(next.history['custom-r']).toBeUndefined();
  });

  it('merge moves every set onto the target and retires the source', () => {
    const next = reducer(base, { type: 'mergeLift', from: 'custom-r', to: 'cablelatraise' });
    expect(next.sessions).toHaveLength(2);
    expect(next.sessions.every((x) => x.exercises.some((e) => e.liftId === 'cablelatraise'))).toBe(true);
    expect(next.sessions[0].exercises[0].name).toBe('Cable lateral raise');
    expect(next.customLifts['custom-r']).toBeUndefined();
    expect(next.history.cablelatraise?.w).toBe('8');
  });

  it('knows when a lift sits in a training layout', () => {
    const withRoutine = {
      ...base,
      routineDays: [{ key: 'r', label: 'D', variant: '', note: '', blocks: [{ lift: 'custom-r', sets: 3, reps: 10, rpe: 9, cls: 'r-iso' as const, cat: 'latdelt' as const }] }],
    };
    expect(liftInLayout(base, 'custom-r')).toBe(false);
    expect(liftInLayout(withRoutine, 'custom-r')).toBe(true);
  });
});

import { weeklyMuscleSets, findPlateaus, readinessAdjust, calorieAdvice } from './insights';
import { ULA_DAYS } from './program';
import type { Session } from './types';

const set = (w: string, reps: string) => ({ w, reps, rpe: '8', done: true });
const sess = (at: string, liftId: string, sets = [set('100', '5')]): Session => ({
  id: at, at, dayKey: 'ppl4PushH', title: '', exercises: [{ liftId, name: liftId, sets }],
});

describe('insights', () => {
  it('counts working sets per muscle against the plan', () => {
    const v = weeklyMuscleSets([sess('2026-10-28T10:00:00Z', 'bench', [set('100', '5'), set('100', '5')])], ULA_DAYS, '2026-10-27T00:00:00Z');
    const chest = v.find((m) => m.muscle === 'Chest')!;
    expect(chest.done).toBe(2);
    expect(chest.target).toBeGreaterThan(5);
  });

  it('flags a lift whose e1RM has not moved in weeks', () => {
    const now = Date.parse('2026-10-29T00:00:00Z');
    const weeks = (n: number) => new Date(now - n * 7 * 864e5).toISOString();
    const sessions = [3, 2, 1, 0.5].map((n) => sess(weeks(n), 'bench', [set('95', '5')]));
    sessions.push(sess(weeks(6), 'bench', [set('100', '5')]));
    const p = findPlateaus(sessions.sort((a, b) => b.at.localeCompare(a.at)), 2.5, 4, now);
    expect(p[0]).toMatchObject({ liftId: 'bench', weeks: 6 });
  });

  it('eases RPE on a rough day', () => {
    expect(readinessAdjust({ sleep: 1, energy: 2, soreness: 2 }).adjust).toBe(-1);
    expect(readinessAdjust({ sleep: 4, energy: 4, soreness: 3 }).adjust).toBe(0);
  });

  it('nudges calories outside the 0.3–0.8 kg/week window', () => {
    const now = Date.parse('2026-10-29T12:00:00Z');
    const day = (d: number, kg: number) => ({ at: new Date(now - d * 864e5).toISOString().slice(0, 10), kg });
    const stalled = [20, 19, 18, 16, 15, 3, 2, 1].map((d) => day(d, d > 10 ? 85 : 84.8));
    expect(calorieAdvice(stalled, now)?.change).toBe(-200);
    const fast = [20, 19, 18, 3, 2, 1].map((d) => day(d, d > 10 ? 86 : 84));
    expect(calorieAdvice(fast, now)?.change).toBe(200);
  });
});

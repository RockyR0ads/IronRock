import { describe, it, expect } from 'vitest';
import { weightProgress, type WeighIn } from './weightTracker';

const goal = { target: '80', date: '2026-09-01' };

describe('weightProgress', () => {
  it('returns null without enough data', () => {
    expect(weightProgress([], goal)).toBeNull();
    expect(weightProgress([{ at: '2026-07-01', kg: 90 }], {})).toBeNull();
    expect(weightProgress([{ at: '2026-07-01', kg: 90 }], { target: '80' })).toBeNull();
  });

  it('computes lost / to-go / totals', () => {
    const weighIns: WeighIn[] = [
      { at: '2026-07-01', kg: 90 },
      { at: '2026-07-15', kg: 88 },
    ];
    const p = weightProgress(weighIns, goal, new Date('2026-07-15'))!;
    expect(p.start.kg).toBe(90);
    expect(p.latest.kg).toBe(88);
    expect(p.lost).toBe(2);
    expect(p.toGo).toBe(8);
    expect(p.totalToLose).toBe(10);
    expect(p.pctComplete).toBe(20);
  });

  it('averages the actual weekly rate', () => {
    const weighIns: WeighIn[] = [
      { at: '2026-07-01', kg: 90 },
      { at: '2026-07-15', kg: 88 }, // 2 kg over exactly 2 weeks = 1 kg/wk
    ];
    const p = weightProgress(weighIns, goal, new Date('2026-07-15'))!;
    expect(p.actualRatePerWeek).toBeCloseTo(1, 5);
  });

  it('flags on/off track against the straight-line plan', () => {
    const start: WeighIn = { at: '2026-07-01', kg: 90 };
    // plan: 90 → 80 over Jul 1 → Sep 1 (62 days); at day 31 the ideal is ~85
    const ahead = weightProgress([start, { at: '2026-08-01', kg: 84 }], goal, new Date('2026-08-01'))!;
    expect(ahead.onTrack).toBe(true);
    const behind = weightProgress([start, { at: '2026-08-01', kg: 88 }], goal, new Date('2026-08-01'))!;
    expect(behind.onTrack).toBe(false);
  });

  it('projects a finish date at the current pace', () => {
    const weighIns: WeighIn[] = [
      { at: '2026-07-01', kg: 90 },
      { at: '2026-07-15', kg: 88 }, // 1 kg/wk, 8 kg to go → 8 more weeks
    ];
    const p = weightProgress(weighIns, goal, new Date('2026-07-15'))!;
    expect(p.projectedDate).toBe('2026-09-09'); // Jul 15 + 8 weeks
  });

  it('has no projected date when not losing', () => {
    const weighIns: WeighIn[] = [
      { at: '2026-07-01', kg: 90 },
      { at: '2026-07-15', kg: 90.5 }, // gained
    ];
    const p = weightProgress(weighIns, goal, new Date('2026-07-15'))!;
    expect(p.projectedDate).toBeNull();
  });
});

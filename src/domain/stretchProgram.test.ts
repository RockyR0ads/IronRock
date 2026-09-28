import { describe, it, expect } from 'vitest';
import {
  STRETCH_TEMPLATES,
  buildSteps,
  progressedHold,
  stretchWeek,
  recommendedSession,
} from './stretchProgram';
import { STRETCHES } from './stretches';

describe('stretch program', () => {
  it('every template block references a real stretch', () => {
    for (const t of Object.values(STRETCH_TEMPLATES)) {
      for (const b of t.blocks) {
        expect(STRETCHES[b.stretch], `${t.type}: ${b.stretch}`).toBeDefined();
      }
    }
  });

  it('progresses static/pnf holds but not dynamic ones', () => {
    expect(progressedHold(30, 'static', 1)).toBe(30); // week 1 = base
    expect(progressedHold(30, 'static', 3)).toBe(35); // +5 every 2 weeks
    expect(progressedHold(30, 'pnf', 5)).toBe(40);
    expect(progressedHold(30, 'static', 99)).toBe(50); // capped at +20
    expect(progressedHold(30, 'dynamic', 99)).toBe(30); // warm-ups don't grow
  });

  it('splits per-side stretches into L then R steps', () => {
    const steps = buildSteps('reset', 1);
    // world's greatest (per-side) is first → two steps, Left then Right
    expect(steps[0].side).toBe('L');
    expect(steps[1].side).toBe('R');
    expect(steps[0].stretchId).toBe(steps[1].stretchId);
    // cat–cow is not per-side → a single null-side step
    const catcow = steps.filter((s) => s.stretchId === 'catcow');
    expect(catcow).toHaveLength(1);
    expect(catcow[0].side).toBeNull();
  });

  it('a deep PNF block yields one step per round per side', () => {
    const steps = buildSteps('deep', 1);
    const pnf = steps.filter((s) => s.stretchId === 'hamstringpnf');
    expect(pnf).toHaveLength(6); // 3 rounds × 2 sides
    expect(pnf.every((s) => s.type === 'pnf')).toBe(true);
  });

  it('week counting starts at 1 and advances weekly', () => {
    const start = '2026-09-01T00:00:00Z';
    expect(stretchWeek(undefined)).toBe(1);
    expect(stretchWeek(start, new Date('2026-09-01T12:00:00Z'))).toBe(1);
    expect(stretchWeek(start, new Date('2026-09-08T12:00:00Z'))).toBe(2);
    expect(stretchWeek(start, new Date('2026-09-22T12:00:00Z'))).toBe(4);
  });

  it('recommends deep when it has been ≥2 days, else reset', () => {
    const now = new Date('2026-09-20T08:00:00Z');
    expect(recommendedSession(undefined, now)).toBe('deep');
    expect(recommendedSession('2026-09-19T08:00:00Z', now)).toBe('reset');
    expect(recommendedSession('2026-09-17T08:00:00Z', now)).toBe('deep');
  });
});

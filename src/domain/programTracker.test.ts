import { describe, it, expect } from 'vitest';
import { programProgress, PPL_CYCLE, W531_CYCLE } from './programTracker';
import type { Session } from './types';

const DAY = 24 * 60 * 60 * 1000;
const start = '2026-01-01T08:00:00Z';
const startMs = new Date(start).getTime();
const W = PPL_CYCLE.cycleWeeks;

/** A program session at `dayOffset` days after the block start. */
const sess = (dayOffset: number): Session => ({
  id: `s${dayOffset}`,
  at: new Date(startMs + dayOffset * DAY).toISOString(),
  dayKey: 'pushA',
  title: 'Push',
  exercises: [],
});

const at = (days: number) => new Date(startMs + days * DAY);

describe('programProgress', () => {
  it('is week 1, block 1 on the start day', () => {
    const p = programProgress([], start, PPL_CYCLE, at(0));
    expect(p.weekOverall).toBe(1);
    expect(p.block).toBe(1);
    expect(p.weekInBlock).toBe(1);
    expect(p.isDeload).toBe(false);
    expect(p.weeksToDeload).toBe(W - 1);
    expect(p.cycleWeeks).toBe(W);
    expect(p.targetSessions).toBe(PPL_CYCLE.targetSessions);
  });

  it('advances week each 7 days', () => {
    expect(programProgress([], start, PPL_CYCLE, at(6)).weekInBlock).toBe(1);
    expect(programProgress([], start, PPL_CYCLE, at(7)).weekInBlock).toBe(2);
    expect(programProgress([], start, PPL_CYCLE, at(13)).weekInBlock).toBe(2);
  });

  it('marks the deload week and rolls into a new block', () => {
    const deload = programProgress([], start, PPL_CYCLE, at(7 * (W - 1)));
    expect(deload.weekInBlock).toBe(W);
    expect(deload.isDeload).toBe(true);
    expect(deload.weeksToDeload).toBe(0);

    const nextBlock = programProgress([], start, PPL_CYCLE, at(7 * W));
    expect(nextBlock.block).toBe(2);
    expect(nextBlock.weekInBlock).toBe(1);
  });

  it('counts sessions into the right week of the block', () => {
    const sessions = [sess(0), sess(2), sess(8)]; // two in week 1, one in week 2
    const p = programProgress(sessions, start, PPL_CYCLE, at(8));
    expect(p.weekCounts[0]).toBe(2);
    expect(p.weekCounts[1]).toBe(1);
    expect(p.sessionsThisWeek).toBe(1); // now is in week 2
    expect(p.totalSessions).toBe(3);
  });

  it('excludes freestyle / non-program sessions', () => {
    const freestyle: Session = { ...sess(1), dayKey: 'freestyle', title: 'Freestyle' };
    const p = programProgress([sess(1), freestyle, sess(2)], start, PPL_CYCLE, at(2));
    expect(p.totalSessions).toBe(2); // the two program days, not the freestyle one
    expect(p.weekCounts[0]).toBe(2);
  });

  it('ignores sessions logged before the block started', () => {
    const before: Session = { ...sess(0), at: new Date(startMs - DAY).toISOString() };
    const p = programProgress([before, sess(1)], start, PPL_CYCLE, at(1));
    expect(p.totalSessions).toBe(1);
  });

  it('tracks 5/3/1 on its own 4-week cycle and day keys', () => {
    const w531 = (dayOffset: number): Session => ({
      ...sess(dayOffset),
      dayKey: 'w531-bench',
      title: '5/3/1 · Bench',
    });
    // deload is week 4, and PPL sessions must not count toward the 5/3/1 cycle
    const deload = programProgress([w531(0), sess(0)], start, W531_CYCLE, at(21));
    expect(deload.cycleWeeks).toBe(4);
    expect(deload.targetSessions).toBe(4);
    expect(deload.weekInBlock).toBe(4);
    expect(deload.isDeload).toBe(true);
    expect(deload.totalSessions).toBe(1); // only the w531 session, not the PPL one
    expect(programProgress([], start, W531_CYCLE, at(28)).block).toBe(2);
  });
});

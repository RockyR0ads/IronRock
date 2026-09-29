import { describe, it, expect } from 'vitest';
import { workoutTiming, workoutStartedAt, fmtDuration } from './workoutTiming';
import type { LoggedSet } from './types';

const at = (iso: string, extra: Partial<LoggedSet> = {}): LoggedSet => ({
  w: '100',
  reps: '5',
  rpe: '8',
  done: true,
  at: iso,
  ...extra,
});

describe('workoutTiming', () => {
  it('measures duration from first counted set to completion and averages the gaps', () => {
    const rows: LoggedSet[][] = [
      [at('2026-09-20T10:00:00Z'), at('2026-09-20T10:03:00Z')],
      [at('2026-09-20T10:09:00Z')],
    ];
    const t = workoutTiming(rows, '2026-09-20T10:10:00Z');
    expect(t.startedAt).toBe('2026-09-20T10:00:00.000Z');
    expect(t.durationSec).toBe(600); // 10:00 → 10:10
    expect(t.sets).toBe(3);
    // gaps: 180s and 360s → avg 270
    expect(t.avgIntervalSec).toBe(270);
  });

  it('ignores warm-ups and un-checked sets', () => {
    const rows: LoggedSet[][] = [
      [at('2026-09-20T10:00:00Z', { warmup: true }), at('2026-09-20T10:05:00Z', { done: false, at: undefined })],
      [at('2026-09-20T10:06:00Z')],
    ];
    const t = workoutTiming(rows, '2026-09-20T10:10:00Z');
    expect(t.sets).toBe(1); // only the one real, done, timestamped set
    expect(t.avgIntervalSec).toBeNull();
    expect(workoutStartedAt(rows)).toBe('2026-09-20T10:06:00.000Z');
  });

  it('formats durations compactly', () => {
    expect(fmtDuration(45)).toBe('45s');
    expect(fmtDuration(150)).toBe('2m 30s');
    expect(fmtDuration(3720)).toBe('1h 02m');
  });
});

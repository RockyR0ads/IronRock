import { describe, expect, it } from 'vitest';
import { rangeFor, sliceByRange } from './ranges';

const day = 86_400_000;
const pt = (daysAgoFromEnd: number, end: number) => ({
  at: new Date(end - daysAgoFromEnd * day).toISOString(),
});

describe('sliceByRange', () => {
  const end = Date.parse('2026-10-05T00:00:00Z');
  // points at 0, 30, 120, 300 days before the latest point
  const series = [pt(300, end), pt(120, end), pt(30, end), pt(0, end)];

  it('keeps only points within the window, measured from the latest point', () => {
    const kept = sliceByRange(series, 90);
    expect(kept).toHaveLength(2); // 30d and 0d
    expect(kept[kept.length - 1].at).toBe(series[series.length - 1].at);
  });

  it('returns the whole series for an infinite window', () => {
    expect(sliceByRange(series, Infinity)).toHaveLength(4);
  });

  it('falls back to the full series when a window would leave fewer than two points', () => {
    // only the latest point is within 10 days → fall back rather than show one dot
    expect(sliceByRange(series, 10)).toHaveLength(4);
  });

  it('never drops below two points to filter', () => {
    expect(sliceByRange([pt(0, end)], 90)).toHaveLength(1);
  });

  it('rangeFor falls back to the last range for an unknown key', () => {
    expect(rangeFor('nope').key).toBe('all');
  });
});

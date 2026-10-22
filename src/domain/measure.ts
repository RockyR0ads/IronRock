import type { Lift } from './types';

/**
 * How a lift is measured. Most are weight × reps; holds (plank, dead hang) are
 * timed, and conditioning (run, row, bike) is distance over time. It's read
 * from the lift's unit, so a custom exercise can be any of the three.
 */
export type Measure = 'weight' | 'time' | 'distance';

export const UNIT_TIME = 'time';
export const UNIT_DISTANCE = 'distance';

export function liftMeasure(lift: Pick<Lift, 'unit'>): Measure {
  if (lift.unit === UNIT_TIME) return 'time';
  if (lift.unit === UNIT_DISTANCE) return 'distance';
  return 'weight';
}

/** 75 → "1:15", 3725 → "1:02:05". */
export function fmtSecs(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** "90" → 90, "1:30" → 90, "1:02:05" → 3725; null if it isn't a time. */
export function parseSecs(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return null;
  return t.split(':').reduce((acc, part) => acc * 60 + Number(part), 0);
}

/** 800 → "800 m", 5200 → "5.2 km". */
export function fmtDist(meters: number): string {
  if (meters >= 1000) return `${Math.round(meters / 100) / 10} km`;
  return `${Math.round(meters)} m`;
}

import type { Session } from './types';

/**
 * Narrowing a long workout history: free text (workout name, exercise names,
 * notes), one exercise, and a calendar window (a year, a month or a single
 * day). Dates are read in local time, matching how the calendar is drawn.
 */

export type DateFilter =
  | { kind: 'all' }
  | { kind: 'year'; y: number }
  | { kind: 'month'; y: number; m: number } // m: 0–11
  | { kind: 'day'; y: number; m: number; d: number };

export interface HistoryQuery {
  text: string;
  liftId: string | null;
  date: DateFilter;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3));

function inDate(at: string, f: DateFilter): boolean {
  if (f.kind === 'all') return true;
  const d = new Date(at);
  if (d.getFullYear() !== f.y) return false;
  if (f.kind === 'year') return true;
  if (d.getMonth() !== f.m) return false;
  return f.kind === 'month' || d.getDate() === f.d;
}

/** Sessions matching every part of the query, keeping their order. */
export function filterSessions(
  sessions: Session[],
  q: HistoryQuery,
  nameOf: (liftId: string) => string
): Session[] {
  const terms = q.text.toLowerCase().split(/\s+/).filter(Boolean);
  return sessions.filter((s) => {
    if (!inDate(s.at, q.date)) return false;
    if (q.liftId && !s.exercises.some((ex) => ex.liftId === q.liftId)) return false;
    if (terms.length === 0) return true;
    const hay = [s.title, s.note ?? '', ...s.exercises.map((ex) => nameOf(ex.liftId))]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/** Years that contain at least one workout, newest first. */
export function yearsWithData(sessions: Session[]): number[] {
  const ys = new Set<number>();
  for (const s of sessions) {
    const y = new Date(s.at).getFullYear();
    if (Number.isFinite(y)) ys.add(y);
  }
  return [...ys].sort((a, b) => b - a);
}

/** Workouts per month (index 0 = Jan) in a year. */
export function monthCounts(sessions: Session[], year: number): number[] {
  const out = Array<number>(12).fill(0);
  for (const s of sessions) {
    const d = new Date(s.at);
    if (d.getFullYear() === year) out[d.getMonth()] += 1;
  }
  return out;
}

/** Workouts per day-of-month in one month. */
export function dayCounts(sessions: Session[], year: number, month: number): Map<number, number> {
  const out = new Map<number, number>();
  for (const s of sessions) {
    const d = new Date(s.at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      out.set(d.getDate(), (out.get(d.getDate()) ?? 0) + 1);
    }
  }
  return out;
}

/** Human label for a date filter: "All dates", "2023", "March 2023", "14 Mar 2023". */
export function dateLabel(f: DateFilter): string {
  if (f.kind === 'all') return 'All dates';
  if (f.kind === 'year') return String(f.y);
  if (f.kind === 'month') return `${MONTHS[f.m]} ${f.y}`;
  return `${f.d} ${MONTH_SHORT[f.m]} ${f.y}`;
}

/** Group sessions (already newest-first) into "Month Year" buckets. */
export function groupByMonth(sessions: Session[]): { key: string; label: string; items: Session[] }[] {
  const out: { key: string; label: string; items: Session[] }[] = [];
  for (const s of sessions) {
    const d = new Date(s.at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = out[out.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, items: [] };
      out.push(g);
    }
    g.items.push(s);
  }
  return out;
}

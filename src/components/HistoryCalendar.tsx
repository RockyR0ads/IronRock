import { useState } from 'react';
import type { Session } from '../domain/types';
import { dayCounts, monthCounts, MONTH_SHORT, yearsWithData, type DateFilter } from '../domain/historyFilter';
import { ChevronLeft, ChevronRight } from './common/icons';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Shade a tile by how busy it was relative to the busiest in view. */
function shade(n: number, max: number): string {
  if (n <= 0 || max <= 0) return 'transparent';
  const a = 0.18 + 0.62 * (n / max);
  return `rgb(var(--secondary) / ${a.toFixed(2)})`;
}

/**
 * A year → month → day picker for jumping around years of training. Step years
 * with the arrows (only years you trained in); month tiles show how many
 * workouts each holds; tap a month to filter to it and open its days, tap a
 * day to narrow further. Tap the year label to take the whole year.
 */
export function HistoryCalendar({
  sessions,
  value,
  onChange,
}: {
  sessions: Session[];
  value: DateFilter;
  onChange: (f: DateFilter) => void;
}) {
  const years = yearsWithData(sessions);
  const initialYear = value.kind === 'all' ? (years[0] ?? new Date().getFullYear()) : value.y;
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState<number | null>(
    value.kind === 'month' || value.kind === 'day' ? value.m : null
  );

  const idx = years.indexOf(year);
  const older = idx >= 0 && idx < years.length - 1 ? years[idx + 1] : null;
  const newer = idx > 0 ? years[idx - 1] : null;
  const months = monthCounts(sessions, year);
  const maxM = Math.max(...months);
  const yearTotal = months.reduce((a, b) => a + b, 0);

  const goYear = (y: number | null) => {
    if (y === null) return;
    setYear(y);
    setMonth(null);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
      {/* year navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Earlier year"
          disabled={older === null}
          onClick={() => goYear(older)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:text-ink disabled:opacity-25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setMonth(null);
            onChange({ kind: 'year', y: year });
          }}
          className={[
            'rounded-xl px-3 py-1 text-center transition-colors',
            value.kind === 'year' && value.y === year ? 'bg-secondary/15 text-secondary' : 'text-ink',
          ].join(' ')}
        >
          <span className="block font-display text-[20px] font-black leading-none">{year}</span>
          <span className="mt-0.5 block font-mono text-[10px] text-muted-2">
            {yearTotal} workout{yearTotal === 1 ? '' : 's'}
          </span>
        </button>
        <button
          type="button"
          aria-label="Later year"
          disabled={newer === null}
          onClick={() => goYear(newer)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:text-ink disabled:opacity-25"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* month tiles */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {months.map((n, m) => {
          const on =
            (value.kind === 'month' || value.kind === 'day') && value.y === year && value.m === m;
          return (
            <button
              key={m}
              type="button"
              disabled={n === 0}
              onClick={() => {
                setMonth(m);
                onChange({ kind: 'month', y: year, m });
              }}
              style={{ backgroundColor: on ? undefined : shade(n, maxM) }}
              className={[
                'rounded-xl border py-2 text-center transition-colors disabled:opacity-35',
                on ? 'border-secondary bg-secondary text-bg' : 'border-line-2 text-ink',
              ].join(' ')}
            >
              <span className="block font-display text-[13px] font-bold leading-none">{MONTH_SHORT[m]}</span>
              <span className={['mt-1 block font-mono text-[10px]', on ? 'text-bg/80' : 'text-muted-2'].join(' ')}>
                {n || '–'}
              </span>
            </button>
          );
        })}
      </div>

      {/* day grid for the open month */}
      {month !== null && <DayGrid sessions={sessions} year={year} month={month} value={value} onChange={onChange} />}
    </div>
  );
}

function DayGrid({
  sessions,
  year,
  month,
  value,
  onChange,
}: {
  sessions: Session[];
  year: number;
  month: number;
  value: DateFilter;
  onChange: (f: DateFilter) => void;
}) {
  const counts = dayCounts(sessions, year, month);
  const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first blanks
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-muted-2">
        {DOW.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const n = counts.get(d) ?? 0;
          const on = value.kind === 'day' && value.y === year && value.m === month && value.d === d;
          return (
            <button
              key={d}
              type="button"
              disabled={n === 0}
              onClick={() => onChange({ kind: 'day', y: year, m: month, d })}
              className={[
                'aspect-square rounded-lg font-mono text-[12px] transition-colors disabled:text-muted-2/50',
                on
                  ? 'bg-secondary font-bold text-bg'
                  : n > 0
                    ? 'bg-secondary/20 font-bold text-ink hover:bg-secondary/30'
                    : '',
              ].join(' ')}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

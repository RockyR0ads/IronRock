import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { liftById } from '../../state/store';
import { exerciseSeries } from '../../domain/progress';
import { sessionDayLabel } from '../../domain/session';
import { ChevronLeft } from '../common/icons';
import { ExerciseCharts } from './ExerciseCharts';

type Tab = 'charts' | 'log';

/** The exercise page: a tabbed detail view. Charts is the headline tab. */
export function ExerciseDetail({ liftId, onBack }: { liftId: string; onBack: () => void }) {
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('charts');
  const lift = liftById(state, liftId);
  const series = exerciseSeries(state.sessions, liftId, state.inc);

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to exercises"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            {lift.name}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {series.length} logged session{series.length === 1 ? '' : 's'}
          </div>
        </div>
      </header>

      {/* tab bar */}
      <div className="mt-3 flex gap-6 border-b border-line">
        {(
          [
            ['charts', 'Charts'],
            ['log', 'Log'],
          ] as [Tab, string][]
        ).map(([key, label]) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                '-mb-px border-b-2 pb-2.5 font-display text-[14px] font-bold tracking-[-0.01em] transition-colors',
                on ? 'border-accent text-ink' : 'border-transparent text-muted-2 hover:text-muted',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'charts' ? (
        <ExerciseCharts name={lift.name} series={series} />
      ) : (
        <LogTab series={series} />
      )}
    </div>
  );
}

/** A plain per-session table — the raw numbers behind the charts, newest first. */
function LogTab({ series }: { series: ReturnType<typeof exerciseSeries> }) {
  if (series.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
        <p className="m-0 font-display text-[16px] font-bold">No sessions yet</p>
        <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">
          Completed workouts with this lift show up here.
        </p>
      </div>
    );
  }

  const rows = [...series].reverse();
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
        <span>Date</span>
        <span className="text-right">Top set</span>
        <span className="text-right">Est. 1RM</span>
        <span className="text-right">Volume</span>
      </div>
      {rows.map((p) => (
        <div
          key={p.at}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-line/60 px-4 py-3 font-mono text-[13px] last:border-b-0"
        >
          <span className="text-muted">{sessionDayLabel(p.at)}</span>
          <span className="whitespace-nowrap text-right tabular-nums">
            {p.topWeight}
            <span className="text-[10px] text-muted-2">×{p.topReps}</span>
          </span>
          <span className="text-right tabular-nums text-accent">{p.e1rm}</span>
          <span className="text-right tabular-nums text-muted">
            {p.volume}
            <span className="text-[10px] text-muted-2">kg</span>
          </span>
        </div>
      ))}
    </div>
  );
}

import { useEffect } from 'react';
import type { ProgressPoint } from '../../domain/progress';
import { seriesDelta, summarize } from '../../domain/progress';
import { ChevronLeft } from '../common/icons';
import { DetailAreaChart } from './charts';
import { C } from './charts/chartUtils';
import { METRICS, metricFor } from './metrics';

/**
 * Full-screen drill-down from the minimal chart: a larger, annotated area chart
 * for the selected metric, a stat grid, and a session-by-session breakdown with
 * per-session deltas.
 */
export function ChartDetailSheet({
  name,
  series,
  metricKey,
  onMetric,
  onClose,
}: {
  name: string;
  series: ProgressPoint[];
  metricKey: string;
  onMetric: (key: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const metric = metricFor(metricKey);
  const values = series.map(metric.pick);
  const labels = series.map((p) => p.label);
  const summary = summarize(values);
  const delta = seriesDelta(values);
  const u = metric.unit;

  const stats = summary
    ? [
        { label: 'Current', value: `${summary.latest}${u}`, tone: C.ink },
        { label: 'Peak', value: `${summary.peak}${u}`, tone: C.yellow },
        { label: 'Start', value: `${summary.first}${u}`, tone: C.muted },
        {
          label: 'Change',
          value: `${delta.abs >= 0 ? '+' : ''}${delta.abs}${u}`,
          tone: delta.abs >= 0 ? C.green : C.accent,
        },
        { label: 'Average', value: `${summary.mean}${u}`, tone: C.muted },
        { label: 'Sessions', value: String(series.length), tone: C.muted },
      ]
    : [];

  // newest-first session rows, each with its change from the previous session
  const rows = series
    .map((p, i) => ({
      point: p,
      value: values[i],
      change: i === 0 ? null : Math.round((values[i] - values[i - 1]) * 10) / 10,
    }))
    .reverse();

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-bg animate-sheet-up">
      <div className="mx-auto max-w-[760px] px-4 pb-16 pt-safe sm:px-6">
        <header className="flex items-center gap-3 pb-2 pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 leading-none">
            <div className="truncate font-display text-[20px] font-black uppercase tracking-[-0.01em]">
              {name}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              {metric.label} · detailed view
            </div>
          </div>
        </header>

        {/* metric toggle, shared with the tab underneath */}
        <div className="mt-3 flex gap-1.5 rounded-2xl border border-line bg-surface p-1.5">
          {METRICS.map((m) => {
            const on = m.key === metricKey;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onMetric(m.key)}
                className={[
                  'flex-1 rounded-xl px-2 py-2 font-display text-[13px] font-bold tracking-[-0.01em] transition-colors',
                  on ? 'bg-surface-3 text-ink' : 'text-muted-2 hover:text-muted',
                ].join(' ')}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <section className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <DetailAreaChart values={values} labels={labels} color={metric.color} unit={metric.unit} />
        </section>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface-2 px-2 py-3 text-center">
              <div
                className="whitespace-nowrap font-display text-[16px] font-black tabular-nums leading-none"
                style={{ color: s.tone }}
              >
                {s.value}
              </div>
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-2">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
          Session by session
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {rows.map(({ point, value, change }) => (
            <div
              key={point.at}
              className="flex items-center justify-between border-b border-line/60 px-4 py-3 last:border-b-0"
            >
              <span className="font-mono text-[12px] text-muted">{point.label}</span>
              <span className="flex items-baseline gap-2.5">
                <span className="font-display text-[15px] font-bold tabular-nums">
                  {value}
                  <span className="ml-0.5 text-[10px] text-muted-2">{metric.unit}</span>
                </span>
                {change !== null && (
                  <span
                    className="w-14 text-right font-mono text-[11px] tabular-nums"
                    style={{ color: change > 0 ? C.green : change < 0 ? C.accent : C.muted2 }}
                  >
                    {change > 0 ? '▲' : change < 0 ? '▼' : '–'} {change !== 0 ? Math.abs(change) : ''}
                  </span>
                )}
                {change === null && (
                  <span className="w-14 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-muted-2">
                    first
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

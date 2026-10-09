import { useState } from 'react';
import type { ProgressPoint } from '../../domain/progress';
import { seriesDelta } from '../../domain/progress';
import { ChevronRight } from '../common/icons';
import { SparklineChart } from './charts';
import { C } from './charts/chartUtils';
import { METRICS, metricFor } from './metrics';
import { RANGES, rangeFor, sliceByRange } from './ranges';
import { ChartDetailSheet } from './ChartDetailSheet';

/**
 * The Charts tab: the minimal chart for the selected metric, with a Details
 * button that drills into the annotated area chart.
 */
export function ExerciseCharts({ name, series }: { name: string; series: ProgressPoint[] }) {
  const [metricKey, setMetricKey] = useState('e1rm');
  const [rangeKey, setRangeKey] = useState('all');
  const [detail, setDetail] = useState(false);

  if (series.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
        <p className="m-0 font-display text-[16px] font-bold">Nothing to chart yet</p>
        <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">
          Complete a workout with this lift and it starts building a trend here.
        </p>
      </div>
    );
  }

  const metric = metricFor(metricKey);
  const range = rangeFor(rangeKey);
  const view = sliceByRange(series, range.days);
  const values = view.map(metric.pick);
  const labels = view.map((p) => p.label);
  const ats = view.map((p) => new Date(p.at).getTime());
  const delta = seriesDelta(values);

  return (
    <div className="mt-4">
      {/* metric toggle — drives the chart and the drill-down */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none]">
        {METRICS.map((m) => {
          const on = m.key === metricKey;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetricKey(m.key)}
              className={[
                'shrink-0 whitespace-nowrap rounded-xl px-3 py-2 font-display text-[13px] font-bold tracking-[-0.01em] transition-colors',
                on ? 'bg-surface-3 text-ink' : 'text-muted-2 hover:text-muted',
              ].join(' ')}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* time-range toggle */}
      {series.length >= 2 && (
        <div className="mt-2 flex gap-1.5">
          {RANGES.map((r) => {
            const on = r.key === rangeKey;
            // hide windows that wouldn't actually crop anything
            const spanDays =
              (ats.length > 0
                ? new Date(series[series.length - 1].at).getTime() -
                  new Date(series[0].at).getTime()
                : 0) / 86_400_000;
            if (Number.isFinite(r.days) && r.days >= spanDays) return null;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRangeKey(r.key)}
                className={[
                  'rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.04em] transition-colors',
                  on
                    ? 'border-secondary/60 bg-secondary/10 text-ink'
                    : 'border-line bg-surface text-muted-2 hover:text-muted',
                ].join(' ')}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      )}

      <section className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            {metric.label}
            {view.length !== series.length && (
              <span className="ml-1.5 text-muted-2/70">· {view.length} of {series.length}</span>
            )}
          </span>
          {view.length >= 2 && (
            <span
              className="font-display text-[12px] font-bold"
              style={{ color: delta.abs >= 0 ? C.green : C.accent }}
            >
              {delta.abs >= 0 ? '+' : ''}
              {delta.abs}
              {metric.unit}
              {delta.pct !== null && ` (${delta.pct >= 0 ? '+' : ''}${delta.pct}%)`}
            </span>
          )}
        </div>

        <div className="mt-1">
          <SparklineChart values={values} labels={labels} ats={ats} color={metric.color} unit={metric.unit} />
        </div>

        {series.length === 1 ? (
          <p className="mt-1 text-center text-[12px] text-muted-2">
            One session so far — log another to see the trend.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setDetail(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 py-2.5 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50"
          >
            Details
            <ChevronRight className="h-4 w-4 text-muted-2" />
          </button>
        )}
      </section>

      {detail && (
        <ChartDetailSheet
          name={name}
          series={view}
          metricKey={metricKey}
          onMetric={setMetricKey}
          onClose={() => setDetail(false)}
        />
      )}
    </div>
  );
}

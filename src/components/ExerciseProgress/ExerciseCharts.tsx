import { useState } from 'react';
import type { ProgressPoint } from '../../domain/progress';
import { seriesDelta } from '../../domain/progress';
import { ChevronRight } from '../common/icons';
import { SparklineChart } from './charts';
import { C } from './charts/chartUtils';
import { METRICS, metricFor } from './metrics';
import { ChartDetailSheet } from './ChartDetailSheet';

/**
 * The Charts tab: the minimal chart for the selected metric, with a Details
 * button that drills into the annotated area chart.
 */
export function ExerciseCharts({ name, series }: { name: string; series: ProgressPoint[] }) {
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
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
  const values = series.map(metric.pick);
  const labels = series.map((p) => p.label);
  const delta = seriesDelta(values);

  return (
    <div className="mt-4">
      {/* metric toggle — drives the chart and the drill-down */}
      <div className="flex gap-1.5 rounded-2xl border border-line bg-surface p-1.5">
        {METRICS.map((m) => {
          const on = m.key === metricKey;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetricKey(m.key)}
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
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            {metric.label}
          </span>
          {series.length >= 2 && (
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
          <SparklineChart values={values} labels={labels} color={metric.color} unit={metric.unit} />
        </div>

        {series.length === 1 ? (
          <p className="mt-1 text-center text-[12px] text-muted-2">
            One session so far — log another to see the trend.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setDetail(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 py-2.5 font-display text-[13px] font-bold text-ink transition-colors hover:border-accent/50"
          >
            Details
            <ChevronRight className="h-4 w-4 text-muted-2" />
          </button>
        )}
      </section>

      {detail && (
        <ChartDetailSheet
          name={name}
          series={series}
          metricKey={metricKey}
          onMetric={setMetricKey}
          onClose={() => setDetail(false)}
        />
      )}
    </div>
  );
}

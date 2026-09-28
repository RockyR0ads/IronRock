import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { FLEX_METRICS, latestBenchmark, type FlexMetric } from '../../domain/stretchSession';

const METRICS: FlexMetric[] = ['hamstring', 'hipflexor'];

/** Bottom-sheet to log a flexibility self-test (one value per metric per day). */
export function FlexCheck({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [metric, setMetric] = useState<FlexMetric>('hamstring');
  const [value, setValue] = useState('');
  const meta = FLEX_METRICS[metric];
  const last = latestBenchmark(state.stretch.benchmarks, metric);

  function save() {
    const v = parseFloat(value);
    if (Number.isNaN(v)) return;
    dispatch({ type: 'logFlex', at: new Date().toISOString().slice(0, 10), metric, value: v });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full rounded-t-3xl border-t border-line bg-surface p-5 pb-safe animate-sheet-up sm:max-w-[440px] sm:rounded-3xl sm:border">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">Flexibility check</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[18px] leading-none text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        {/* metric toggle */}
        <div className="flex gap-1 rounded-xl border border-line-2 bg-surface-2 p-1">
          {METRICS.map((m) => {
            const active = metric === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMetric(m);
                  setValue('');
                }}
                className={[
                  'flex-1 rounded-lg py-2 font-display text-[13px] font-bold transition-colors',
                  active ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {FLEX_METRICS[m].label}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">{meta.how}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={last ? String(last.value) : '0'}
              aria-label={`${meta.label} measurement`}
              className="h-12 w-full rounded-xl border border-line-2 bg-surface-2 pl-3 pr-12 font-mono text-[17px] font-bold text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-2">
              {meta.unit}
            </span>
          </div>
          <button
            type="button"
            onClick={save}
            className="h-12 shrink-0 rounded-xl bg-secondary px-5 font-display text-[14px] font-black uppercase text-bg shadow-glow transition-transform active:scale-[0.98]"
          >
            Save
          </button>
        </div>

        {last && (
          <p className="m-0 mt-2.5 font-mono text-[11px] text-muted-2">
            Last: {last.value} {meta.unit} · {last.at}
          </p>
        )}
      </div>
    </div>
  );
}

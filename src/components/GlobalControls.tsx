import { useStore } from '../state/StoreContext';
import type { Increment } from '../domain/types';

const INCREMENTS: Increment[] = [1, 2.5, 5];

export function GlobalControls() {
  const { state, dispatch } = useStore();

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-[120px] flex-1">
          <label
            htmlFor="bw"
            className="mb-1.5 block text-[12px] font-medium text-muted"
          >
            Bodyweight
          </label>
          <div className="relative">
            <input
              id="bw"
              type="number"
              inputMode="decimal"
              placeholder="90"
              value={state.bw}
              onChange={(e) => dispatch({ type: 'setBw', value: e.target.value })}
              className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 pl-3 pr-9 font-mono text-[15px] text-ink transition-colors focus:border-accent focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-2">
              kg
            </span>
          </div>
        </div>

        <div className="flex-1">
          <span className="mb-1.5 block text-[12px] font-medium text-muted">Round to</span>
          <div
            role="group"
            aria-label="Rounding increment"
            className="flex h-11 gap-1 rounded-xl border border-line-2 bg-surface-2 p-1"
          >
            {INCREMENTS.map((inc) => {
              const active = state.inc === inc;
              return (
                <button
                  key={inc}
                  type="button"
                  aria-pressed={active}
                  onClick={() => dispatch({ type: 'setInc', value: inc })}
                  className={[
                    'flex-1 rounded-lg font-mono text-[13px] transition-colors',
                    active
                      ? 'bg-ink font-bold text-bg'
                      : 'text-muted hover:bg-surface-3 hover:text-ink',
                  ].join(' ')}
                >
                  {inc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset the week? This clears every logged set across all days. Your references, exercise swaps, and last-session weights are kept.')) {
              dispatch({ type: 'resetWeek' });
            }
          }}
          className="text-[12px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
        >
          Reset week
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear ALL data — references, logged sets, exercise swaps, and history?')) {
              dispatch({ type: 'clearAll' });
            }
          }}
          className="text-[12px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}

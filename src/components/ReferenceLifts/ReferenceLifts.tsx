import { useStore } from '../../state/StoreContext';
import { computedInUse } from '../../state/store';
import { displayE1rm } from '../../state/selectors';
import { LIFTS } from '../../domain/lifts';
import type { RefSet } from '../../domain/types';

/** A reference set is max effort by definition, so there's no RPE to record. */
const FIELDS: { key: keyof RefSet; label: string; inputMode: 'decimal' | 'numeric'; step?: string }[] =
  [
    { key: 'w', label: 'Weight', inputMode: 'decimal' },
    { key: 'reps', label: 'Max reps', inputMode: 'numeric' },
  ];

function RefCard({ id }: { id: string }) {
  const { state, dispatch } = useStore();
  const lift = LIFTS[id];
  const ref = state.refs[id] ?? {};
  const e1rm = displayE1rm(state, id);
  const filled = e1rm !== null;

  return (
    <div
      className={[
        'rounded-2xl border bg-surface p-4 shadow-card transition-colors',
        filled ? 'border-accent/40' : 'border-line',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-display text-[15px] font-bold tracking-[-0.01em]">{lift.name}</div>
          <div className="mt-0.5 text-[12px] text-muted-2">{lift.unit}</div>
        </div>
        <span
          className={[
            'mt-1 h-2 w-2 shrink-0 rounded-full',
            filled ? 'bg-accent shadow-glow' : 'bg-line-2',
          ].join(' ')}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted-2">{f.label}</span>
            <input
              type="number"
              inputMode={f.inputMode}
              step={f.step}
              value={ref[f.key] ?? ''}
              placeholder="–"
              aria-label={`${lift.name} ${f.label}`}
              onChange={(e) =>
                dispatch({ type: 'setRef', id, field: f.key, value: e.target.value })
              }
              className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 text-center font-mono text-[16px] text-ink transition-colors placeholder:text-muted-2 focus:border-accent focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[12px] font-medium text-muted">Est. 1RM</span>
        <span
          className={[
            'font-mono text-[18px] font-bold tabular-nums',
            filled ? 'text-accent' : 'text-muted-2',
          ].join(' ')}
        >
          {filled ? `${e1rm}` : '—'}
          {filled && <span className="ml-1 text-[11px] font-medium text-muted">kg</span>}
        </span>
      </div>
    </div>
  );
}

export function ReferenceLifts() {
  const { state } = useStore();
  const ids = computedInUse(state);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ids.map((id) => (
        <RefCard key={id} id={id} />
      ))}
    </div>
  );
}

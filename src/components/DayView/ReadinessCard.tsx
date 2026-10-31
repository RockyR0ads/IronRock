import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { readinessAdjust, type Readiness } from '../../domain/insights';

const QUESTIONS: { key: keyof Readiness; label: string; low: string; high: string }[] = [
  { key: 'sleep', label: 'Sleep', low: 'Awful', high: 'Great' },
  { key: 'energy', label: 'Energy', low: 'Drained', high: 'Fired up' },
  { key: 'soreness', label: 'Soreness', low: 'Wrecked', high: 'Fresh' },
];

/**
 * Pre-workout check-in, shown until the first set is logged. A rough day eases
 * every target by ½–1 RPE for this session only; the card then collapses to a
 * one-line summary you can clear.
 */
export function ReadinessCard({ dayKey }: { dayKey: string }) {
  const { state, dispatch } = useStore();
  const saved = state.readiness?.[dayKey];
  const [r, setR] = useState<Partial<Readiness>>({});
  const [hidden, setHidden] = useState(false);

  if (saved) {
    const { label } = readinessAdjust(saved.r);
    return (
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px]">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${saved.adjust < 0 ? 'bg-orange' : 'bg-green'}`} />
        <span className="min-w-0 flex-1 text-muted">{label}</span>
        <button type="button" onClick={() => dispatch({ type: 'setReadiness', dayKey })} className="text-[12px] font-semibold text-muted-2 hover:text-ink">
          Redo
        </button>
      </div>
    );
  }
  if (hidden) return null;

  const complete = QUESTIONS.every((q) => r[q.key]);
  return (
    <div className="mb-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-bold">How are you today?</span>
        <button type="button" onClick={() => setHidden(true)} className="text-[12px] font-semibold text-muted-2 hover:text-ink">
          Skip
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="flex items-center gap-2">
            <span className="w-[68px] shrink-0 text-[12px] font-semibold text-muted">{q.label}</span>
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setR((x) => ({ ...x, [q.key]: n }))}
                  aria-label={`${q.label} ${n} of 5`}
                  aria-pressed={r[q.key] === n}
                  className={[
                    'h-8 flex-1 rounded-lg border font-mono text-[12px] font-bold',
                    r[q.key] === n ? 'border-accent bg-accent/15 text-accent' : 'border-line-2 bg-surface-2 text-muted',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between pl-[76px] text-[10px] text-muted-2">
        <span>1 = worst</span>
        <span>5 = best</span>
      </div>
      <button
        type="button"
        disabled={!complete}
        onClick={() => dispatch({ type: 'setReadiness', dayKey, r: r as Readiness })}
        className="mt-3 w-full rounded-xl bg-accent py-2.5 text-[13px] font-bold text-bg disabled:opacity-40"
      >
        Set today's targets
      </button>
    </div>
  );
}

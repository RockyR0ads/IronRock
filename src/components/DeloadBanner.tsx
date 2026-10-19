import { useStore } from '../state/StoreContext';
import { deloadStatus, isDeloadActive } from '../domain/deload';

/**
 * Surfaces the program's deload rule: prompts a deload week when one is due,
 * and shows a reminder while a deload week is active. A deload here means keep
 * your weights and halve your sets for the week — stated, not auto-applied, so
 * nothing rewrites your logged plan.
 */
export function DeloadBanner() {
  const { state, dispatch } = useStore();
  const active = isDeloadActive(state);

  if (active) {
    return (
      <div className="mb-3 rounded-2xl border border-secondary/40 bg-secondary/10 px-4 py-3">
        <div className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">
          Deload week
        </div>
        <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">
          Keep your weights the same and halve your sets this week. Back to normal next week.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'endDeload' })}
          className="mt-2 text-[11px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
        >
          End deload
        </button>
      </div>
    );
  }

  const status = deloadStatus(state);
  if (!status.due) return null;

  return (
    <div className="mb-3 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3">
      <div className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">
        Time for a deload?
      </div>
      <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">
        {status.reasons.join(', and ')}. A deload — same weights, half the sets, for one week —
        lets you recover and come back stronger.
      </p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: 'startDeload', at: new Date().toISOString() })}
          className="rounded-xl bg-accent px-3.5 py-2 font-display text-[13px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
        >
          Start deload week
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'snoozeDeload',
              until: new Date(Date.now() + 14 * 86_400_000).toISOString(),
            })
          }
          className="rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

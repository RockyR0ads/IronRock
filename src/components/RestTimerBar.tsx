import { useRestTimer } from '../state/RestTimer';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** Floating rest countdown shown above the day nav while a rest is running. */
export function RestTimerBar() {
  const { secondsLeft, duration, running, addTime, skip } = useRestTimer();
  if (!running && secondsLeft === 0) return null;

  const pct = duration > 0 ? Math.max(0, Math.min(100, (secondsLeft / duration) * 100)) : 0;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line-2 bg-surface-2/95 px-3 py-2 shadow-pop backdrop-blur-md">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">Rest</span>
      <button
        type="button"
        onClick={() => addTime(-15)}
        aria-label="Subtract 15 seconds"
        className="h-8 w-9 rounded-lg bg-surface-3 font-mono text-[12px] text-muted transition-colors hover:text-ink"
      >
        −15
      </button>
      <span className="min-w-[3.2ch] text-center font-mono text-[20px] font-bold tabular-nums text-green">
        {fmt(secondsLeft)}
      </span>
      <button
        type="button"
        onClick={() => addTime(15)}
        aria-label="Add 15 seconds"
        className="h-8 w-9 rounded-lg bg-surface-3 font-mono text-[12px] text-muted transition-colors hover:text-ink"
      >
        +15
      </button>
      <div className="mx-1 h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-green transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        onClick={skip}
        className="rounded-lg bg-surface-3 px-3 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:bg-line-2"
      >
        Skip
      </button>
    </div>
  );
}

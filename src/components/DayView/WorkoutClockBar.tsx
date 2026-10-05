import { useEffect, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { workoutStartedAt, fmtDuration } from '../../domain/workoutTiming';
import { ClockIcon } from '../common/icons';

/**
 * A slim elapsed-time bar that sticks to the top of the workout while it's on —
 * running from the first checked set until the day is completed (which clears
 * the logs, so the bar disappears). Honest wall-clock, not a metric.
 */
export function WorkoutClockBar({ dayKey }: { dayKey: string }) {
  const { state } = useStore();
  const start = workoutStartedAt(state.logs[dayKey] ?? []);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [start]);

  if (!start) return null;
  const elapsed = (now - Date.parse(start)) / 1000;

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-3 border-b border-line bg-bg/90 px-4 pt-safe backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[760px] items-center justify-center gap-2 py-2">
        <ClockIcon className="h-4 w-4 text-secondary" />
        <span className="font-mono text-[16px] font-bold tabular-nums text-ink">
          {fmtDuration(elapsed)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">workout</span>
      </div>
    </div>
  );
}

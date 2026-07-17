import { useEffect } from 'react';
import { volumeParts, type WorkoutStats } from '../domain/stats';
import { CheckIcon } from './common/icons';

function Tile({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 px-2 py-3.5 text-center">
      <div className="whitespace-nowrap font-display text-[22px] font-black tabular-nums leading-none tracking-[-0.02em] text-accent">
        {value}
        {unit && <span className="ml-0.5 text-[12px] font-bold text-muted-2">{unit}</span>}
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
        {label}
      </div>
    </div>
  );
}

/**
 * Post-workout summary: the totals for everything checked off, plus a
 * per-exercise breakdown. Shown over the day/freestyle view; closing it leaves
 * the logged sets untouched.
 */
export function WorkoutSummary({
  title,
  stats,
  archived = false,
  onClose,
}: {
  title: string;
  stats: WorkoutStats;
  /** The session was saved to history — say so, since the day just got cleared. */
  archived?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const empty = stats.sets === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workout summary"
      className="fixed inset-0 z-[60] flex flex-col bg-bg/95 backdrop-blur-sm animate-fade-in"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col px-5 pt-safe">
        <div className="pb-4 pt-8 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green text-bg shadow-glow">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h2 className="m-0 font-display text-[26px] font-black uppercase tracking-[-0.02em]">
            {empty ? 'Nothing logged' : 'Workout complete'}
          </h2>
          <p className="m-0 mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-2">
            {title}
          </p>
          {archived && (
            <p className="m-0 mt-2 text-[12px] text-green">Saved to your workout history.</p>
          )}
        </div>

        {empty ? (
          <p className="mx-auto max-w-[34ch] text-center text-[14px] leading-relaxed text-muted">
            Check a set off to count it towards your session. Nothing here is lost — your entered
            sets are still on the day.
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto pb-4">
            <div className="grid grid-cols-4 gap-2">
              <Tile value={String(stats.exercises.length)} label="Lifts" />
              <Tile value={String(stats.sets)} label="Sets" />
              <Tile value={String(stats.reps)} label="Reps" />
              <Tile {...volumeParts(stats.volume)} label="Volume" />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Tile value={stats.avgRpe !== null ? stats.avgRpe.toFixed(1) : '–'} label="Avg RPE" />
              <div className="min-w-0 rounded-2xl border border-line bg-surface-2 px-3 py-3.5 text-center">
                <div className="truncate font-display text-[15px] font-bold leading-none tracking-[-0.01em]">
                  {stats.topExercise?.name ?? '–'}
                </div>
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                  Top lift
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {stats.exercises.map((ex) => (
                <div
                  key={ex.name}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14px] font-bold tracking-[-0.01em]">
                      {ex.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-2">
                      {ex.sets} {ex.sets === 1 ? 'set' : 'sets'} · {ex.reps} reps
                      {ex.topSet && parseFloat(ex.topSet.w) > 0 && (
                        <> · top {ex.topSet.w}×{ex.topSet.reps}</>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-[13px] font-bold tabular-nums text-accent">
                      {volumeParts(ex.volume).value}
                      <span className="ml-0.5 text-muted-2">{volumeParts(ex.volume).unit}</span>
                    </div>
                    {ex.e1rm !== null && (
                      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-2">
                        e1RM {ex.e1rm}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-line py-4 pb-safe">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-full rounded-xl bg-accent py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] text-bg shadow-glow transition-transform active:scale-[0.99]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { useStore } from '../../state/StoreContext';
import { LIFTS, TOP_LIFTS } from '../../domain/lifts';
import { exerciseSeries } from '../../domain/progress';
import { ChevronLeft, ChevronRight, TrendIcon } from '../common/icons';

interface Row {
  id: string;
  name: string;
  sessions: number;
}

/**
 * Exercise picker for the charts feature: the top 30 lifts, with the ones you've
 * actually logged surfaced first.
 */
export function ExerciseSelector({
  onPick,
  onBack,
}: {
  onPick: (liftId: string) => void;
  onBack: () => void;
}) {
  const { state } = useStore();

  const { tracked, rest } = useMemo(() => {
    const rows: Row[] = TOP_LIFTS.filter((id) => LIFTS[id]).map((id) => ({
      id,
      name: LIFTS[id].name,
      sessions: exerciseSeries(state.sessions, id, state.inc).length,
    }));
    return {
      tracked: rows.filter((r) => r.sessions > 0).sort((a, b) => b.sessions - a.sessions),
      rest: rows.filter((r) => r.sessions === 0),
    };
  }, [state.sessions, state.inc]);

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the week"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Exercise charts
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Track a lift over time
          </div>
        </div>
      </header>

      <p className="mb-5 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        Pick an exercise to see how it's trending across your logged workouts — estimated 1RM, top
        set or volume, with a detailed breakdown a tap away.
      </p>

      {tracked.length > 0 && (
        <>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Your lifts
          </div>
          <div className="mb-6 flex flex-col gap-2">
            {tracked.map((r) => (
              <LiftRow key={r.id} row={r} onPick={onPick} />
            ))}
          </div>
        </>
      )}

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        {tracked.length > 0 ? 'All exercises' : 'Choose an exercise'}
      </div>
      <div className="flex flex-col gap-2">
        {rest.map((r) => (
          <LiftRow key={r.id} row={r} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function LiftRow({ row, onPick }: { row: Row; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(row.id)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-card transition-colors hover:border-accent/50"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            row.sessions > 0 ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted-2',
          ].join(' ')}
        >
          <TrendIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-bold tracking-[-0.01em]">
            {row.name}
          </span>
          <span className="text-[12px] text-muted-2">
            {row.sessions === 0
              ? 'No sessions yet'
              : `${row.sessions} session${row.sessions === 1 ? '' : 's'} logged`}
          </span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
    </button>
  );
}

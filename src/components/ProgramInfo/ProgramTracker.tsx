import { useStore } from '../../state/StoreContext';
import { programProgress, programCycle } from '../../domain/programTracker';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Tracks progression through the current program block: which week you're on,
 * how the block cycles toward its deload, and how consistently you're training.
 * Anchored to a start date the lifter sets, with counts read from the archive.
 */
export function ProgramTracker({ programId }: { programId: string }) {
  const { state, dispatch } = useStore();
  const cycle = programCycle(programId);
  const is531 = programId === 'wendler-531';
  const cycleLabel = is531 ? 'cycle' : 'block';

  // the tracker only makes sense for the program you're actually running
  if (state.activeProgram !== programId) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 p-4 text-center">
        <div className="font-display text-[15px] font-bold tracking-[-0.01em]">Not your active program</div>
        <p className="mx-auto mt-1 max-w-[40ch] text-[13px] leading-relaxed text-muted-2">
          Set this as your active program to track your {cycleLabel}-to-{cycleLabel} progress here.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'setActiveProgram', id: programId })}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          Set as active
        </button>
      </div>
    );
  }

  if (!state.programStart) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 p-4 text-center">
        <div className="font-display text-[15px] font-bold tracking-[-0.01em]">
          Track this {cycleLabel}
        </div>
        <p className="mx-auto mt-1 max-w-[40ch] text-[13px] leading-relaxed text-muted-2">
          Start a {cycle.cycleWeeks}-week {cycleLabel} and follow your week-to-week progress toward
          the deload.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'startProgram', at: new Date().toISOString() })}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          Start {cycleLabel}
        </button>
      </div>
    );
  }

  const p = programProgress(state.sessions, state.programStart, cycle);
  const pct = Math.min(100, Math.round((p.sessionsThisWeek / p.targetSessions) * 100));

  return (
    <div className="mt-4 rounded-2xl border border-accent/40 bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {is531 ? 'Cycle' : 'Block'} {p.block}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
              Week {p.weekInBlock}
            </span>
            {p.isDeload ? (
              <span className="rounded-md bg-yellow/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-yellow">
                Deload
              </span>
            ) : (
              <span className="font-mono text-[11px] text-muted-2">of {p.cycleWeeks}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[20px] font-black tabular-nums text-accent">
            {p.totalSessions}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-2">
            sessions
          </div>
        </div>
      </div>

      {/* week timeline for the current block */}
      <div className={`mt-4 grid gap-1.5 ${p.cycleWeeks === 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
        {Array.from({ length: p.cycleWeeks }, (_, i) => {
          const weekNum = i + 1;
          const deloadCell = weekNum === p.cycleWeeks;
          const current = weekNum === p.weekInBlock;
          const past = weekNum < p.weekInBlock;
          const count = p.weekCounts[i];
          return (
            <div
              key={weekNum}
              className={[
                'flex flex-col items-center gap-1 rounded-lg border py-2 transition-colors',
                current
                  ? 'border-accent bg-accent/10'
                  : deloadCell
                    ? 'border-yellow/40 bg-yellow/[0.06]'
                    : past
                      ? 'border-line bg-surface-2'
                      : 'border-line/50 bg-surface/40',
              ].join(' ')}
            >
              <span
                className={[
                  'font-mono text-[10px] font-bold uppercase tracking-[0.06em]',
                  current ? 'text-accent' : deloadCell ? 'text-yellow' : 'text-muted-2',
                ].join(' ')}
              >
                {deloadCell ? 'DL' : `W${weekNum}`}
              </span>
              <span
                className={[
                  'font-display text-[13px] font-black tabular-nums',
                  count > 0 ? (current ? 'text-ink' : 'text-muted') : 'text-muted-2/50',
                ].join(' ')}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* this week's session progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            This week
          </span>
          <span className="font-mono text-[12px] font-bold tabular-nums text-muted">
            {p.sessionsThisWeek}
            <span className="text-muted-2"> / {p.targetSessions} sessions</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full ${p.isDeload ? 'bg-yellow' : 'bg-accent'} transition-[width] duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* deload cue */}
      <p className="m-0 mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
        {p.isDeload ? (
          <>
            <strong className="text-yellow">Deload week.</strong>{' '}
            {is531
              ? 'Just the 40/50/60% sets, no AMRAP — then start a fresh cycle with higher Training Maxes.'
              : 'Same lifts, halve the working sets, cap everything at RPE 6, then start a fresh block.'}
          </>
        ) : (
          <>
            <strong className="text-ink">
              Deload in {p.weeksToDeload} week{p.weeksToDeload === 1 ? '' : 's'}.
            </strong>{' '}
            {is531
              ? 'Chase reps on the AMRAP top set each session — that’s where progress shows.'
              : 'Hold the line — same loads, let a rising RPE be the sign you’re leaning out.'}
          </>
        )}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-2">
          Started {fmtDate(state.programStart)}
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Restart the ${cycleLabel} from today? Your logged workouts are kept.`))
              dispatch({ type: 'startProgram', at: new Date().toISOString() });
          }}
          className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Restart {cycleLabel}
        </button>
      </div>
    </div>
  );
}

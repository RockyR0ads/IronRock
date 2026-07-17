import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { effBlocks, setsFor } from '../../state/store';
import { dayStats, isBlockComplete } from '../../state/selectors';
import { defaultDay } from '../../domain/program';
import { newSessionId } from '../../domain/session';
import type { WorkoutStats } from '../../domain/stats';
import { CheckIcon, PlusIcon } from '../common/icons';
import { ExerciseCard } from './ExerciseCard';
import { WorkoutSummary } from '../WorkoutSummary';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function DayView({
  onSwap,
  onAdd,
}: {
  onSwap: (index: number) => void;
  onAdd: () => void;
}) {
  const { state, dispatch } = useStore();
  const [summary, setSummary] = useState<WorkoutStats | null>(null);
  const day = defaultDay(state.day);
  const blocks = effBlocks(state, state.day);
  const customized = state.customDays[state.day] !== undefined;
  const hasLogs = (state.logs[state.day] ?? []).some((s) => s.length > 0);

  // Completion of every block, used to auto-advance to the next unfinished one.
  const completion = blocks.map((b, i) => isBlockComplete(b, setsFor(state, state.day, i)));
  const completionKey = completion.map((c) => (c ? '1' : '0')).join('');
  const allDone = blocks.length > 0 && completion.every(Boolean);
  const prev = useRef<{ day: string; comp: boolean[] } | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = { day: state.day, comp: completion };
    if (!before || before.day !== state.day) return; // skip first paint / day switches

    const justDone = completion.findIndex((c, i) => c && !before.comp[i]);
    if (justDone === -1) return;

    let next = -1;
    for (let k = justDone + 1; k < completion.length; k++)
      if (!completion[k]) {
        next = k;
        break;
      }
    if (next === -1)
      for (let k = 0; k < justDone; k++)
        if (!completion[k]) {
          next = k;
          break;
        }
    if (next === -1) return; // whole day complete

    const card = document.getElementById(`blk-${state.day}-${next}`);
    const addBtn = document.getElementById(`addset-${state.day}-${next}`);
    card?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    addBtn?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionKey, state.day]);

  if (!day) return null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 font-display text-[24px] font-black tracking-[-0.01em]">
            {day.label}
            <span className="ml-2 align-middle text-[14px] font-semibold uppercase tracking-[0.08em] text-accent">
              {day.variant}
            </span>
          </h3>
          <p className="m-0 mt-1 text-[13px] text-muted">{day.note}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {hasLogs && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all logged sets for this day?'))
                  dispatch({ type: 'clearDaySets', dayKey: state.day });
              }}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
            >
              Clear sets
            </button>
          )}
          {customized && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'restoreDay', dayKey: state.day })}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
            >
              Restore
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block, i) => (
          <ExerciseCard
            key={`${block.lift}-${i}`}
            block={block}
            index={i}
            dayKey={state.day}
            onSwap={onSwap}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3.5 font-display text-[14px] font-bold text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
      >
        <PlusIcon className="h-4 w-4" /> Add exercise
      </button>

      {hasLogs && (
        <button
          type="button"
          onClick={() => {
            // snapshot the stats before archiving — completing clears the day
            setSummary(dayStats(state, state.day));
            dispatch({
              type: 'completeWorkout',
              dayKey: state.day,
              title: day.label,
              at: new Date().toISOString(),
              id: newSessionId(),
            });
          }}
          className={[
            'mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] transition-transform active:scale-[0.99]',
            allDone
              ? 'bg-green text-bg shadow-glow'
              : 'border border-line-2 bg-surface text-ink hover:border-green/60',
          ].join(' ')}
        >
          <CheckIcon className="h-4 w-4" /> Complete workout
        </button>
      )}

      {summary && (
        <WorkoutSummary
          title={day.label}
          stats={summary}
          archived={summary.sets > 0}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  );
}

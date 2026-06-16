import { useEffect, useRef } from 'react';
import { useStore } from '../../state/StoreContext';
import { useRestTimer } from '../../state/RestTimer';
import { effBlocks, setsFor } from '../../state/store';
import { blockLoad, doneSetCount, isBlockComplete } from '../../state/selectors';
import { defaultDay } from '../../domain/program';
import { LIFTS } from '../../domain/lifts';
import { repLabel, feelLabel, rpeNum, isPerLeg } from '../../domain/format';
import { SwapIcon, TrashIcon, PlusIcon, CheckIcon } from '../common/icons';
import { PlateBar } from '../common/PlateBar';
import type { Block, BlockClass, LiftHistory, LoggedSet } from '../../domain/types';

/** Intensity → dot color. */
const DOT: Record<BlockClass, string> = {
  'r-hi': 'bg-red',
  'r-mid': 'bg-blue',
  'r-iso': 'bg-yellow',
};

/** Intensity → RPE chip color. */
const CHIP: Record<BlockClass, string> = {
  'r-hi': 'bg-red/15 text-red',
  'r-mid': 'bg-blue/15 text-blue',
  'r-iso': 'bg-yellow/15 text-yellow',
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Suggested values for the next set: carry over last set, else last session, else prescription. */
function prefillSet(
  block: Block,
  sets: LoggedSet[],
  targetLoad: number | null,
  history?: LiftHistory
): LoggedSet {
  const last = sets[sets.length - 1];
  if (last) return { w: last.w, reps: last.reps, rpe: last.rpe, done: false };
  if (history) return { ...history, done: false };
  const reps = Array.isArray(block.reps) ? block.reps[1] : block.reps;
  return {
    w: targetLoad !== null ? String(targetLoad) : '',
    reps: String(reps),
    rpe: String(rpeNum(block.rpe)),
    done: false,
  };
}

function SetInput({
  value,
  onChange,
  label,
  mode,
  step,
  done,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  mode: 'decimal' | 'numeric';
  step?: string;
  done: boolean;
}) {
  return (
    <input
      type="number"
      inputMode={mode}
      step={step}
      value={value}
      placeholder="–"
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      className={[
        'h-10 w-full rounded-lg border bg-surface-2 text-center font-mono text-[15px] text-ink transition-colors placeholder:text-muted-2 focus:outline-none',
        done ? 'border-green/40 focus:border-green' : 'border-line-2 focus:border-accent',
      ].join(' ')}
    />
  );
}

function BlockCard({
  block,
  index,
  dayKey,
  onSwap,
}: {
  block: Block;
  index: number;
  dayKey: string;
  onSwap: (index: number) => void;
}) {
  const { state, dispatch } = useStore();
  const rest = useRestTimer();
  const lift = LIFTS[block.lift];
  const perLeg = isPerLeg(block, lift.uni);
  const sets = setsFor(state, dayKey, index);
  const target = lift.type === 'computed' ? blockLoad(state, block) : null;
  const history = state.history[block.lift];
  const done = doneSetCount(sets);
  const complete = isBlockComplete(block, sets);
  const scheme = `${block.sets} × ${repLabel(block.reps)}${perLeg ? '/leg' : ''}`;

  // weight shown on the barbell glyph: the latest logged set, else the target
  const isBarbell = lift.unit === 'kg on bar';
  const lastWeight = sets.length ? parseFloat(sets[sets.length - 1].w) : NaN;
  const barWeight = lastWeight > 0 ? lastWeight : (target ?? 0);

  function toggleDone(setIndex: number) {
    const wasDone = sets[setIndex]?.done;
    dispatch({ type: 'toggleSetDone', dayKey, index, setIndex });
    if (!wasDone) rest.start(); // starting a rest when checking a set off
  }

  return (
    <div
      id={`blk-${dayKey}-${index}`}
      className={[
        'scroll-mt-4 rounded-2xl border p-4 shadow-card transition-colors',
        complete ? 'border-green/60 bg-green/[0.06]' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {complete ? (
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green text-bg"
                aria-label="Completed"
              >
                <CheckIcon className="h-3 w-3" />
              </span>
            ) : (
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[block.cls]}`} aria-hidden />
            )}
            <span className="truncate font-display text-[16px] font-bold tracking-[-0.01em]">
              {lift.name}
            </span>
          </div>

          {isBarbell && barWeight > 0 && <PlateBar weight={barWeight} />}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-muted">{scheme}</span>
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${CHIP[block.cls]}`}
            >
              {feelLabel(block)}
            </span>
            {target !== null && (
              <span className="font-mono text-[12px] text-muted-2">
                target {target} kg{perLeg ? '/side' : ''}
              </span>
            )}
          </div>

          {history && (
            <div className="mt-1 font-mono text-[11px] text-muted-2">
              Last {history.w || '–'} kg × {history.reps || '–'} @ RPE {history.rpe || '–'}
            </div>
          )}
        </div>

        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 font-mono text-[12px] font-bold tabular-nums',
            complete ? 'bg-green/15 text-green' : 'bg-surface-2 text-muted',
          ].join(' ')}
        >
          {done}/{block.sets}
        </span>
      </div>

      {/* logged sets */}
      {sets.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_2rem] gap-2 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-2">
            <span className="text-center">Set</span>
            <span className="text-center">kg</span>
            <span className="text-center">reps</span>
            <span className="text-center">rpe</span>
            <span />
          </div>
          {sets.map((set, si) => (
            <div key={si} className="grid grid-cols-[2.2rem_1fr_1fr_1fr_2rem] items-center gap-2">
              <button
                type="button"
                onClick={() => toggleDone(si)}
                aria-label={set.done ? `Set ${si + 1} done, tap to undo` : `Mark set ${si + 1} done`}
                aria-pressed={!!set.done}
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[13px] font-bold transition-colors',
                  set.done
                    ? 'bg-green text-bg'
                    : 'bg-surface-2 text-muted-2 hover:bg-surface-3 hover:text-ink',
                ].join(' ')}
              >
                {set.done ? <CheckIcon className="h-4 w-4" /> : si + 1}
              </button>
              <SetInput
                value={set.w}
                mode="decimal"
                done={!!set.done}
                label={`${lift.name} set ${si + 1} weight`}
                onChange={(v) =>
                  dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'w', value: v })
                }
              />
              <SetInput
                value={set.reps}
                mode="numeric"
                done={!!set.done}
                label={`${lift.name} set ${si + 1} reps`}
                onChange={(v) =>
                  dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'reps', value: v })
                }
              />
              <SetInput
                value={set.rpe}
                mode="decimal"
                step="0.5"
                done={!!set.done}
                label={`${lift.name} set ${si + 1} RPE`}
                onChange={(v) =>
                  dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'rpe', value: v })
                }
              />
              <button
                type="button"
                aria-label={`Remove set ${si + 1}`}
                onClick={() => dispatch({ type: 'removeSet', dayKey, index, setIndex: si })}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-2 transition-colors hover:bg-red/15 hover:text-red"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <button
          type="button"
          id={`addset-${dayKey}-${index}`}
          onClick={() =>
            dispatch({ type: 'addSet', dayKey, index, set: prefillSet(block, sets, target, history) })
          }
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-3"
        >
          <PlusIcon className="h-4 w-4" /> Add set
        </button>
        <button
          type="button"
          onClick={() => onSwap(index)}
          aria-label="Swap exercise"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <SwapIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'removeBlock', dayKey, index })}
          aria-label="Remove exercise"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted transition-colors hover:bg-red/15 hover:text-red"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DayView({
  onSwap,
  onAdd,
}: {
  onSwap: (index: number) => void;
  onAdd: () => void;
}) {
  const { state, dispatch } = useStore();
  const day = defaultDay(state.day);
  const blocks = effBlocks(state, state.day);
  const customized = state.customDays[state.day] !== undefined;
  const hasLogs = (state.logs[state.day] ?? []).some((s) => s.length > 0);

  // Completion of every block, used to auto-advance to the next unfinished one.
  const completion = blocks.map((b, i) => isBlockComplete(b, setsFor(state, state.day, i)));
  const completionKey = completion.map((c) => (c ? '1' : '0')).join('');
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
          <BlockCard
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
    </div>
  );
}

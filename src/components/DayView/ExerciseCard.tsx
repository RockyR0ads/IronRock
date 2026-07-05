import { useStore } from '../../state/StoreContext';
import { useRestTimer } from '../../state/RestTimer';
import { setsFor } from '../../state/store';
import { blockLoad, doneSetCount, isBlockComplete } from '../../state/selectors';
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

/**
 * One exercise: header (dot/name/plate-bar/progress), the logged-set grid, and
 * add/swap/remove actions. Shared between the program day view and the freestyle
 * workout. In `freestyle` mode the prescription (scheme / RPE / target) is hidden
 * and completion is "all logged sets checked" rather than a prescribed count.
 */
export function ExerciseCard({
  block,
  index,
  dayKey,
  onSwap,
  variant = 'program',
}: {
  block: Block;
  index: number;
  dayKey: string;
  onSwap: (index: number) => void;
  variant?: 'program' | 'freestyle';
}) {
  const { state, dispatch } = useStore();
  const rest = useRestTimer();
  const freestyle = variant === 'freestyle';
  const lift = LIFTS[block.lift];
  const perLeg = isPerLeg(block, lift.uni);
  const sets = setsFor(state, dayKey, index);
  const target = lift.type === 'computed' ? blockLoad(state, block) : null;
  const history = state.history[block.lift];
  const done = doneSetCount(sets);
  const complete = freestyle
    ? sets.length > 0 && done === sets.length
    : isBlockComplete(block, sets);
  const scheme = `${block.sets} × ${repLabel(block.reps)}${perLeg ? '/leg' : ''}`;
  const cardId = `blk-${dayKey}-${index}`;

  // weight shown on the barbell glyph: the most recent set with a weight
  // entered, else the computed target (so it shows before logging too)
  const isBarbell = lift.unit === 'kg on bar';
  const lastFilled = [...sets].reverse().find((s) => parseFloat(s.w) > 0);
  const barWeight = lastFilled ? parseFloat(lastFilled.w) : (target ?? 0);

  // rest countdown owned by this card → drain a green fill behind it
  const isResting = rest.running && rest.ownerId === cardId;
  const restPct = isResting && rest.duration > 0 ? (rest.secondsLeft / rest.duration) * 100 : 0;

  const showBadge = !freestyle || sets.length > 0;
  const badgeText = freestyle ? `${done}/${sets.length}` : `${done}/${block.sets}`;

  function toggleDone(setIndex: number) {
    const wasDone = sets[setIndex]?.done;
    dispatch({ type: 'toggleSetDone', dayKey, index, setIndex });
    if (!wasDone) rest.start(undefined, cardId); // starting a rest when checking a set off
  }

  return (
    <div
      id={cardId}
      className={[
        'relative overflow-hidden scroll-mt-4 rounded-2xl border p-4 shadow-card transition-colors',
        complete ? 'border-green/60 bg-green/[0.06]' : 'border-line bg-surface',
        isResting ? 'border-green/60' : '',
      ].join(' ')}
    >
      {isResting && (
        // a depleting green fill that recedes as the rest counts down, revealing
        // the card's normal background behind it
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-green/20 transition-[width] duration-1000 ease-linear"
          style={{ width: `${restPct}%` }}
          aria-hidden
        />
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
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
          <span className="min-w-0 shrink truncate font-display text-[16px] font-bold tracking-[-0.01em]">
            {lift.name}
          </span>
          {isBarbell && barWeight > 0 ? (
            <span className="min-w-[48px] flex-1">
              <PlateBar weight={barWeight} />
            </span>
          ) : (
            <span className="flex-1" />
          )}
          {showBadge && (
            <span
              className={[
                'shrink-0 rounded-full px-2.5 py-1 font-mono text-[12px] font-bold tabular-nums',
                complete ? 'bg-green/15 text-green' : 'bg-surface-2 text-muted',
              ].join(' ')}
            >
              {badgeText}
            </span>
          )}
        </div>

        {!freestyle && (
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
        )}

        {history && (
          <div className="mt-1 font-mono text-[11px] text-muted-2">
            Last {history.w || '–'} kg × {history.reps || '–'} @ RPE {history.rpe || '–'}
          </div>
        )}
      </div>

      {/* logged sets */}
      {sets.length > 0 && (
        <div className="relative z-10 mt-3 space-y-1.5">
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

      <div className="relative z-10 mt-3 flex items-center gap-2 border-t border-line pt-3">
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

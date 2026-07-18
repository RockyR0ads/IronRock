import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { useRestTimer } from '../../state/RestTimer';
import { setsFor, liftById } from '../../state/store';
import { blockLoad, doneSetCount, workingSetCount, isBlockComplete } from '../../state/selectors';
import { repLabel, feelLabel, rpeNum, rpeHue, isPerLeg } from '../../domain/format';
import { feelOption } from '../../domain/feel';
import { SwapIcon, TrashIcon, PlusIcon, CheckIcon } from '../common/icons';
import { PlateBar } from '../common/PlateBar';
import { RpePicker } from './RpePicker';
import { FeelPicker } from './FeelPicker';
import { FEEL_TONE } from '../common/feelTone';
import { useHoldMenu } from './useHoldMenu';
import type { Block, BlockClass, LiftHistory, LoggedSet, WarmupFeel } from '../../domain/types';

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

/**
 * The number a quick-step should nudge from: this cell's own value if it has
 * one, otherwise the previous set's same field (so an empty new set steps off
 * the last set), otherwise zero.
 */
function cellBase(sets: LoggedSet[], si: number, field: 'w' | 'reps' | 'rpe'): number {
  const own = parseFloat(sets[si]?.[field] ?? '');
  if (own > 0) return own;
  // step off the previous set of the same kind (working vs warm-up)
  const warm = !!sets[si]?.warmup;
  for (let i = si - 1; i >= 0; i--) {
    if (!!sets[i].warmup !== warm) continue;
    const prev = parseFloat(sets[i][field] ?? '');
    if (prev > 0) return prev;
  }
  return 0;
}

/** Suggested values for the next working set: carry the last one, else last session, else prescription. */
function prefillSet(
  block: Block,
  sets: LoggedSet[],
  targetLoad: number | null,
  history?: LiftHistory
): LoggedSet {
  const last = [...sets].reverse().find((s) => !s.warmup);
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

/** A new warm-up row: carry the last warm-up's weight/reps to ladder up, else blank. */
function prefillWarmup(sets: LoggedSet[]): LoggedSet {
  const last = [...sets].reverse().find((s) => s.warmup);
  return { w: last?.w ?? '', reps: last?.reps ?? '', rpe: '', warmup: true, done: false };
}

/**
 * One typed value in a logged set. Fills green once the set is checked off.
 * Tap to type; press and hold to reveal quick-step chips (see useHoldMenu),
 * so the next set's weight/reps can be nudged off the last without typing.
 */
function SetInput({
  value,
  onChange,
  label,
  mode,
  kind,
  base,
  done,
  warmup,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  mode: 'decimal' | 'numeric';
  kind: 'weight' | 'reps';
  /** Numeric base to step from: this cell's value, else the previous set's. */
  base: () => number;
  done: boolean;
  warmup: boolean;
}) {
  const hold = useHoldMenu({
    kind,
    base,
    onApply: onChange,
    onTap: (el) => {
      (el as HTMLInputElement).focus();
      (el as HTMLInputElement).select();
    },
  });

  return (
    <>
      <input
        type="number"
        inputMode={mode}
        value={value}
        placeholder="–"
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        {...hold.handlers}
        className={[
          'h-10 w-full select-none rounded-lg border text-center font-mono text-[15px] transition-colors placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-accent/70',
          done && warmup
            ? 'border-yellow/50 bg-yellow/15 text-yellow focus:border-yellow'
            : done
              ? 'border-green/50 bg-green/20 text-green focus:border-green'
              : 'border-line-2 bg-surface-2 text-ink focus:border-accent',
        ].join(' ')}
      />
      {hold.menu}
    </>
  );
}

/**
 * The RPE pill. A tap opens the scale picker; a press-and-hold reveals the same
 * quick-step chips as the other cells (±0.5 / +1), for a fast nudge without the
 * full picker. Its hue comes from the effort itself (green → red), so a hard
 * set reads as hard whether or not it's been ticked.
 */
function RpeButton({
  value,
  base,
  done,
  warmup,
  label,
  onOpen,
  onApply,
}: {
  value: string;
  base: () => number;
  done: boolean;
  warmup: boolean;
  label: string;
  onOpen: () => void;
  onApply: (v: string) => void;
}) {
  const rpe = parseFloat(value);
  const rated = rpe > 0;
  const hue = rated ? rpeHue(rpe) : 0;
  const hold = useHoldMenu({ kind: 'rpe', base, onApply, onTap: onOpen });

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={rated ? `${label}, currently ${value}` : `${label}, not rated`}
        {...hold.handlers}
        style={
          rated
            ? {
                backgroundColor: `hsl(${hue} 65% 45% / 0.22)`,
                borderColor: `hsl(${hue} 65% 55% / 0.55)`,
                color: `hsl(${hue} 85% 75%)`,
              }
            : undefined
        }
        className={[
          'h-10 w-full select-none rounded-lg border text-center font-mono text-[15px] transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70',
          rated
            ? ''
            : done && warmup
              ? 'border-yellow/50 bg-yellow/15 text-yellow'
              : done
                ? 'border-green/50 bg-green/20 text-green'
                : 'border-line-2 bg-surface-2 text-muted-2 hover:text-ink',
        ].join(' ')}
      >
        {rated ? value : '–'}
      </button>
      {hold.menu}
    </>
  );
}

/**
 * The warm-up feel cell — the warm-up stand-in for the RPE pill. Shows the feel
 * code (E/S/H) in its readiness colour, or a dash; tapping opens the chooser.
 */
function FeelButton({
  value,
  label,
  onOpen,
}: {
  value: WarmupFeel | undefined;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={value ? `${label}, currently ${feelOption(value).phrase}` : `${label}, not set`}
      className={[
        'h-10 w-full rounded-lg border text-center font-display text-[15px] font-black transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70',
        value ? FEEL_TONE[value] : 'border-line-2 bg-surface-2 text-muted-2 hover:text-ink',
      ].join(' ')}
    >
      {value ?? '–'}
    </button>
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
  const [rpeFor, setRpeFor] = useState<number | null>(null);
  const [feelFor, setFeelFor] = useState<number | null>(null);
  /** Index of the set that was just checked off, while its pop plays. */
  const [popped, setPopped] = useState<number | null>(null);
  const [cheer, setCheer] = useState(false);
  const wasComplete = useRef(false);
  const freestyle = variant === 'freestyle';
  const lift = liftById(state, block.lift);
  const perLeg = isPerLeg(block, lift.uni);
  const sets = setsFor(state, dayKey, index);
  const target = lift.type === 'computed' ? blockLoad(state, block) : null;
  const history = state.history[block.lift];
  const done = doneSetCount(sets); // working sets checked off (warm-ups excluded)
  const working = workingSetCount(sets);
  const complete = freestyle ? working > 0 && done === working : isBlockComplete(block, sets);
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

  const showBadge = !freestyle || working > 0;
  const badgeText = freestyle ? `${done}/${working}` : `${done}/${block.sets}`;

  function toggleDone(setIndex: number) {
    const wasDone = sets[setIndex]?.done;
    dispatch({ type: 'toggleSetDone', dayKey, index, setIndex });
    if (!wasDone) {
      rest.start(undefined, cardId); // starting a rest when checking a set off
      setPopped(setIndex);
    }
  }

  // the just-ticked row pops, then the class comes back off so it can fire again
  useEffect(() => {
    if (popped === null) return;
    const t = setTimeout(() => setPopped(null), 380);
    return () => clearTimeout(t);
  }, [popped]);

  // the card cheers on the transition into complete — not on every render while
  // it happens to be complete
  useEffect(() => {
    if (complete && !wasComplete.current) {
      setCheer(true);
      const t = setTimeout(() => setCheer(false), 660);
      wasComplete.current = complete;
      return () => clearTimeout(t);
    }
    wasComplete.current = complete;
  }, [complete]);

  return (
    <div
      id={cardId}
      className={[
        'relative overflow-hidden scroll-mt-4 rounded-2xl border p-4 shadow-card transition-colors',
        complete ? 'border-green/60 bg-green/[0.06]' : 'border-line bg-surface',
        isResting ? 'border-green/60' : '',
        cheer ? 'animate-card-cheer' : '',
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
          <div className="grid grid-cols-[2.2rem_1fr_3.25rem_3.5rem_2rem] gap-2 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-2">
            <span className="text-center">Set</span>
            <span className="text-center">kg</span>
            <span className="text-center">reps</span>
            <span className="text-center">rpe</span>
            <span />
          </div>
          {(() => {
            let wn = 0;
            return sets.map((set, si) => {
              const warm = !!set.warmup;
              if (!warm) wn += 1;
              const rowLabel = warm ? 'W' : wn;
              return (
                <div
                  key={si}
                  className={[
                    'grid grid-cols-[2.2rem_1fr_3.25rem_3.5rem_2rem] items-center gap-2 rounded-lg',
                    warm ? '-mx-1 bg-yellow/[0.05] px-1 py-0.5' : '',
                    popped === si ? 'animate-set-pop' : '',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => toggleDone(si)}
                    aria-label={
                      warm
                        ? `Warm-up set, ${set.done ? 'done, tap to undo' : 'mark done'}`
                        : set.done
                          ? `Set ${rowLabel} done, tap to undo`
                          : `Mark set ${rowLabel} done`
                    }
                    aria-pressed={!!set.done}
                    className={[
                      'flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[13px] font-bold transition-colors',
                      set.done && warm
                        ? 'bg-yellow text-bg'
                        : set.done
                          ? 'bg-green text-bg'
                          : warm
                            ? 'bg-yellow/15 text-yellow hover:bg-yellow/25'
                            : 'bg-surface-2 text-muted-2 hover:bg-surface-3 hover:text-ink',
                    ].join(' ')}
                  >
                    {set.done ? (
                      <CheckIcon className={`h-4 w-4 ${popped === si ? 'animate-check-pop' : ''}`} />
                    ) : (
                      rowLabel
                    )}
                  </button>
                  <SetInput
                    value={set.w}
                    mode="decimal"
                    kind="weight"
                    base={() => cellBase(sets, si, 'w')}
                    done={!!set.done}
                    warmup={warm}
                    label={`${lift.name} ${warm ? 'warm-up' : `set ${rowLabel}`} weight`}
                    onChange={(v) =>
                      dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'w', value: v })
                    }
                  />
                  <SetInput
                    value={set.reps}
                    mode="numeric"
                    kind="reps"
                    base={() => cellBase(sets, si, 'reps')}
                    done={!!set.done}
                    warmup={warm}
                    label={`${lift.name} ${warm ? 'warm-up' : `set ${rowLabel}`} reps`}
                    onChange={(v) =>
                      dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'reps', value: v })
                    }
                  />
                  {warm ? (
                    <FeelButton
                      value={set.feel}
                      label={`${lift.name} warm-up feel`}
                      onOpen={() => setFeelFor(si)}
                    />
                  ) : (
                    <RpeButton
                      value={set.rpe}
                      base={() => cellBase(sets, si, 'rpe')}
                      done={!!set.done}
                      warmup={warm}
                      label={`${lift.name} set ${rowLabel} RPE`}
                      onOpen={() => setRpeFor(si)}
                      onApply={(v) =>
                        dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'rpe', value: v })
                      }
                    />
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${warm ? 'warm-up' : `set ${rowLabel}`}`}
                    onClick={() => dispatch({ type: 'removeSet', dayKey, index, setIndex: si })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red transition-colors hover:bg-red/15"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            });
          })()}
        </div>
      )}

      <div className="relative z-10 mt-3 flex items-center gap-2 border-t border-line pt-3">
        <button
          type="button"
          id={`addset-${dayKey}-${index}`}
          onClick={() =>
            dispatch({ type: 'addSet', dayKey, index, set: prefillSet(block, sets, target, history) })
          }
          className="inline-flex flex-[3] items-center justify-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface-3"
        >
          <PlusIcon className="h-4 w-4" /> Add set
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'addSet', dayKey, index, set: prefillWarmup(sets) })}
          className="inline-flex flex-[2] items-center justify-center gap-1 rounded-lg border border-yellow/30 bg-yellow/10 px-2 py-2 text-[12px] font-semibold text-yellow transition-colors hover:bg-yellow/20"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Warm-up
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
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-red transition-colors hover:bg-red/15"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {rpeFor !== null && sets[rpeFor] && (
        <RpePicker
          title={`${lift.name} · set ${rpeFor + 1}`}
          value={parseFloat(sets[rpeFor].rpe) > 0 ? parseFloat(sets[rpeFor].rpe) : null}
          onPick={(rpe) => {
            dispatch({
              type: 'updateSet',
              dayKey,
              index,
              setIndex: rpeFor,
              field: 'rpe',
              value: String(rpe),
            });
            setRpeFor(null);
          }}
          onClear={() => {
            dispatch({ type: 'updateSet', dayKey, index, setIndex: rpeFor, field: 'rpe', value: '' });
            setRpeFor(null);
          }}
          onClose={() => setRpeFor(null)}
        />
      )}

      {feelFor !== null && sets[feelFor] && (
        <FeelPicker
          title={`${lift.name} · warm-up`}
          value={sets[feelFor].feel ?? null}
          onPick={(feel) => {
            dispatch({ type: 'setFeel', dayKey, index, setIndex: feelFor, value: feel });
            setFeelFor(null);
          }}
          onClear={() => {
            dispatch({ type: 'setFeel', dayKey, index, setIndex: feelFor, value: '' });
            setFeelFor(null);
          }}
          onClose={() => setFeelFor(null)}
        />
      )}
    </div>
  );
}

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useStore } from '../../state/StoreContext';
import { useRestTimer } from '../../state/RestTimer';
import { setsFor, liftById } from '../../state/store';
import type { Dispatch } from 'react';
import type { Action } from '../../state/store';
import { blockLoad, doneSetCount, workingSetCount, isBlockComplete } from '../../state/selectors';
import { repLabel, feelLabel, rpeNum, rpeHue, isPerLeg } from '../../domain/format';
import { feelOption } from '../../domain/feel';
import { SwapIcon, TrashIcon, PlusIcon, CheckIcon, ChevronRight, NoteIcon, ClockIcon } from '../common/icons';
import { PlateBar } from '../common/PlateBar';
import { heatColor } from '../common/warmupHeat';
import { barWeight as emptyBarWeight, autoRestOn, warmupSets } from '../../domain/exerciseConfig';
import { round } from '../../domain/calc';
import { RpePicker } from './RpePicker';
import { NoteSheet } from './NoteSheet';
import { hasSetDetail, setMarkerColor, setTypeMeta } from '../../domain/setTags';
import { FeelPicker } from './FeelPicker';
import { SetTypePicker } from './SetTypePicker';
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
 * Swipe a set row left to delete it. Engages only on clear horizontal intent so
 * vertical scrolling still works; once engaged it captures the pointer — even
 * from a number input — and reveals the red delete zone. Released past the
 * threshold, the row is removed.
 */
function useSwipeRow(onDelete: () => void) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const engaged = useRef(false);
  const offset = useRef(0);
  // did the gesture start on a button/input? if so the control already captured
  // the pointer — we must NOT steal it, or the control's tap never fires
  const onControl = useRef(false);

  const ENGAGE = 12;
  const DELETE_AT = 96;
  // only a gesture starting in the right part of the row can swipe-to-delete, so
  // editing the number / weight on the left never triggers an accidental delete
  const RIGHT_ZONE = 0.6;

  const move = (v: number) => {
    offset.current = v;
    setDx(v);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button > 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if ((e.clientX - rect.left) / rect.width < RIGHT_ZONE) {
      start.current = null; // started on the left — leave it for tapping/editing
      return;
    }
    start.current = { x: e.clientX, y: e.clientY };
    engaged.current = false;
    onControl.current = !!(e.target as HTMLElement).closest('button, input');
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const ddx = e.clientX - start.current.x;
    const ddy = e.clientY - start.current.y;
    if (!engaged.current) {
      if (Math.abs(ddx) > ENGAGE && Math.abs(ddx) > Math.abs(ddy) * 1.3) {
        engaged.current = true;
        setDragging(true);
        // only take capture when the gesture didn't begin on a control; when it
        // did, the control holds capture and the row still gets bubbled moves
        if (!onControl.current) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* capture unsupported */
          }
        }
      } else if (Math.abs(ddy) > ENGAGE) {
        start.current = null; // vertical — let the page scroll
        return;
      } else {
        return;
      }
    }
    move(Math.max(-140, Math.min(0, ddx))); // left only, clamped
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing captured */
    }
    const del = engaged.current && offset.current <= -DELETE_AT;
    start.current = null;
    engaged.current = false;
    setDragging(false);
    move(0);
    if (del) onDelete();
  };

  return {
    dx,
    dragging,
    past: dx <= -DELETE_AT,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
    },
  };
}

/** A set row that slides left over a red delete zone; past the threshold it deletes. */
function SwipeRow({
  onDelete,
  popped,
  gridCols,
  rowBg,
  children,
}: {
  onDelete: () => void;
  popped: boolean;
  gridCols: string;
  /** Full-row background wash for this set's state (done / warm-up tone). */
  rowBg?: string;
  children: ReactNode;
}) {
  const swipe = useSwipeRow(onDelete);
  const swiping = swipe.dx < 0;

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className={[
          'pointer-events-none absolute inset-0 flex items-center justify-end gap-1.5 rounded-lg pr-4 text-bg transition-colors',
          swipe.past ? 'bg-red' : 'bg-red/70',
        ].join(' ')}
        style={{ opacity: swiping ? 1 : 0 }}
        aria-hidden
      >
        <TrashIcon className="h-5 w-5" />
        <span className="font-display text-[13px] font-bold uppercase tracking-[-0.01em]">
          {swipe.past ? 'Release' : 'Delete'}
        </span>
      </div>
      <div
        {...swipe.handlers}
        style={{
          transform: `translateX(${swipe.dx}px)`,
          transition: swipe.dragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
          backgroundColor: swiping ? '#16181C' : rowBg,
        }}
        className={[
          'grid items-center gap-2 rounded-[10px] px-1 py-0.5',
          gridCols,
          popped ? 'animate-set-pop' : '',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

/** Seconds → "m:ss" (or "h:mm:ss" past an hour), for the live rest/elapsed clock. */
function clock(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

/**
 * The number a quick-step should nudge from: this cell's own value if it has
 * one, otherwise the previous set's same field (so an empty new set steps off
 * the last set), otherwise zero.
 */
function cellBase(sets: LoggedSet[], si: number, field: 'w' | 'reps' | 'rpe' | 'repsR'): number {
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
  history?: LiftHistory,
  perSideDefault = false
): LoggedSet {
  const last = [...sets].reverse().find((s) => !s.warmup);
  if (last) {
    // a new row inherits the previous set's per-side choice
    const side = last.perSide ? { perSide: true, repsR: last.repsR ?? '' } : {};
    return { w: last.w, reps: last.reps, rpe: last.rpe, done: false, ...side };
  }
  const side = perSideDefault ? { perSide: true, repsR: '' } : {};
  if (history) return { ...history, done: false, ...side };
  const reps = Array.isArray(block.reps) ? block.reps[1] : block.reps;
  return {
    w: targetLoad !== null ? String(targetLoad) : '',
    reps: String(reps),
    rpe: String(rpeNum(block.rpe)),
    done: false,
    ...side,
  };
}

/** A new warm-up row: carry the last warm-up's weight/reps to ladder up, else blank. */
function prefillWarmup(sets: LoggedSet[], perSideDefault = false): LoggedSet {
  const last = [...sets].reverse().find((s) => s.warmup);
  const side = last?.perSide
    ? { perSide: true, repsR: last.repsR ?? '' }
    : perSideDefault
      ? { perSide: true, repsR: '' }
      : {};
  return { w: last?.w ?? '', reps: last?.reps ?? '', rpe: '', warmup: true, done: false, ...side };
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
  warmTone,
  compact,
  extra,
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
  /** Warm-up heat colour (hex) for this set's position in the ramp. */
  warmTone?: string;
  /** Narrower styling for the half-width per-side reps inputs. */
  compact?: boolean;
  /** Extra menu toggle, e.g. the per-side switch. */
  extra?: { label: string; on: boolean; onSelect: () => void };
}) {
  const hold = useHoldMenu({
    kind,
    base,
    onApply: onChange,
    onTap: (el) => {
      (el as HTMLInputElement).focus();
      (el as HTMLInputElement).select();
    },
    extra,
  });

  // warm-up rows carry their heat colour: a soft tint once done (matching the
  // working-set treatment), a fainter border tint before, so the ramp reads
  // even on empty cells
  const warm = warmup && warmTone;
  const warmStyle = warm
    ? done
      ? { backgroundColor: `${warmTone}40`, color: warmTone }
      : { backgroundColor: `${warmTone}22` }
    : undefined;

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
        style={warmStyle}
        className={[
          'h-11 w-full select-none rounded-[9px] text-center font-mono font-bold transition-colors placeholder:font-normal placeholder:text-muted-2 focus:outline-none focus:ring-2 focus:ring-secondary/70',
          compact ? 'px-0 text-[13px]' : 'text-[15px]',
          warm
            ? done
              ? '' // colour comes from warmStyle (tinted)
              : 'text-ink' // faint warm tint comes from warmStyle
            : done
              ? 'bg-green/20 text-green'
              : 'bg-surface-2 text-ink',
        ].join(' ')}
      />
      {hold.menu}
    </>
  );
}

/**
 * The reps cell. Normally one input; in per-side mode it splits into two
 * half-width inputs — left and right. Each input keeps its quick-step menu
 * (hold to nudge); that menu carries the Split / Merge toggle, so per-side is a
 * per-set choice reached without losing the reps quick-step.
 */
function RepsCell({
  set,
  perSide,
  done,
  warmup,
  warmTone,
  label,
  onLeft,
  onRight,
  onToggle,
  baseLeft,
  baseRight,
}: {
  set: LoggedSet;
  perSide: boolean;
  done: boolean;
  warmup: boolean;
  warmTone?: string;
  label: string;
  onLeft: (v: string) => void;
  onRight: (v: string) => void;
  onToggle: () => void;
  baseLeft: () => number;
  baseRight: () => number;
}) {
  const toggle = { label: 'Per side', on: perSide, onSelect: onToggle };

  if (!perSide) {
    return (
      <SetInput
        value={set.reps}
        mode="numeric"
        kind="reps"
        base={baseLeft}
        done={done}
        warmup={warmup}
        warmTone={warmTone}
        label={`${label} reps`}
        onChange={onLeft}
        extra={toggle}
      />
    );
  }
  return (
    <div className="flex gap-1">
      <SetInput
        value={set.reps}
        mode="numeric"
        kind="reps"
        base={baseLeft}
        done={done}
        warmup={warmup}
        warmTone={warmTone}
        compact
        label={`${label} left reps`}
        onChange={onLeft}
        extra={toggle}
      />
      <SetInput
        value={set.repsR ?? ''}
        mode="numeric"
        kind="reps"
        base={baseRight}
        done={done}
        warmup={warmup}
        warmTone={warmTone}
        compact
        label={`${label} right reps`}
        onChange={onRight}
        extra={toggle}
      />
    </div>
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
  label,
  onOpen,
  onApply,
}: {
  value: string;
  base: () => number;
  done: boolean;
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
          // once a working set is done, the RPE settles into the row's green
          // rather than keeping its effort hue — one calm colour per done row
          rated && !done
            ? {
                backgroundColor: `hsl(${hue} 60% 45% / 0.14)`,
                color: `hsl(${hue} 70% 68%)`,
              }
            : undefined
        }
        className={[
          'h-11 w-full select-none rounded-[9px] text-center font-mono text-[15px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/70',
          rated
            ? done
              ? 'bg-green/20 text-green'
              : ''
            : done
              ? 'bg-green/20 text-green'
              : 'bg-surface-2 text-muted-2 hover:text-ink',
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
        'h-11 w-full rounded-[9px] text-center font-display text-[15px] font-black transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/70',
        value ? FEEL_TONE[value] : 'bg-surface-2 text-muted-2 hover:text-ink',
      ].join(' ')}
    >
      {value ?? '–'}
    </button>
  );
}

/**
 * The slot's exercise chooser: a chip per interchangeable option, the active one
 * highlighted. Tapping another switches the slot for the day (a free choice, not
 * a program deviation); a chip's × removes that option from the slot. A trailing
 * ＋ opens the picker to attach another. Shown only when the slot has options.
 */
function OptionsBar({
  block,
  dayKey,
  index,
  dispatch,
  state,
  onAddOption,
}: {
  block: Block;
  dayKey: string;
  index: number;
  dispatch: Dispatch<Action>;
  state: ReturnType<typeof useStore>['state'];
  onAddOption?: (index: number) => void;
}) {
  const pool = block.pool ?? [];
  if (pool.length < 2 && !onAddOption) return null;
  if (pool.length < 2) return null; // nothing to choose yet — add lives in the swap picker

  return (
    <div className="relative z-10 mt-2.5 flex flex-wrap gap-1.5" data-nodrag>
      {pool.map((id) => {
        const active = id === block.lift;
        const name = liftById(state, id).name;
        return (
          <span
            key={id}
            className={[
              'group inline-flex items-center rounded-full border text-[12px] font-semibold transition-colors',
              active
                ? 'border-secondary/50 bg-secondary/15 text-secondary'
                : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => !active && dispatch({ type: 'pickOption', dayKey, index, liftId: id })}
              aria-pressed={active}
              aria-label={active ? `${name}, current option` : `Switch this slot to ${name}`}
              className="max-w-[46vw] truncate py-1.5 pl-3 pr-2"
            >
              {name}
            </button>
            {!active && (
              <button
                type="button"
                aria-label={`Remove ${name} option`}
                onClick={() => {
                  if (confirm(`Remove ${name} as an option for this slot?`))
                    dispatch({ type: 'removeOption', dayKey, index, liftId: id });
                }}
                className="flex h-7 w-6 items-center justify-center rounded-r-full text-[14px] leading-none text-muted-2 hover:text-red"
              >
                ×
              </button>
            )}
          </span>
        );
      })}
      {onAddOption && (
        <button
          type="button"
          onClick={() => onAddOption(index)}
          aria-label="Add another exercise option to this slot"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-2 px-2.5 py-1.5 text-[12px] font-semibold text-muted-2 transition-colors hover:border-secondary/50 hover:text-secondary"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Option
        </button>
      )}
    </div>
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
  onOpenExercise,
  onAddOption,
  variant = 'program',
}: {
  block: Block;
  index: number;
  dayKey: string;
  onSwap: (index: number) => void;
  /** Open this lift's exercise page (history, records, settings). */
  onOpenExercise?: (liftId: string) => void;
  /** Open the picker to attach another exercise option to this slot. */
  onAddOption?: (index: number) => void;
  variant?: 'program' | 'freestyle';
}) {
  const { state, dispatch } = useStore();
  const rest = useRestTimer();
  const [rpeFor, setRpeFor] = useState<number | null>(null);
  const [feelFor, setFeelFor] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [typeFor, setTypeFor] = useState<number | null>(null);
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
  // if any set logs reps per side, widen the reps column and split its header
  const anyPerSide = sets.some((s) => s.perSide);
  const gridCols = anyPerSide
    ? 'grid-cols-[2rem_1.7rem_1fr_5rem_2.9rem_2.75rem]'
    : 'grid-cols-[2rem_1.7rem_1fr_3.75rem_2.9rem_2.75rem]';

  // weight shown on the barbell glyph: the most recent set with a weight
  // entered, else the computed target (so it shows before logging too)
  const isBarbell = lift.unit === 'kg on bar';
  const cfg = state.exerciseConfig[block.lift];
  const emptyBar = emptyBarWeight(cfg);
  const cfgInc = cfg?.inc ?? state.inc;
  const perSideDefault = !!cfg?.perSideDefault && isPerLeg(block, lift.uni);
  const lastFilled = [...sets].reverse().find((s) => parseFloat(s.w) > 0);
  const barWeight = lastFilled ? parseFloat(lastFilled.w) : (target ?? 0);
  // a configured warm-up ramp can fill the warm-up sets in one tap, before any
  // warm-ups have been added
  const rampSets =
    cfg?.warmupRamp && !sets.some((s) => s.warmup)
      ? warmupSets(cfg.warmupRamp, barWeight, (w) => round(w, cfgInc))
      : [];

  // rest countdown owned by this card → drain a green fill behind it
  const isResting = rest.running && rest.ownerId === cardId;
  const restPct = isResting && rest.duration > 0 ? (rest.secondsLeft / rest.duration) * 100 : 0;

  const showBadge = !freestyle || working > 0;
  const badgeText = freestyle ? `${done}/${working}` : `${done}/${block.sets}`;

  function toggleDone(setIndex: number) {
    const wasDone = sets[setIndex]?.done;
    dispatch({ type: 'toggleSetDone', dayKey, index, setIndex, at: new Date().toISOString() });
    if (!wasDone && autoRestOn(cfg)) {
      rest.start(cfg?.restSeconds, cardId); // per-exercise rest, or the default

      setPopped(setIndex);
    }
  }

  // the just-ticked row pops, then the class comes back off so it can fire again
  useEffect(() => {
    if (popped === null) return;
    const t = setTimeout(() => setPopped(null), 380);
    return () => clearTimeout(t);
  }, [popped]);

  // --- live rest / elapsed clock -------------------------------------------
  // anchor the clock to the most recent set completion, else the exercise start
  const startedAt = state.exerciseStart[dayKey]?.[index];
  const lastDoneAt = sets.reduce<string | undefined>(
    (mx, s) => (s.done && s.at && (!mx || s.at > mx) ? s.at : mx),
    undefined
  );
  const anchor = lastDoneAt ?? startedAt;
  const clockRunning = !!anchor && !complete;
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    if (!clockRunning) return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [clockRunning, anchor]);
  const elapsedSecs = clockRunning && anchor ? (nowTs - Date.parse(anchor)) / 1000 : 0;
  const resting = clockRunning && !!lastDoneAt; // rest between sets vs pre-first-set warm-up

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
          {onOpenExercise ? (
            <button
              type="button"
              onClick={() => onOpenExercise(block.lift)}
              aria-label={`Open ${lift.name} exercise page`}
              className="group flex min-w-0 shrink items-center gap-1 text-left"
            >
              <span className="min-w-0 truncate font-display text-[16px] font-bold tracking-[-0.01em] transition-colors group-hover:text-secondary">
                {lift.name}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-2 transition-colors group-hover:text-secondary" />
            </button>
          ) : (
            <span className="min-w-0 shrink truncate font-display text-[16px] font-bold tracking-[-0.01em]">
              {lift.name}
            </span>
          )}
          {isBarbell && barWeight > 0 ? (
            <span className="min-w-[48px] flex-1">
              <PlateBar weight={barWeight} bar={emptyBar} />
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

      {!freestyle && (
        <OptionsBar
          block={block}
          dayKey={dayKey}
          index={index}
          dispatch={dispatch}
          state={state}
          onAddOption={onAddOption}
        />
      )}

      {/* logged sets */}
      {sets.length > 0 && (
        <div className="relative z-10 mt-3 space-y-1.5">
          <div className={`grid ${gridCols} gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-2`}>
            <span className="text-center">Set</span>
            <span aria-hidden />
            <span className="text-center">kg</span>
            {anyPerSide ? (
              <span className="flex items-center justify-between px-1">
                <span className="text-accent">L</span>
                <span>reps</span>
                <span className="text-accent">R</span>
              </span>
            ) : (
              <span className="text-center">reps</span>
            )}
            <span className="text-center">rpe</span>
            <span className="text-center">done</span>
          </div>
          {(() => {
            let wn = 0;
            let warmN = 0;
            return sets.map((set, si) => {
              const warm = !!set.warmup;
              if (!warm) wn += 1;
              else warmN += 1;
              const rowLabel = warm ? 'W' : wn;
              // each warm-up set gets its colour from the heating-up ramp
              const warmTone = warm ? heatColor(warmN - 1) : undefined;
              // faint full-row wash matching the set's state (done green / warm tone)
              const rowBg = warm
                ? warmTone
                  ? `${warmTone}14`
                  : undefined
                : set.done
                  ? '#41C27712'
                  : undefined;
              // special set type (drop / failure / rest-pause / myo) — working sets only
              const typeMeta = warm ? undefined : setTypeMeta(set.type);
              return (
                <SwipeRow
                  key={si}
                  popped={popped === si}
                  gridCols={gridCols}
                  rowBg={rowBg}
                  onDelete={() => dispatch({ type: 'removeSet', dayKey, index, setIndex: si })}
                >
                  {warm ? (
                    <span
                      className="select-none text-center font-mono text-[13px] font-bold tabular-nums"
                      style={{ color: warmTone }}
                      aria-hidden
                    >
                      {rowLabel}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTypeFor(si)}
                      aria-label={
                        typeMeta
                          ? `Set ${rowLabel}, ${typeMeta.label} — change set type`
                          : `Set ${rowLabel} — set type`
                      }
                      className="flex h-11 select-none items-center justify-center rounded-lg font-mono text-[13px] font-bold tabular-nums transition-colors hover:bg-surface-2"
                      style={typeMeta ? { color: typeMeta.color } : undefined}
                    >
                      <span className={typeMeta ? '' : 'text-muted-2'}>
                        {typeMeta ? typeMeta.short : rowLabel}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNoteFor(si)}
                    aria-label={
                      hasSetDetail(set)
                        ? `Edit log for ${warm ? 'warm-up' : `set ${rowLabel}`}`
                        : `Log details for ${warm ? 'warm-up' : `set ${rowLabel}`}`
                    }
                    className={[
                      'relative flex h-11 items-center justify-center rounded-lg transition-colors',
                      hasSetDetail(set)
                        ? 'text-secondary hover:text-secondary-deep'
                        : 'text-muted-2 hover:text-muted',
                    ].join(' ')}
                  >
                    <NoteIcon lines={hasSetDetail(set)} className="h-[18px] w-[18px]" />
                    {setMarkerColor(set) && (
                      <span
                        className="absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: setMarkerColor(set)! }}
                        aria-hidden
                      />
                    )}
                  </button>
                  <SetInput
                    value={set.w}
                    mode="decimal"
                    kind="weight"
                    base={() => cellBase(sets, si, 'w')}
                    done={!!set.done}
                    warmup={warm}
                    warmTone={warmTone}
                    label={`${lift.name} ${warm ? 'warm-up' : `set ${rowLabel}`} weight`}
                    onChange={(v) =>
                      dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'w', value: v })
                    }
                  />
                  <RepsCell
                    set={set}
                    perSide={!!set.perSide}
                    done={!!set.done}
                    warmup={warm}
                    warmTone={warmTone}
                    label={`${lift.name} ${warm ? 'warm-up' : `set ${rowLabel}`}`}
                    baseLeft={() => cellBase(sets, si, 'reps')}
                    baseRight={() => cellBase(sets, si, 'repsR')}
                    onLeft={(v) =>
                      dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'reps', value: v })
                    }
                    onRight={(v) =>
                      dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'repsR', value: v })
                    }
                    onToggle={() => dispatch({ type: 'toggleSetPerSide', dayKey, index, setIndex: si })}
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
                      label={`${lift.name} set ${rowLabel} RPE`}
                      onOpen={() => setRpeFor(si)}
                      onApply={(v) =>
                        dispatch({ type: 'updateSet', dayKey, index, setIndex: si, field: 'rpe', value: v })
                      }
                    />
                  )}
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
                    style={
                      warm
                        ? set.done
                          ? { backgroundColor: warmTone, borderColor: warmTone }
                          : { borderColor: `${warmTone}66`, color: warmTone }
                        : undefined
                    }
                    className={[
                      'flex h-11 w-11 items-center justify-center justify-self-center rounded-[9px] transition-colors',
                      warm
                        ? set.done
                          ? 'text-bg'
                          : 'bg-surface-2'
                        : set.done
                          ? 'bg-green text-bg'
                          : 'bg-surface-2 text-muted-2 hover:bg-surface-3 hover:text-ink',
                    ].join(' ')}
                  >
                    <CheckIcon
                      className={[
                        'h-4 w-4',
                        set.done ? (popped === si ? 'animate-check-pop' : '') : 'opacity-40',
                      ].join(' ')}
                    />

                  </button>
                </SwipeRow>
              );
            });
          })()}
        </div>
      )}

      {!complete &&
        (anchor ? (
          <div
            className="relative z-10 mt-3 flex items-center justify-center gap-1.5 font-mono text-[12px]"
            data-nodrag
          >
            <span className={resting ? 'text-secondary' : 'text-muted-2'}>
              {resting ? 'Rested' : 'Elapsed'}
            </span>
            <span className="font-bold tabular-nums text-ink">{clock(elapsedSecs)}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'startExercise', dayKey, index, at: new Date().toISOString() })
            }
            className="relative z-10 mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-2 py-2 font-display text-[13px] font-bold text-muted transition-colors hover:border-secondary/50 hover:text-secondary"
          >
            <ClockIcon className="h-4 w-4" /> Start exercise
          </button>
        ))}

      <div className="relative z-10 mt-3 flex items-center gap-2 border-t border-line pt-3">
        <button
          type="button"
          id={`addset-${dayKey}-${index}`}
          onClick={() =>
            dispatch({
              type: 'addSet',
              dayKey,
              index,
              set: prefillSet(block, sets, target, history, perSideDefault),
            })
          }
          className="inline-flex flex-[3] items-center justify-center gap-1.5 rounded-lg bg-secondary/15 px-3 py-2 text-[13px] font-semibold text-secondary transition-colors hover:bg-secondary/25"
        >
          <PlusIcon className="h-4 w-4" /> Add set
        </button>
        {rampSets.length > 0 ? (
          <button
            type="button"
            onClick={() =>
              rampSets.forEach((r) =>
                dispatch({
                  type: 'addSet',
                  dayKey,
                  index,
                  set: {
                    w: String(r.w),
                    reps: String(r.reps),
                    rpe: '',
                    warmup: true,
                    done: false,
                    ...(perSideDefault ? { perSide: true, repsR: '' } : {}),
                  },
                })
              )
            }
            className="inline-flex flex-[2] items-center justify-center gap-1 rounded-lg border border-yellow/30 bg-yellow/10 px-2 py-2 text-[12px] font-semibold text-yellow transition-colors hover:bg-yellow/20"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Ramp up
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'addSet', dayKey, index, set: prefillWarmup(sets, perSideDefault) })
            }
            className="inline-flex flex-[2] items-center justify-center gap-1 rounded-lg border border-yellow/30 bg-yellow/10 px-2 py-2 text-[12px] font-semibold text-yellow transition-colors hover:bg-yellow/20"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Warm-up
          </button>
        )}
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

      {noteFor !== null && sets[noteFor] && (
        <NoteSheet
          title={`${lift.name} · set ${noteFor + 1}`}
          set={sets[noteFor]}
          onSave={(patch) => {
            dispatch({
              type: 'patchSet',
              dayKey,
              index,
              setIndex: noteFor,
              patch: { note: patch.note || undefined, quality: patch.quality, flags: patch.flags.length ? patch.flags : undefined },
            });
            setNoteFor(null);
          }}
          onClose={() => setNoteFor(null)}
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

      {typeFor !== null && sets[typeFor] && (
        <SetTypePicker
          title={`${lift.name} · set ${typeFor + 1}`}
          value={sets[typeFor].type}
          onPick={(t) => {
            dispatch({ type: 'patchSet', dayKey, index, setIndex: typeFor, patch: { type: t } });
            setTypeFor(null);
          }}
          onClose={() => setTypeFor(null)}
        />
      )}
    </div>
  );
}

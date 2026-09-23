import { DAYS, defaultDay } from '../domain/program';
import { LIFTS } from '../domain/lifts';
import { LIBRARY_BY_ID, libraryLift } from '../domain/library';
import { meaningfulSet } from '../domain/session';
import { DEFAULT_PROGRAM } from '../domain/programs';
import type { ExerciseConfig } from '../domain/exerciseConfig';
import type { WeighIn, WeightGoal } from '../domain/weightTracker';
import type { Profile } from '../domain/calories';
import { DEFAULT_THEME, type ThemeChoice } from '../domain/theme';
import { getStorageHealth, markLoadFailed, markQuotaFailed } from './storageHealth';
import type {
  Block,
  Increment,
  Lift,
  LiftHistory,
  LoggedSet,
  RefSet,
  Session,
  WarmupFeel,
} from '../domain/types';

/** A user-created exercise. */
export interface CustomLift {
  name: string;
  unit: string;
  group: string;
}

export interface State {
  /** Reference sets per computed lift id. */
  refs: Record<string, RefSet>;
  /** Entered weights per manual lift id (raw input strings). */
  manual: Record<string, string>;
  /** User-created exercises, keyed by id. */
  customLifts: Record<string, CustomLift>;
  /** Per-exercise settings (rest, bar type, …), keyed by lift id. */
  exerciseConfig: Record<string, ExerciseConfig>;
  /**
   * Persistent edits to a program day's exercises — "my plan differs from the
   * default here". Survives completing a workout; changed only on purpose.
   */
  planDays: Record<string, Block[]>;
  /**
   * This-session-only edits to a day (life-happens deviations): a swap, an
   * added or dropped exercise, a reorder. Takes precedence over the plan while
   * present, and is cleared when the workout is completed so next time starts
   * from the plan again — unless the user saves it to the program.
   */
  sessionDays: Record<string, Block[]>;
  /**
   * This-session-only choice of which option a multi-exercise slot is running,
   * keyed by day then by the slot's anchor lift id → the picked lift id. A free,
   * expected choice among the slot's own options (not a deviation), cleared when
   * the workout is completed so next time starts from the slot's default again.
   */
  sessionPicks: Record<string, Record<string, string>>;
  /** Logged working sets per day, aligned to the day's block order. */
  logs: Record<string, LoggedSet[][]>;
  /**
   * ISO timestamp of when each exercise was started, per day then block index —
   * the anchor for time-to-first-set and per-exercise duration. Session-scoped:
   * cleared when the day is completed, reset, or its structure changes.
   */
  exerciseStart: Record<string, Record<number, string>>;
  /** Last completed set per lift id — shown as a "last time" hint. */
  history: Record<string, LiftHistory>;
  /** Archived workouts, newest first. */
  sessions: Session[];
  /** Bodyweight (raw input). */
  bw: string;
  /** When `bw` was last set (ISO), to resolve against the latest weigh-in. */
  bwAt?: string;
  /** Rounding increment. */
  inc: Increment;
  /** Active day key. */
  day: string;
  /** ISO date the current program block started, for progression tracking. */
  programStart?: string;
  /** Id of the currently selected training program. */
  activeProgram: string;
  /** Body-weight weigh-ins for goal tracking (date + kg). */
  weighIns: WeighIn[];
  /** Weight-loss goal (target weight & date). */
  weightGoal: WeightGoal;
  /** Personal details for calorie estimates (height, age, sex, activity). */
  profile: Profile;
  /** Chosen brand colours (primary + secondary). */
  theme: ThemeChoice;
}

export const STORAGE_KEY = 'ironrock-loadsheet-v1';

/** Day key used for the ad-hoc "freestyle" workout (has no program template). */
export const FREESTYLE_KEY = 'freestyle';

export function initialState(): State {
  return {
    refs: {},
    manual: {},
    customLifts: {},
    exerciseConfig: {},
    planDays: {},
    sessionDays: {},
    sessionPicks: {},
    logs: {},
    exerciseStart: {},
    history: {},
    sessions: [],
    bw: '',
    inc: 2.5,
    day: 'pushA',
    activeProgram: DEFAULT_PROGRAM,
    weighIns: [],
    weightGoal: {},
    profile: {},
    theme: DEFAULT_THEME,
  };
}

/**
 * Resolve any lift id to a Lift, checking the curated catalogue, the user's
 * custom exercises, then the bundled library. Falls back to a bare manual lift.
 */
export function liftById(state: State, id: string): Lift {
  const curated = LIFTS[id];
  if (curated) return curated;
  const custom = state.customLifts[id];
  if (custom) return { id, name: custom.name, type: 'manual', unit: custom.unit, cats: [] };
  const lib = LIBRARY_BY_ID[id];
  if (lib) return libraryLift(lib);
  return { id, name: id, type: 'manual', unit: '', cats: [] };
}

export type Action =
  | { type: 'setRef'; id: string; field: keyof RefSet; value: string }
  | { type: 'setManual'; id: string; value: string }
  | { type: 'setBw'; value: string }
  | { type: 'setInc'; value: Increment }
  | { type: 'setDay'; key: string }
  | { type: 'swapBlock'; dayKey: string; index: number; liftId: string }
  | { type: 'removeBlock'; dayKey: string; index: number }
  | { type: 'moveBlock'; dayKey: string; from: number; to: number }
  | { type: 'addBlock'; dayKey: string; liftId: string }
  | { type: 'pickOption'; dayKey: string; index: number; liftId: string }
  | { type: 'addOption'; dayKey: string; index: number; liftId: string }
  | { type: 'removeOption'; dayKey: string; index: number; liftId: string }
  | { type: 'addCustomLift'; id: string; name: string; unit: string; group: string }
  | { type: 'setExerciseConfig'; id: string; patch: Partial<ExerciseConfig> }
  | { type: 'restoreDay'; dayKey: string }
  | { type: 'revertDay'; dayKey: string }
  | { type: 'saveDayToProgram'; dayKey: string }
  | { type: 'addSet'; dayKey: string; index: number; set: LoggedSet }
  | { type: 'updateSet'; dayKey: string; index: number; setIndex: number; field: 'w' | 'reps' | 'rpe' | 'repsR' | 'note'; value: string }
  | { type: 'patchSet'; dayKey: string; index: number; setIndex: number; patch: Partial<LoggedSet> }
  | { type: 'toggleSetPerSide'; dayKey: string; index: number; setIndex: number }
  | { type: 'setFeel'; dayKey: string; index: number; setIndex: number; value: WarmupFeel | '' }
  | { type: 'toggleSetDone'; dayKey: string; index: number; setIndex: number; at?: string }
  | { type: 'startExercise'; dayKey: string; index: number; at: string }
  | { type: 'removeSet'; dayKey: string; index: number; setIndex: number }
  | { type: 'clearDaySets'; dayKey: string }
  | { type: 'completeWorkout'; dayKey: string; title: string; at: string; id: string }
  | { type: 'removeSession'; id: string }
  | { type: 'setActiveProgram'; id: string }
  | { type: 'archiveSession'; session: Session }
  | { type: 'importSessions'; sessions: Session[]; customLifts: Record<string, CustomLift> }
  | { type: 'logWeight'; at: string; kg: number }
  | { type: 'removeWeighIn'; at: string }
  | { type: 'setWeightGoal'; patch: Partial<WeightGoal> }
  | { type: 'setProfile'; patch: Partial<Profile> }
  | { type: 'setTheme'; patch: Partial<ThemeChoice> }
  | { type: 'startProgram'; at: string }
  | { type: 'resetProgram' }
  | { type: 'resetWeek' }
  | { type: 'clearAll' };

/** The full ordered option pool for a slot: the anchor lift, then its alternatives. */
export function blockOptions(block: Block): string[] {
  return block.alts && block.alts.length ? [block.lift, ...block.alts] : [block.lift];
}

/**
 * The un-picked base layer for a day: today's session copy wins, then the user's
 * saved plan edits, then the program default. This keeps each block's *anchor*
 * lift in `lift` (option picks are held separately, in `sessionPicks`).
 */
function pickBase(state: State, dayKey: string): Block[] {
  return state.sessionDays[dayKey] ?? state.planDays[dayKey] ?? defaultDay(dayKey)?.blocks ?? [];
}

/**
 * Blocks currently in effect for a day. On top of the base layer this applies
 * this-session option picks: a slot's active `lift` becomes the picked option,
 * with the full ordered pool stamped onto `pool` (anchor first) for the chooser.
 */
export function effBlocks(state: State, dayKey: string): Block[] {
  const base = pickBase(state, dayKey);
  const picks = state.sessionPicks[dayKey];
  return base.map((b) => {
    const pool = blockOptions(b);
    if (pool.length < 2) return b; // single-exercise slot — nothing to pick or stamp
    const picked = picks?.[b.lift];
    const active = picked && pool.includes(picked) ? picked : b.lift;
    return {
      ...b,
      lift: active,
      alts: pool.filter((id) => id !== active),
      pool,
      perLeg: b.perLeg ?? !!liftById(state, active).uni,
    };
  });
}

/**
 * A fresh, deep-cloned copy of the blocks a session edit should start from — the
 * current effective layout, with the display-only `pool` stripped — so editing
 * never mutates the plan or the default and never persists a transient field.
 */
function baseBlocks(state: State, dayKey: string): Block[] {
  return effBlocks(state, dayKey).map(({ pool: _pool, ...b }) => b);
}

/**
 * The layer an option edit (add/remove) should write to, cloned and un-picked:
 * a live deviation stays session-scoped, otherwise it edits the persistent plan.
 * Keeps indexes aligned with what the card shows and never bakes in a pick.
 */
function editBase(
  state: State,
  dayKey: string
): { blocks: Block[]; layer: 'sessionDays' | 'planDays' } {
  const clone = (bs: Block[]) => bs.map((b) => ({ ...b, alts: b.alts ? [...b.alts] : undefined }));
  if (state.sessionDays[dayKey]) return { blocks: clone(state.sessionDays[dayKey]), layer: 'sessionDays' };
  return { blocks: clone(state.planDays[dayKey] ?? defaultDay(dayKey)?.blocks ?? []), layer: 'planDays' };
}

/** Whether a day currently deviates from what its program prescribes. */
export function isDeviatedToday(state: State, dayKey: string): boolean {
  return state.sessionDays[dayKey] !== undefined;
}

/** Whether a day's plan has been edited away from the program default. */
export function isPlanEdited(state: State, dayKey: string): boolean {
  return state.planDays[dayKey] !== undefined;
}

/** Logged sets for a single block (empty array if none yet). */
export function setsFor(state: State, dayKey: string, index: number): LoggedSet[] {
  return state.logs[dayKey]?.[index] ?? [];
}

/** A mutable copy of a day's log rows, padded so `index` is addressable. */
function cloneDayLog(state: State, dayKey: string, minLength = 0): LoggedSet[][] {
  const rows = (state.logs[dayKey] ?? []).map((sets) => sets.map((s) => ({ ...s })));
  while (rows.length < minLength) rows.push([]);
  return rows;
}

/** Exercise-start map with a whole day's anchors dropped (structure changed / reset). */
function clearDayStart(
  map: Record<string, Record<number, string>>,
  dayKey: string
): Record<string, Record<number, string>> {
  if (!(dayKey in map)) return map;
  const next = { ...map };
  delete next[dayKey];
  return next;
}

/** Exercise-start map with one slot's anchor dropped (that slot restarted). */
function clearSlotStart(
  map: Record<string, Record<number, string>>,
  dayKey: string,
  index: number
): Record<string, Record<number, string>> {
  const day = map[dayKey];
  if (!day || day[index] === undefined) return map;
  const nextDay = { ...day };
  delete nextDay[index];
  const next = { ...map };
  if (Object.keys(nextDay).length) next[dayKey] = nextDay;
  else delete next[dayKey];
  return next;
}

/** A new block with a sensible default scheme for the given (resolved) lift. */
export function newBlock(lift: Lift): Block {
  const iso = lift.type === 'manual';
  return {
    lift: lift.id,
    sets: 3,
    reps: iso ? 12 : [8, 10],
    rpe: iso ? 9 : 8,
    cls: iso ? 'r-iso' : 'r-hi',
    // library/custom lifts have no movement role — fall back to a valid default
    cat: lift.cats[0] ?? 'hpress',
    perLeg: !!lift.uni,
  };
}

/**
 * Computed lifts actually used across the (possibly edited) week, in
 * first-use order. Drives which reference cards are shown.
 */
export function computedInUse(state: State): string[] {
  const seen: string[] = [];
  const mark = new Set<string>();
  for (const day of DAYS) {
    for (const block of effBlocks(state, day.key)) {
      const lift = LIFTS[block.lift];
      if (lift && lift.type === 'computed' && !mark.has(block.lift)) {
        mark.add(block.lift);
        seen.push(block.lift);
      }
    }
  }
  return seen;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setRef': {
      const prev = state.refs[action.id] ?? {};
      return {
        ...state,
        refs: { ...state.refs, [action.id]: { ...prev, [action.field]: action.value } },
      };
    }
    case 'setManual':
      return { ...state, manual: { ...state.manual, [action.id]: action.value } };
    case 'setBw':
      return { ...state, bw: action.value, bwAt: new Date().toISOString() };
    case 'setInc':
      return { ...state, inc: action.value };
    case 'setDay':
      return { ...state, day: action.key };
    case 'swapBlock': {
      const blocks = baseBlocks(state, action.dayKey);
      const target = blocks[action.index];
      if (!target) return state;
      blocks[action.index] = {
        ...target,
        lift: action.liftId,
        // a swap replaces the slot's exercise outright — its old options no
        // longer apply (use "Add option" to build a new set of alternatives)
        alts: undefined,
        perLeg: !!liftById(state, action.liftId).uni,
      };
      // a different exercise now occupies the slot — drop its logged sets
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      log[action.index] = [];
      return {
        ...state,
        sessionDays: { ...state.sessionDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
        exerciseStart: clearSlotStart(state.exerciseStart, action.dayKey, action.index),
      };
    }
    case 'removeBlock': {
      const blocks = baseBlocks(state, action.dayKey).filter((_, i) => i !== action.index);
      const log = cloneDayLog(state, action.dayKey).filter((_, i) => i !== action.index);
      return {
        ...state,
        sessionDays: { ...state.sessionDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
        // indices shift — drop the day's start anchors rather than misattribute them
        exerciseStart: clearDayStart(state.exerciseStart, action.dayKey),
      };
    }
    case 'moveBlock': {
      const blocks = baseBlocks(state, action.dayKey);
      const { from, to } = action;
      if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length)
        return state;
      // move the block and its logged sets together, so logs stay index-aligned
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      const [movedBlock] = blocks.splice(from, 1);
      blocks.splice(to, 0, movedBlock);
      const [movedLog] = log.splice(from, 1);
      log.splice(to, 0, movedLog);
      return {
        ...state,
        sessionDays: { ...state.sessionDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
        exerciseStart: clearDayStart(state.exerciseStart, action.dayKey),
      };
    }
    case 'addBlock': {
      const blocks = baseBlocks(state, action.dayKey);
      blocks.push(newBlock(liftById(state, action.liftId)));
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      return {
        ...state,
        sessionDays: { ...state.sessionDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
      };
    }
    case 'pickOption': {
      // Choose which of a slot's options is running today — a free choice among
      // the program's own alternatives (not a deviation), held in sessionPicks.
      const base = pickBase(state, action.dayKey);
      const slot = base[action.index];
      if (!slot) return state;
      const key = slot.lift; // the slot's anchor lift — the stable pick key
      if (!blockOptions(slot).includes(action.liftId)) return state;
      const dayPicks = { ...(state.sessionPicks[action.dayKey] ?? {}) };
      if (action.liftId === key) delete dayPicks[key];
      else dayPicks[key] = action.liftId;
      const sessionPicks = { ...state.sessionPicks };
      if (Object.keys(dayPicks).length) sessionPicks[action.dayKey] = dayPicks;
      else delete sessionPicks[action.dayKey];
      // a different exercise now occupies the slot — drop its logged sets & start
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      log[action.index] = [];
      return {
        ...state,
        sessionPicks,
        logs: { ...state.logs, [action.dayKey]: log },
        exerciseStart: clearSlotStart(state.exerciseStart, action.dayKey, action.index),
      };
    }
    case 'addOption': {
      const { blocks, layer } = editBase(state, action.dayKey);
      const target = blocks[action.index];
      if (!target || blockOptions(target).includes(action.liftId)) return state;
      target.alts = [...(target.alts ?? []), action.liftId];
      return { ...state, [layer]: { ...state[layer], [action.dayKey]: blocks } };
    }
    case 'removeOption': {
      const { blocks, layer } = editBase(state, action.dayKey);
      const target = blocks[action.index];
      if (!target) return state;
      const pool = blockOptions(target).filter((id) => id !== action.liftId);
      if (!pool.length) return state; // never strip a slot's last exercise
      // re-anchor to the first remaining option; the rest stay as alternatives
      target.lift = pool[0];
      target.alts = pool.length > 1 ? pool.slice(1) : undefined;
      return { ...state, [layer]: { ...state[layer], [action.dayKey]: blocks } };
    }
    case 'addCustomLift':
      return {
        ...state,
        customLifts: {
          ...state.customLifts,
          [action.id]: { name: action.name, unit: action.unit, group: action.group },
        },
      };
    case 'setExerciseConfig': {
      const prev = state.exerciseConfig[action.id] ?? {};
      return {
        ...state,
        exerciseConfig: { ...state.exerciseConfig, [action.id]: { ...prev, ...action.patch } },
      };
    }
    case 'restoreDay': {
      // full reset of a day to the program default — drop both this session's
      // deviations and any saved plan edits, plus the day's logged sets
      const planDays = { ...state.planDays };
      delete planDays[action.dayKey];
      const sessionDays = { ...state.sessionDays };
      delete sessionDays[action.dayKey];
      const sessionPicks = { ...state.sessionPicks };
      delete sessionPicks[action.dayKey];
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      return {
        ...state,
        planDays,
        sessionDays,
        sessionPicks,
        logs,
        exerciseStart: clearDayStart(state.exerciseStart, action.dayKey),
      };
    }
    case 'revertDay': {
      // undo just today's deviation and option picks (back to the plan), plus logs
      const sessionDays = { ...state.sessionDays };
      delete sessionDays[action.dayKey];
      const sessionPicks = { ...state.sessionPicks };
      delete sessionPicks[action.dayKey];
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      return {
        ...state,
        sessionDays,
        sessionPicks,
        logs,
        exerciseStart: clearDayStart(state.exerciseStart, action.dayKey),
      };
    }
    case 'saveDayToProgram': {
      // promote today's layout — including any option pick — into the persistent
      // plan, so it's the new default for this day going forward. Strip the
      // display-only pool; logs stay index-aligned.
      const eff = effBlocks(state, action.dayKey).map(({ pool: _pool, ...b }) => b);
      const planDays = { ...state.planDays, [action.dayKey]: eff };
      const sessionDays = { ...state.sessionDays };
      delete sessionDays[action.dayKey];
      const sessionPicks = { ...state.sessionPicks };
      delete sessionPicks[action.dayKey];
      return { ...state, planDays, sessionDays, sessionPicks };
    }
    case 'addSet': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      log[action.index] = [...log[action.index], { ...action.set }];
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'updateSet': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      const sets = log[action.index];
      if (!sets[action.setIndex]) return state;
      sets[action.setIndex] = { ...sets[action.setIndex], [action.field]: action.value };
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'patchSet': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      if (!log[action.index]?.[action.setIndex]) return state;
      log[action.index][action.setIndex] = { ...log[action.index][action.setIndex], ...action.patch };
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'toggleSetPerSide': {
      // flip a single set between one reps value and per-side (left/right)
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      const set = log[action.index]?.[action.setIndex];
      if (!set) return state;
      log[action.index][action.setIndex] = { ...set, perSide: set.perSide ? undefined : true };
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'setFeel': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      const set = log[action.index][action.setIndex];
      if (!set) return state;
      log[action.index][action.setIndex] = { ...set, feel: action.value || undefined };
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'toggleSetDone': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      const set = log[action.index][action.setIndex];
      if (!set) return state;
      const nowDone = !set.done;
      // stamp when it was checked off (for rest-period analysis); drop on undo
      log[action.index][action.setIndex] = { ...set, done: nowDone, at: nowDone ? action.at : undefined };
      let history = state.history;
      if (nowDone && !set.warmup) {
        const liftId = effBlocks(state, action.dayKey)[action.index]?.lift;
        if (liftId) {
          history = { ...history, [liftId]: { w: set.w, reps: set.reps, rpe: set.rpe } };
        }
      }
      return { ...state, logs: { ...state.logs, [action.dayKey]: log }, history };
    }
    case 'startExercise': {
      const day = { ...(state.exerciseStart[action.dayKey] ?? {}), [action.index]: action.at };
      return { ...state, exerciseStart: { ...state.exerciseStart, [action.dayKey]: day } };
    }
    case 'removeSet': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      log[action.index] = log[action.index].filter((_, i) => i !== action.setIndex);
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'clearDaySets': {
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      return { ...state, logs, exerciseStart: clearDayStart(state.exerciseStart, action.dayKey) };
    }
    case 'completeWorkout': {
      // Archive what was actually performed: checked-off sets only, with the
      // lift names resolved now so history survives later edits or renames.
      // Capture the full session — every performed set, warm-ups included, with
      // its done/warmup flags — so the archive shows exactly what happened. Only
      // stats treat warm-ups and un-checked sets as not counting.
      const exercises = effBlocks(state, action.dayKey)
        .map((block, i) => ({
          liftId: block.lift,
          name: liftById(state, block.lift).name,
          sets: setsFor(state, action.dayKey, i).filter(meaningfulSet).map((s) => ({ ...s })),
        }))
        .filter((ex) => ex.sets.length > 0);
      // require at least one real working set to be checked off — otherwise don't
      // archive an empty session, and don't destroy the sets sitting on the day
      const hasWorkingDone = exercises.some((ex) => ex.sets.some((s) => s.done && !s.warmup));
      if (!hasWorkingDone) return state;

      const session: Session = {
        id: action.id,
        at: action.at,
        dayKey: action.dayKey,
        title: action.title,
        exercises,
      };
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      // today's deviations were one-off — next time this day starts from the
      // plan again (saved plan edits persist; a freestyle workout is always one-off)
      const sessionDays = { ...state.sessionDays };
      delete sessionDays[action.dayKey];
      const sessionPicks = { ...state.sessionPicks };
      delete sessionPicks[action.dayKey];

      return {
        ...state,
        sessions: [session, ...state.sessions],
        logs,
        sessionDays,
        sessionPicks,
        exerciseStart: clearDayStart(state.exerciseStart, action.dayKey),
      };
    }
    case 'removeSession':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case 'setActiveProgram':
      return { ...state, activeProgram: action.id };
    case 'archiveSession':
      // a fully-formed session archived directly (used by programs that build
      // their own workout, e.g. 5/3/1), newest first
      return { ...state, sessions: [action.session, ...state.sessions] };
    case 'importSessions': {
      // Merge in externally-parsed sessions (e.g. a Strong export). Skip any
      // whose id is already present so re-importing the same file is a no-op,
      // and keep existing custom lifts over imported ones (user edits win).
      const known = new Set(state.sessions.map((s) => s.id));
      const added = action.sessions.filter((s) => !known.has(s.id));
      const sessions = [...state.sessions, ...added].sort((a, b) => b.at.localeCompare(a.at));
      const customLifts = { ...action.customLifts, ...state.customLifts };
      return { ...state, sessions, customLifts };
    }
    case 'logWeight': {
      // one weigh-in per day: replace any existing entry for that date
      const rest = state.weighIns.filter((w) => w.at !== action.at);
      const weighIns = [...rest, { at: action.at, kg: action.kg }].sort((a, b) =>
        a.at.localeCompare(b.at)
      );
      return { ...state, weighIns };
    }
    case 'removeWeighIn':
      return { ...state, weighIns: state.weighIns.filter((w) => w.at !== action.at) };
    case 'setWeightGoal':
      return { ...state, weightGoal: { ...state.weightGoal, ...action.patch } };
    case 'setProfile':
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case 'setTheme':
      return { ...state, theme: { ...state.theme, ...action.patch } };
    case 'startProgram':
      return { ...state, programStart: action.at };
    case 'resetProgram': {
      const next = { ...state };
      delete next.programStart;
      return next;
    }
    case 'resetWeek': {
      // Start a fresh training week: drop every program day's logged sets and
      // this-week deviations, but keep references, saved plan edits, history, and
      // the freestyle workout in progress.
      const freestyleLog = state.logs[FREESTYLE_KEY];
      const freestyleSession = state.sessionDays[FREESTYLE_KEY];
      const freestyleStart = state.exerciseStart[FREESTYLE_KEY];
      return {
        ...state,
        logs: freestyleLog ? { [FREESTYLE_KEY]: freestyleLog } : {},
        sessionDays: freestyleSession ? { [FREESTYLE_KEY]: freestyleSession } : {},
        sessionPicks: {},
        exerciseStart: freestyleStart ? { [FREESTYLE_KEY]: freestyleStart } : {},
      };
    }
    case 'clearAll':
      return { ...initialState(), inc: state.inc, day: state.day };
    default:
      return state;
  }
}

/** Load persisted state, merged over defaults. Degrades to defaults on failure. */
export function loadState(): State {
  const base = initialState();
  const raw = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();
  if (!raw) return base; // genuinely a fresh start — safe to save over
  try {
    // legacy `customDays` (a single override layer) becomes the persistent plan
    const { customDays: legacyCustomDays, ...parsed } = JSON.parse(raw) as Partial<State> & {
      customDays?: Record<string, Block[]>;
    };
    return {
      ...base,
      ...parsed,
      customLifts: parsed.customLifts ?? {},
      exerciseConfig: parsed.exerciseConfig ?? {},
      weighIns: parsed.weighIns ?? [],
      weightGoal: parsed.weightGoal ?? {},
      profile: parsed.profile ?? {},
      theme: { ...DEFAULT_THEME, ...(parsed.theme ?? {}) },
      planDays: parsed.planDays ?? legacyCustomDays ?? {},
      sessionDays: parsed.sessionDays ?? {},
      sessionPicks: parsed.sessionPicks ?? {},
      exerciseStart: parsed.exerciseStart ?? {},
      logs: parsed.logs ?? {},
      history: parsed.history ?? {},
      sessions: parsed.sessions ?? [],
    };
  } catch {
    // Data was there but unreadable. Quarantine the raw bytes and flag the
    // failure so saveState refuses to overwrite the original with an empty
    // state — a corrupt read must never become a permanent wipe.
    try {
      localStorage.setItem(`${STORAGE_KEY}-corrupt-${Date.now()}`, raw);
    } catch {
      /* best effort */
    }
    markLoadFailed();
    return base;
  }
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)
  );
}

/** Persist state; failure is surfaced (not silently swallowed) so data loss is visible. */
export function saveState(state: State): void {
  // If the saved data couldn't be read this session, don't clobber it — the
  // original may still be recoverable (transient corruption, a bad migration).
  if (getStorageHealth().loadFailed) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (isQuotaError(e)) markQuotaFailed();
    /* else: storage unavailable — degrade to in-memory only */
  }
}

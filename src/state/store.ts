import { DAYS, defaultDay } from '../domain/program';
import { LIFTS } from '../domain/lifts';
import { LIBRARY_BY_ID, libraryLift } from '../domain/library';
import { meaningfulSet } from '../domain/session';
import { DEFAULT_PROGRAM } from '../domain/programs';
import type { ExerciseConfig } from '../domain/exerciseConfig';
import type { WeighIn, WeightGoal } from '../domain/weightTracker';
import type { Profile } from '../domain/calories';
import { DEFAULT_THEME, type ThemeChoice } from '../domain/theme';
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
  /** Per-day overrides; absence means "use the default day". */
  customDays: Record<string, Block[]>;
  /** Logged working sets per day, aligned to the day's block order. */
  logs: Record<string, LoggedSet[][]>;
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
    customDays: {},
    logs: {},
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
  | { type: 'addCustomLift'; id: string; name: string; unit: string; group: string }
  | { type: 'setExerciseConfig'; id: string; patch: Partial<ExerciseConfig> }
  | { type: 'restoreDay'; dayKey: string }
  | { type: 'addSet'; dayKey: string; index: number; set: LoggedSet }
  | { type: 'updateSet'; dayKey: string; index: number; setIndex: number; field: 'w' | 'reps' | 'rpe' | 'repsR' | 'note'; value: string }
  | { type: 'toggleSetPerSide'; dayKey: string; index: number; setIndex: number }
  | { type: 'setFeel'; dayKey: string; index: number; setIndex: number; value: WarmupFeel | '' }
  | { type: 'toggleSetDone'; dayKey: string; index: number; setIndex: number }
  | { type: 'removeSet'; dayKey: string; index: number; setIndex: number }
  | { type: 'clearDaySets'; dayKey: string }
  | { type: 'completeWorkout'; dayKey: string; title: string; at: string; id: string }
  | { type: 'removeSession'; id: string }
  | { type: 'setActiveProgram'; id: string }
  | { type: 'archiveSession'; session: Session }
  | { type: 'logWeight'; at: string; kg: number }
  | { type: 'removeWeighIn'; at: string }
  | { type: 'setWeightGoal'; patch: Partial<WeightGoal> }
  | { type: 'setProfile'; patch: Partial<Profile> }
  | { type: 'setTheme'; patch: Partial<ThemeChoice> }
  | { type: 'startProgram'; at: string }
  | { type: 'resetProgram' }
  | { type: 'resetWeek' }
  | { type: 'clearAll' };

/** Deep-clone a day's default blocks so edits never mutate the program template. */
function cloneDefaultBlocks(dayKey: string): Block[] {
  const day = defaultDay(dayKey);
  return day ? day.blocks.map((b) => ({ ...b })) : [];
}

/** Blocks currently in effect for a day (override if present, else default). */
export function effBlocks(state: State, dayKey: string): Block[] {
  return state.customDays[dayKey] ?? defaultDay(dayKey)?.blocks ?? [];
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
      const blocks = (state.customDays[action.dayKey] ?? cloneDefaultBlocks(action.dayKey)).map(
        (b) => ({ ...b })
      );
      const target = blocks[action.index];
      if (!target) return state;
      blocks[action.index] = {
        ...target,
        lift: action.liftId,
        perLeg: !!liftById(state, action.liftId).uni,
      };
      // a different exercise now occupies the slot — drop its logged sets
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      log[action.index] = [];
      return {
        ...state,
        customDays: { ...state.customDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
      };
    }
    case 'removeBlock': {
      const blocks = (state.customDays[action.dayKey] ?? cloneDefaultBlocks(action.dayKey)).filter(
        (_, i) => i !== action.index
      );
      const log = cloneDayLog(state, action.dayKey).filter((_, i) => i !== action.index);
      return {
        ...state,
        customDays: { ...state.customDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
      };
    }
    case 'moveBlock': {
      const blocks = (state.customDays[action.dayKey] ?? cloneDefaultBlocks(action.dayKey)).map(
        (b) => ({ ...b })
      );
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
        customDays: { ...state.customDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
      };
    }
    case 'addBlock': {
      const blocks = (state.customDays[action.dayKey] ?? cloneDefaultBlocks(action.dayKey)).map(
        (b) => ({ ...b })
      );
      blocks.push(newBlock(liftById(state, action.liftId)));
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      return {
        ...state,
        customDays: { ...state.customDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
      };
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
      const customDays = { ...state.customDays };
      delete customDays[action.dayKey];
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      return { ...state, customDays, logs };
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
      log[action.index][action.setIndex] = { ...set, done: nowDone };
      let history = state.history;
      if (nowDone && !set.warmup) {
        const liftId = effBlocks(state, action.dayKey)[action.index]?.lift;
        if (liftId) {
          history = { ...history, [liftId]: { w: set.w, reps: set.reps, rpe: set.rpe } };
        }
      }
      return { ...state, logs: { ...state.logs, [action.dayKey]: log }, history };
    }
    case 'removeSet': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      log[action.index] = log[action.index].filter((_, i) => i !== action.setIndex);
      return { ...state, logs: { ...state.logs, [action.dayKey]: log } };
    }
    case 'clearDaySets': {
      const logs = { ...state.logs };
      delete logs[action.dayKey];
      return { ...state, logs };
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
      // a program day keeps its prescribed blocks for next time; a freestyle
      // workout is one-off, so it goes back to a blank slate
      const customDays = { ...state.customDays };
      if (action.dayKey === FREESTYLE_KEY) delete customDays[FREESTYLE_KEY];

      return { ...state, sessions: [session, ...state.sessions], logs, customDays };
    }
    case 'removeSession':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case 'setActiveProgram':
      return { ...state, activeProgram: action.id };
    case 'archiveSession':
      // a fully-formed session archived directly (used by programs that build
      // their own workout, e.g. 5/3/1), newest first
      return { ...state, sessions: [action.session, ...state.sessions] };
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
      // Start a fresh training week: drop every program day's logged sets, but
      // keep references, swapped exercises, history, and the freestyle workout.
      const freestyle = state.logs[FREESTYLE_KEY];
      return { ...state, logs: freestyle ? { [FREESTYLE_KEY]: freestyle } : {} };
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...base,
      ...parsed,
      customLifts: parsed.customLifts ?? {},
      exerciseConfig: parsed.exerciseConfig ?? {},
      weighIns: parsed.weighIns ?? [],
      weightGoal: parsed.weightGoal ?? {},
      profile: parsed.profile ?? {},
      theme: { ...DEFAULT_THEME, ...(parsed.theme ?? {}) },
      customDays: parsed.customDays ?? {},
      logs: parsed.logs ?? {},
      history: parsed.history ?? {},
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return base;
  }
}

/** Persist state; failure is swallowed so the app keeps working in memory. */
export function saveState(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — degrade to in-memory only */
  }
}

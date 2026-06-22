import { DAYS, defaultDay } from '../domain/program';
import { LIFTS } from '../domain/lifts';
import type { Block, Increment, LiftHistory, LoggedSet, RefSet } from '../domain/types';

export interface State {
  /** Reference sets per computed lift id. */
  refs: Record<string, RefSet>;
  /** Entered weights per manual lift id (raw input strings). */
  manual: Record<string, string>;
  /** Per-day overrides; absence means "use the default day". */
  customDays: Record<string, Block[]>;
  /** Logged working sets per day, aligned to the day's block order. */
  logs: Record<string, LoggedSet[][]>;
  /** Last completed set per lift id — shown as a "last time" hint. */
  history: Record<string, LiftHistory>;
  /** Bodyweight (raw input). */
  bw: string;
  /** Rounding increment. */
  inc: Increment;
  /** Active day key. */
  day: string;
}

export const STORAGE_KEY = 'ironrock-loadsheet-v1';

export function initialState(): State {
  return {
    refs: {},
    manual: {},
    customDays: {},
    logs: {},
    history: {},
    bw: '',
    inc: 2.5,
    day: 'pushA',
  };
}

export type Action =
  | { type: 'setRef'; id: string; field: keyof RefSet; value: string }
  | { type: 'setManual'; id: string; value: string }
  | { type: 'setBw'; value: string }
  | { type: 'setInc'; value: Increment }
  | { type: 'setDay'; key: string }
  | { type: 'swapBlock'; dayKey: string; index: number; liftId: string }
  | { type: 'removeBlock'; dayKey: string; index: number }
  | { type: 'addBlock'; dayKey: string; liftId: string }
  | { type: 'restoreDay'; dayKey: string }
  | { type: 'addSet'; dayKey: string; index: number; set: LoggedSet }
  | { type: 'updateSet'; dayKey: string; index: number; setIndex: number; field: 'w' | 'reps' | 'rpe'; value: string }
  | { type: 'toggleSetDone'; dayKey: string; index: number; setIndex: number }
  | { type: 'removeSet'; dayKey: string; index: number; setIndex: number }
  | { type: 'clearDaySets'; dayKey: string }
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

/** A new block with a sensible default scheme for the chosen lift. */
export function newBlock(liftId: string): Block {
  const lift = LIFTS[liftId];
  const iso = lift.type === 'manual';
  return {
    lift: liftId,
    sets: 3,
    reps: iso ? 12 : [8, 10],
    rpe: iso ? 9 : 8,
    cls: iso ? 'r-iso' : 'r-hi',
    cat: lift.cats[0],
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
      return { ...state, bw: action.value };
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
        perLeg: !!LIFTS[action.liftId].uni,
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
    case 'addBlock': {
      const blocks = (state.customDays[action.dayKey] ?? cloneDefaultBlocks(action.dayKey)).map(
        (b) => ({ ...b })
      );
      blocks.push(newBlock(action.liftId));
      const log = cloneDayLog(state, action.dayKey, blocks.length);
      return {
        ...state,
        customDays: { ...state.customDays, [action.dayKey]: blocks },
        logs: { ...state.logs, [action.dayKey]: log },
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
    case 'toggleSetDone': {
      const log = cloneDayLog(state, action.dayKey, action.index + 1);
      const set = log[action.index][action.setIndex];
      if (!set) return state;
      const nowDone = !set.done;
      log[action.index][action.setIndex] = { ...set, done: nowDone };
      let history = state.history;
      if (nowDone) {
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
    case 'resetWeek':
      // Start a fresh training week: drop every day's logged sets, but keep
      // references, swapped exercises, bodyweight, and last-session history.
      return { ...state, logs: {} };
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
      customDays: parsed.customDays ?? {},
      logs: parsed.logs ?? {},
      history: parsed.history ?? {},
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

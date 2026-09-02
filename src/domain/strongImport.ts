import { LIFTS } from './lifts';
import { LIBRARY } from './library';
import type { CustomLift } from '../state/store';
import { FREESTYLE_KEY } from '../state/store';
import type { LoggedSet, Session, SessionExercise } from './types';

/**
 * Import a workout history exported from the Strong app (Profile → Settings →
 * Export Data → a CSV). Each performed set becomes a LoggedSet inside an
 * archived Session, so the whole back-catalogue lands in History and feeds the
 * exercise charts.
 *
 * Everything here is pure: parse text → { sessions, customLifts, summary }. The
 * reducer (`importSessions`) does the merging; the UI shows the summary and
 * asks before committing.
 */

// --- CSV parsing -----------------------------------------------------------

/** A minimal RFC-4180-ish CSV reader: quoted fields, "" escapes, \r\n rows. */
function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // handled by the \n branch; ignore
    } else {
      field += c;
    }
  }
  // trailing field / row (no final newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Strong uses comma delimiters in newer exports, semicolons in older ones. */
function detectDelimiter(firstLine: string): string {
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

// --- exercise-name resolution ---------------------------------------------

/** Fold gym synonyms/abbreviations to one representative token. */
const CANON: Record<string, string> = {
  db: 'dumbbell',
  bb: 'barbell',
  bw: 'bodyweight',
  side: 'lateral',
};

function singular(t: string): string {
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
}

/**
 * An order-independent key for a movement: its meaningful words (equipment
 * included), lowercased, de-pluralised, synonym-folded and sorted. So "Bench
 * Press (Barbell)" and the library's "Barbell Bench Press" collapse to the same
 * key, while "Incline Bench Press" stays distinct.
 */
export function movementKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => CANON[t] ?? CANON[singular(t)] ?? singular(t));
  return Array.from(new Set(tokens)).sort().join('+');
}

/**
 * Common Strong exercise names → curated catalogue ids, so a barbell bench
 * press imported from Strong charts against the same lift the program uses.
 * Keyed by movementKey so wording/order/equipment-placement don't matter.
 */
const CURATED_ALIASES: [string, string][] = [
  ['Bench Press (Barbell)', 'bench'],
  ['Bench Press (Dumbbell)', 'dbbench'],
  ['Incline Bench Press (Barbell)', 'inclinebench'],
  ['Incline Bench Press (Dumbbell)', 'dbincline'],
  ['Close Grip Bench Press (Barbell)', 'cgbench'],
  ['Floor Press (Barbell)', 'floorpress'],
  ['Overhead Press (Barbell)', 'ohp'],
  ['Strict Military Press (Barbell)', 'ohp'],
  ['Seated Overhead Press (Barbell)', 'seatedbb'],
  ['Overhead Press (Dumbbell)', 'dbohp'],
  ['Seated Overhead Press (Dumbbell)', 'dbohp'],
  ['Arnold Press (Dumbbell)', 'arnold'],
  ['Push Press', 'pushpress'],
  ['Squat (Barbell)', 'squat'],
  ['Front Squat (Barbell)', 'frontsquat'],
  ['Paused Squat (Barbell)', 'pausesquat'],
  ['Box Squat (Barbell)', 'boxsquat'],
  ['Goblet Squat (Dumbbell)', 'goblet'],
  ['Deadlift (Barbell)', 'deadlift'],
  ['Romanian Deadlift (Barbell)', 'rdl'],
  ['Romanian Deadlift (Dumbbell)', 'dbrdl'],
  ['Stiff Leg Deadlift (Barbell)', 'stiffleg'],
  ['Good Morning (Barbell)', 'goodmorning'],
  ['Bent Over Row (Barbell)', 'row'],
  ['Pendlay Row (Barbell)', 'pendlay'],
  ['Yates Row (Barbell)', 'yates'],
  ['Bent Over Row (Dumbbell)', 'dbrow'],
  ['Chest Supported Incline Row (Dumbbell)', 'csrow'],
  ['Pull Up', 'pullup'],
  ['Chin Up', 'chinup'],
  ['Bulgarian Split Squat', 'bss'],
  ['Lunge (Dumbbell)', 'lunge'],
  ['Walking Lunge (Dumbbell)', 'lunge'],
  ['Reverse Lunge (Dumbbell)', 'reverselunge'],
  ['Step Up (Dumbbell)', 'stepup'],
  ['Bicep Curl (Dumbbell)', 'dbcurl'],
  ['Bicep Curl (Barbell)', 'ezcurl'],
  ['EZ Bar Biceps Curl', 'ezcurl'],
  ['Incline Curl (Dumbbell)', 'inclinecurl'],
  ['Hammer Curl (Dumbbell)', 'hammer'],
  ['Preacher Curl', 'preacher'],
  ['Concentration Curl (Dumbbell)', 'concentration'],
  ['Skullcrusher (Barbell)', 'skull'],
  ['Lying Triceps Extension', 'skull'],
  ['Triceps Extension (Cable)', 'cableohext'],
  ['Triceps Dip', 'dips'],
  ['Lateral Raise (Dumbbell)', 'latraise'],
  ['Lateral Raise (Cable)', 'cablelatraise'],
  ['Face Pull (Cable)', 'facepull'],
  ['Rear Delt Reverse Fly (Dumbbell)', 'reardelt'],
  ['Standing Calf Raise', 'calf'],
  ['Seated Calf Raise', 'seatedcalf'],
];

/** movementKey → curated id, built once. */
const CURATED_BY_KEY: Record<string, string> = {};
for (const [name, id] of CURATED_ALIASES) CURATED_BY_KEY[movementKey(name)] = id;

/** movementKey → library exercise, built once (curated aliases take priority). */
const LIBRARY_BY_KEY: Record<string, { id: string; name: string }> = {};
for (const ex of LIBRARY) {
  const k = movementKey(ex.name);
  if (!(k in LIBRARY_BY_KEY)) LIBRARY_BY_KEY[k] = { id: ex.id, name: ex.name };
}

/** Equipment named in a trailing "(…)" → a logging unit for a custom lift. */
const UNIT_BY_EQUIP: [RegExp, string][] = [
  [/barbell/, 'kg on bar'],
  [/dumbbell/, 'kg / DB'],
  [/bodyweight|body ?weight/, 'bodyweight'],
  [/smith|machine|cable|plate/, 'kg'],
];

function unitFor(name: string): string {
  const m = name.match(/\(([^)]+)\)\s*$/);
  const equip = (m?.[1] ?? '').toLowerCase();
  for (const [re, unit] of UNIT_BY_EQUIP) if (re.test(equip)) return unit;
  return 'kg';
}

export interface ResolvedExercise {
  liftId: string;
  name: string;
  /** Present when we had to mint a custom lift to hold this exercise. */
  custom?: CustomLift;
}

/**
 * Map a Strong exercise name to a lift id: a curated catalogue lift when we
 * recognise it, else a bundled library exercise, else a fresh custom lift that
 * preserves Strong's own name so nothing is silently dropped or mis-charted.
 */
export function resolveExercise(strongName: string): ResolvedExercise {
  const name = strongName.trim();
  const key = movementKey(name);

  const curated = CURATED_BY_KEY[key];
  if (curated && LIFTS[curated]) return { liftId: curated, name: LIFTS[curated].name };

  const lib = LIBRARY_BY_KEY[key];
  if (lib) return { liftId: lib.id, name: lib.name };

  const id = `strong-${key.replace(/\+/g, '-') || 'exercise'}`;
  return { liftId: id, name, custom: { name, unit: unitFor(name), group: 'Other' } };
}

// --- row → session assembly ------------------------------------------------

const LB_TO_KG = 0.45359237;

function fmtWeight(raw: string, lbs: boolean): string {
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n === 0) return '';
  const kg = lbs ? n * LB_TO_KG : n;
  return String(Math.round(kg * 100) / 100);
}

function fmtInt(raw: string): string {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? String(Math.round(n)) : '';
}

function toIso(raw: string): string | null {
  const d = new Date(raw.trim().replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Locate a column by matching its header against a predicate. */
function colIndex(headers: string[], pred: (h: string) => boolean): number {
  return headers.findIndex((h) => pred(h.trim().toLowerCase().replace(/^"|"$/g, '')));
}

export interface StrongImport {
  sessions: Session[];
  customLifts: Record<string, CustomLift>;
  /** Distinct exercise names that became a preserved custom lift. */
  unmatched: string[];
  workouts: number;
  exercises: number;
  sets: number;
  /** Weight unit we read the file in. */
  unit: 'kg' | 'lb';
}

export class StrongImportError extends Error {}

/**
 * Parse a Strong CSV export into archived sessions. Groups rows by workout
 * (date + name), resolves each exercise once, and marks every imported set as a
 * done working set so it counts in history, stats and charts.
 */
export function parseStrong(text: string): StrongImport {
  const clean = text.replace(/^﻿/, ''); // strip BOM
  const firstLine = clean.slice(0, clean.indexOf('\n') === -1 ? undefined : clean.indexOf('\n'));
  const delim = detectDelimiter(firstLine);
  const rows = parseCsv(clean, delim);
  if (rows.length < 2) throw new StrongImportError('That file has no workout rows in it.');

  const headers = rows[0];
  const iDate = colIndex(headers, (h) => h.includes('date'));
  const iWorkout = colIndex(headers, (h) => h === 'workout name' || h === 'workout');
  const iExercise = colIndex(headers, (h) => h.includes('exercise name') || h === 'exercise');
  const iWeight = colIndex(headers, (h) => h.startsWith('weight'));
  const iReps = colIndex(headers, (h) => h === 'reps' || h.startsWith('reps'));
  const iRpe = colIndex(headers, (h) => h === 'rpe');
  const iNotes = colIndex(headers, (h) => h === 'notes' || h === 'note');
  const iSetOrder = colIndex(headers, (h) => h.includes('set order') || h === 'set');

  if (iDate === -1 || iExercise === -1) {
    throw new StrongImportError(
      "That doesn't look like a Strong export — it needs Date and Exercise Name columns.",
    );
  }

  const weightHeader = (headers[iWeight] ?? '').toLowerCase();
  const unit: 'kg' | 'lb' = /lb/.test(weightHeader) ? 'lb' : 'kg';
  const lbs = unit === 'lb';

  // group rows into workouts, preserving first-seen order of workouts, their
  // exercises, and each exercise's sets
  const order: string[] = [];
  const groups = new Map<
    string,
    { at: string; title: string; exOrder: string[]; byEx: Map<string, SessionExercise> }
  >();
  const customLifts: Record<string, CustomLift> = {};
  const unmatched = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const rawDate = cells[iDate] ?? '';
    const at = toIso(rawDate);
    const exName = (cells[iExercise] ?? '').trim();
    if (!at || !exName) continue;

    const w = fmtWeight(cells[iWeight] ?? '', lbs);
    const reps = fmtInt(cells[iReps] ?? '');
    if (!w && !reps) continue; // cardio / empty / rest-only row — nothing to log

    const title = (cells[iWorkout] ?? '').trim() || 'Imported workout';
    const gk = `${rawDate.trim()}||${title}`;
    let g = groups.get(gk);
    if (!g) {
      g = { at, title, exOrder: [], byEx: new Map() };
      groups.set(gk, g);
      order.push(gk);
    }

    const resolved = resolveExercise(exName);
    if (resolved.custom) {
      customLifts[resolved.liftId] = resolved.custom;
      unmatched.add(exName);
    }
    let ex = g.byEx.get(resolved.liftId);
    if (!ex) {
      ex = { liftId: resolved.liftId, name: resolved.name, sets: [] };
      g.byEx.set(resolved.liftId, ex);
      g.exOrder.push(resolved.liftId);
    }

    const setOrder = (cells[iSetOrder] ?? '').trim().toLowerCase();
    const warmup = setOrder.startsWith('w') || setOrder === 'warmup';
    const rpe = iRpe === -1 ? '' : fmtInt(cells[iRpe] ?? '') || '';
    const note = iNotes === -1 ? '' : (cells[iNotes] ?? '').trim();

    const set: LoggedSet = { w, reps, rpe, done: true };
    if (warmup) set.warmup = true;
    if (note) set.note = note;
    ex.sets.push(set);
  }

  const sessions: Session[] = [];
  let exercises = 0;
  let sets = 0;
  for (const gk of order) {
    const g = groups.get(gk)!;
    const exList = g.exOrder.map((id) => g.byEx.get(id)!).filter((ex) => ex.sets.length > 0);
    if (exList.length === 0) continue;
    exercises += exList.length;
    exList.forEach((ex) => (sets += ex.sets.length));
    sessions.push({
      id: `strong-${Date.parse(g.at)}-${movementKey(g.title).replace(/\+/g, '-') || 'workout'}`,
      at: g.at,
      dayKey: FREESTYLE_KEY,
      title: g.title,
      exercises: exList,
    });
  }

  if (sessions.length === 0) {
    throw new StrongImportError('No completed sets found to import from that file.');
  }

  sessions.sort((a, b) => b.at.localeCompare(a.at));
  return {
    sessions,
    customLifts,
    unmatched: Array.from(unmatched),
    workouts: sessions.length,
    exercises,
    sets,
    unit,
  };
}

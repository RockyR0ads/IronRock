import { LIFTS } from './lifts';
import { LIBRARY, LIBRARY_BY_ID } from './library';
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
  // Strong tags leg-abductor/adductor machines "Hip …"; the library calls the
  // same movements "Thigh …". Fold to one so they match.
  hip: 'thigh',
};

/**
 * Words that never distinguish one movement from another, so they're dropped
 * from the key. "Machine" is the big one: Strong appends "(Machine)" to most
 * selectorised movements ("Leg Extension (Machine)") while the library names
 * them plainly ("Leg Extensions"), and that lone token was the only thing
 * stopping them from matching.
 */
const NOISE = new Set(['machine']);

function singular(t: string): string {
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
}

/**
 * An order-independent key for a movement: its meaningful words (equipment
 * included), lowercased, de-pluralised, synonym-folded, noise-word-stripped and
 * sorted. So "Bench Press (Barbell)" and the library's "Barbell Bench Press"
 * collapse to the same key, while "Incline Bench Press" stays distinct.
 */
export function movementKey(name: string): string {
  const tokens = name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => CANON[t] ?? CANON[singular(t)] ?? singular(t))
    .filter((t) => !NOISE.has(t));
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
  // cable / machine isolation commonly logged in Strong → catalogue equivalents
  ['Lat Pulldown (Cable)', 'latpulldown'],
  ['Lat Pulldown (Machine)', 'latpulldown'],
  ['Lat Pulldown - Wide Grip (Cable)', 'latpulldown'],
  ['Lat Pulldown (Single Arm)', 'latpulldown'],
  ['Cable Fly', 'cablefly'],
  ['Reverse Fly (Cable)', 'reversecablefly'],
  ['Reverse Fly (Dumbbell)', 'reardelt'],
  ['Reverse Fly (Machine)', 'reardelt'],
  ['Preacher Curl (Barbell)', 'preacher'],
  ['Preacher Curl (Dumbbell)', 'preacher'],
  ['Bicep Curl (Cable)', 'cablecurl'],
  ['Skullcrusher (Dumbbell)', 'skull'],
  ['Triceps Pushdown (Cable - Straight Bar)', 'pushdown'],
  ['Cable Kickback', 'kickback'],
  ['Dumbell kickback', 'kickback'],
  ['Chest Dip', 'dips'],
  ['Lateral Raise (Machine)', 'latraise'],
  ['Seated Lateral Raise (Dumbbell)', 'seatedlatraise'],
  ['Standing Calf Raise (Machine)', 'calf'],
  ['Standing Calf Raise (Smith Machine)', 'calf'],
  ['Seated Calf Raise (Plate Loaded)', 'seatedcalf'],
  // Variants/renames of standard movements Strong spells differently from our
  // catalogue or the bundled library. Targets are catalogue ids where we have a
  // program lift, otherwise a library exercise id (both resolve on import).
  ['Bent Over One Arm Row (Dumbbell)', 'dbrow'],
  ['Chest Fly', 'cablefly'],
  ['Floor fly', 'cablefly'],
  ['Chest Fly (Dumbbell)', 'Dumbbell_Flyes'],
  ['Incline Chest Fly (Dumbbell)', 'Incline_Dumbbell_Flyes'],
  ['Chest Press (Machine)', 'Leverage_Chest_Press'],
  ['Incline Chest Press (Machine)', 'Leverage_Incline_Chest_Press'],
  ['Iso-Lateral Chest Press (Machine)', 'Leverage_Chest_Press'],
  ['Chest Dip (Assisted)', 'dips'],
  ['Seated dips', 'dips'],
  ['Chin Up (Assisted)', 'chinup'],
  ['Pull Up (Assisted)', 'pullup'],
  ['Wide Pull Up', 'pullup'],
  ['Push Up', 'Pushups'],
  ['Archer pushup', 'Pushups'],
  ['Decline pushup', 'Decline_Push-Up'],
  ['Handstand Push Up', 'Handstand_Push-Ups'],
  ['Crunch (Machine)', 'Ab_Crunch_Machine'],
  ['Hanging Knee Raise', 'Hanging_Leg_Raise'],
  ["Knee Raise (Captain's Chair)", 'Hanging_Leg_Raise'],
  ['Back Extension', 'Hyperextensions_Back_Extensions'],
  ['Front Raise (Barbell)', 'Standing_Front_Barbell_Raise_Over_Head'],
  ['Upright Row (Dumbbell)', 'Standing_Dumbbell_Upright_Row'],
  ['Shrug (Machine)', 'Leverage_Shrug'],
  ['T Bar Row', 'T-Bar_Row_with_Handle'],
  ['Seated Row (Machine)', 'Seated_Cable_Rows'],
  ['Seated Wide-Grip Row (Cable)', 'Seated_Cable_Rows'],
  ['Iso-Lateral Row (Machine)', 'Seated_Cable_Rows'],
  ['Shoulder Press (Machine)', 'Machine_Shoulder_Military_Press'],
  ['Shoulder Press (Plate Loaded)', 'Leverage_Shoulder_Press'],
  ['Overhead Press (Cable)', 'Cable_Shoulder_Press'],
  ['Overhead Press (Smith Machine)', 'Smith_Machine_Overhead_Shoulder_Press'],
  ['Cable pullover', 'Straight-Arm_Dumbbell_Pullover'],
  ['Pullover (Dumbbell)', 'Straight-Arm_Dumbbell_Pullover'],
  ['Hammer Curl (Cable)', 'hammer'],
  ['Triceps Extension (Barbell)', 'skull'],
  ['Triceps Extension (Dumbbell)', 'ohext'],
  ['Triceps extension Single arm', 'ohext'],
  ['Cable crossover triceps extension', 'pushdown'],
  ['Landmine Press', 'Landmine_Linear_Jammer'],
  ['Pistol Squat', 'Kettlebell_Pistol_Squat'],
  ['Lunge (Bodyweight)', 'lunge'],
  ['Box Jump', 'Box_Jump_Multiple_Response'],
  ['Ab Wheel', 'Ab_Roller'],
  ['Calf Press on Leg Press', 'calf'],
  ['Seated Leg Press (Machine)', 'Leg_Press'],
  ['Single leg press', 'Leg_Press'],
  ['Kneeling leg curl', 'Standing_Leg_Curl'],
  ['Deficit Deadlift (Barbell)', 'deadlift'],
  ['Wide grip deadlift', 'deadlift'],
  ['Wide grip romanian deadlift', 'rdl'],
  ['Smith machine RDL', 'rdl'],
  ['Squat (Machine)', 'Hack_Squat'],
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
  if (curated) {
    // An alias may point at a curated lift or straight at a library exercise.
    if (LIFTS[curated]) return { liftId: curated, name: LIFTS[curated].name };
    const aliased = LIBRARY_BY_ID[curated];
    if (aliased) return { liftId: aliased.id, name: aliased.name };
  }

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

/**
 * Strong's workout duration: usually a plain seconds integer ("2651"), but some
 * exports write "1h 2m" / "45m" / "1h". Returns whole seconds, or null.
 */
function parseDurationSec(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return n > 0 ? n : null;
  }
  const hm = s.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);
  if (hm && (hm[1] || hm[2])) {
    const sec = (parseInt(hm[1] ?? '0', 10) * 60 + parseInt(hm[2] ?? '0', 10)) * 60;
    return sec > 0 ? sec : null;
  }
  return null;
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
  const iDuration = colIndex(headers, (h) => h.startsWith('duration'));

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
    {
      at: string;
      title: string;
      durationSec?: number;
      exOrder: string[];
      byEx: Map<string, SessionExercise>;
    }
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
    if (iDuration !== -1 && g.durationSec === undefined) {
      const d = parseDurationSec(cells[iDuration] ?? '');
      if (d !== null) g.durationSec = d;
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
      durationSec: g.durationSec,
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

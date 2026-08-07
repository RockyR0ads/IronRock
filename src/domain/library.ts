import type { Lift } from './types';
import raw from '../data/exercises.json';
import { SUPPLEMENT_EXERCISES } from '../data/supplements';

/** A record from the bundled free-exercise-db (public domain). */
export interface LibraryExercise {
  id: string;
  name: string;
  equipment: string | null;
  muscles: string[];
  images: string[];
  instructions: string[];
}

export const LIBRARY: LibraryExercise[] = [...(raw as LibraryExercise[]), ...SUPPLEMENT_EXERCISES];

export const LIBRARY_BY_ID: Record<string, LibraryExercise> = Object.fromEntries(
  LIBRARY.map((e) => [e.id, e])
);

/** Coarse muscle groups used to browse the library. */
export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Other';

export const GROUP_ORDER: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Other',
];

const MUSCLE_TO_GROUP: Record<string, MuscleGroup> = {
  chest: 'Chest',
  lats: 'Back',
  'middle back': 'Back',
  'lower back': 'Back',
  traps: 'Back',
  shoulders: 'Shoulders',
  neck: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  quadriceps: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  abdominals: 'Core',
};

export function groupOfMuscles(muscles: string[]): MuscleGroup {
  return MUSCLE_TO_GROUP[muscles[0]] ?? 'Other';
}

/** Map the dataset's `equipment` to one of our logging units. */
const UNIT_BY_EQUIPMENT: Record<string, string> = {
  barbell: 'kg on bar',
  'e-z curl bar': 'kg on bar',
  dumbbell: 'kg / DB',
  kettlebells: 'kg',
  machine: 'kg',
  cable: 'kg',
  'medicine ball': 'kg',
  'exercise ball': 'kg',
  'body only': 'bodyweight',
  bands: 'band',
  'foam roll': '',
  other: '',
};

export function unitForEquipment(equipment: string | null): string {
  if (!equipment) return '';
  return UNIT_BY_EQUIPMENT[equipment] ?? 'kg';
}

/**
 * Coarse equipment buckets for filtering the library. The raw dataset has a
 * dozen `equipment` values; these fold the rarer ones together so the filter
 * chips stay to the equipment people actually search by.
 */
const EQUIP_GROUPS: Record<string, string[]> = {
  Barbell: ['barbell', 'e-z curl bar'],
  Dumbbell: ['dumbbell'],
  Machine: ['machine'],
  Cable: ['cable'],
  Bodyweight: ['body only'],
  Kettlebell: ['kettlebells'],
  Bands: ['bands'],
  Other: ['other', 'medicine ball', 'exercise ball', 'foam roll'],
};

/** Equipment filter keys, in the order they're offered as chips. */
export type EquipKey = keyof typeof EQUIP_GROUPS;
export const EQUIP_OPTIONS = Object.keys(EQUIP_GROUPS) as EquipKey[];

/** Does an exercise's equipment fall in the given filter bucket? */
export function matchesEquip(equipment: string | null, key: EquipKey): boolean {
  return equipment != null && (EQUIP_GROUPS[key] ?? []).includes(equipment);
}

/** Present a library exercise as a Lift for the logging machinery (always manual). */
export function libraryLift(ex: LibraryExercise): Lift {
  return { id: ex.id, name: ex.name, type: 'manual', unit: unitForEquipment(ex.equipment), cats: [] };
}

const IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

export function imageUrl(path: string): string {
  return IMAGE_BASE + path;
}

/** Drop a plural 's' so "raises" matches "raise" (but not "press" → "pres"). */
function singular(t: string): string {
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t;
}

/**
 * Gym-name synonyms: a query term also matches if the name contains any of its
 * synonyms. The dataset (free-exercise-db) uses one canonical name per movement,
 * so e.g. the standing dumbbell "lateral raise" is filed as "Side Lateral
 * Raise". Keyed and valued by singular form.
 */
const SYNONYMS: Record<string, string[]> = {
  lateral: ['side'],
  side: ['lateral'],
  db: ['dumbbell'],
  dumbbell: ['db'],
  ohp: ['overhead', 'shoulder', 'military'],
  overhead: ['military'],
  military: ['overhead'],
  chinup: ['chin'],
  pullup: ['pull'],
  pushup: ['push'],
  glute: ['hip'],
  ab: ['abdominal', 'crunch'],
};

/**
 * Filler/position words that shouldn't exclude a match on their own — the
 * dataset rarely spells them out (e.g. there's no "Standing Lateral Raise",
 * only "Side Lateral Raise"). They still count when they happen to match.
 */
const OPTIONAL_TERMS = new Set(['standing', 'the', 'a', 'with', 'and', 'of', 'for']);

/**
 * Multi-word gym nicknames rewritten to the dataset's clinical wording before
 * tokenising. free-exercise-db never uses these nicknames, so e.g. a search for
 * "dumbbell skullcrusher" would miss "Lying Dumbbell Tricep Extension" without
 * this. Applied as whole-word replacements on the lowercased query.
 */
const PHRASE_ALIASES: [RegExp, string][] = [
  [/\bskull ?crushers?\b/g, 'lying triceps extension'],
  [/\brdls?\b/g, 'romanian deadlift'],
  [/\bsldls?\b/g, 'stiff leg deadlift'],
  [/\bgood ?mornings?\b/g, 'good morning'],
  [/\bpull ?downs?\b/g, 'pulldown'],
  [/\bpec ?decks?\b/g, 'butterfly'],
  [/\breverse (fly|flye)s?\b/g, 'rear delt'],
  [/\bkickbacks?\b/g, 'triceps kickback'],
];

function applyAliases(q: string): string {
  return PHRASE_ALIASES.reduce((s, [re, rep]) => s.replace(re, rep), q);
}

/** Does the exercise name satisfy a single query term (plural- and synonym-aware)? */
function matchesTerm(name: string, term: string): boolean {
  const s = singular(term);
  if (name.includes(term) || name.includes(s)) return true;
  return (SYNONYMS[s] ?? []).some((syn) => name.includes(syn));
}

/**
 * Library exercises whose name contains every meaningful query term. Terms are
 * matched plural-tolerantly and via gym-name synonyms, and filler words like
 * "standing" are optional — so "standing lateral raises" finds "Side Lateral
 * Raise".
 */
export function searchLibrary(query: string, equip: EquipKey | null = null, limit = 80): LibraryExercise[] {
  const all = applyAliases(query.toLowerCase()).split(/\s+/).filter(Boolean);
  if (all.length === 0) return [];
  // Require the meaningful terms; keep filler words only if something else matched.
  const required = all.filter((t) => !OPTIONAL_TERMS.has(t));
  const terms = required.length > 0 ? required : all;
  const out: LibraryExercise[] = [];
  for (const ex of LIBRARY) {
    if (equip && !matchesEquip(ex.equipment, equip)) continue;
    const name = ex.name.toLowerCase();
    if (terms.every((t) => matchesTerm(name, t))) {
      out.push(ex);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Library exercises in a muscle group (capped for rendering). */
export function libraryInGroup(group: MuscleGroup, equip: EquipKey | null = null, limit = 120): LibraryExercise[] {
  const out: LibraryExercise[] = [];
  for (const ex of LIBRARY) {
    if (equip && !matchesEquip(ex.equipment, equip)) continue;
    if (groupOfMuscles(ex.muscles) === group) {
      out.push(ex);
      if (out.length >= limit) break;
    }
  }
  return out;
}

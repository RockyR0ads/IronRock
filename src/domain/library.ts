import type { Lift } from './types';
import raw from '../data/exercises.json';

/** A record from the bundled free-exercise-db (public domain). */
export interface LibraryExercise {
  id: string;
  name: string;
  equipment: string | null;
  muscles: string[];
  images: string[];
  instructions: string[];
}

export const LIBRARY = raw as LibraryExercise[];

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

/** Present a library exercise as a Lift for the logging machinery (always manual). */
export function libraryLift(ex: LibraryExercise): Lift {
  return { id: ex.id, name: ex.name, type: 'manual', unit: unitForEquipment(ex.equipment), cats: [] };
}

const IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

export function imageUrl(path: string): string {
  return IMAGE_BASE + path;
}

/** Library exercises whose name contains every whitespace-separated term. */
export function searchLibrary(query: string, limit = 80): LibraryExercise[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const out: LibraryExercise[] = [];
  for (const ex of LIBRARY) {
    const name = ex.name.toLowerCase();
    if (terms.every((t) => name.includes(t))) {
      out.push(ex);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Library exercises in a muscle group (capped for rendering). */
export function libraryInGroup(group: MuscleGroup, limit = 120): LibraryExercise[] {
  const out: LibraryExercise[] = [];
  for (const ex of LIBRARY) {
    if (groupOfMuscles(ex.muscles) === group) {
      out.push(ex);
      if (out.length >= limit) break;
    }
  }
  return out;
}

// How the weight on a set is entered: the total load moved, or the load on one
// side (one dumbbell, one handle, one arm of a plate-loaded machine). Volume is
// weight × reps × sides, so a per-side entry on a two-handed lift counts twice.
// The choice is a per-lift setting; the volume maths reads it from a registry
// mirrored from state (like the custom routine), so pure stats code needn't
// thread state through.

import { LIFTS } from './lifts';
import { LIBRARY_BY_ID, unitForEquipment } from './library';
import { setReps } from './stats';
import type { LoggedSet } from './types';

export type LoadEntry = 'total' | 'perSide';

let chosen: Record<string, LoadEntry> = {};

/** Mirror the lifter's per-lift choices (from exerciseConfig) into the registry. */
export function setLoadEntries(config: Record<string, { loadEntry?: LoadEntry }>): void {
  chosen = {};
  for (const [id, c] of Object.entries(config)) if (c.loadEntry) chosen[id] = c.loadEntry;
}

function unitOf(liftId: string): string {
  const built = LIFTS[liftId];
  if (built) return built.unit;
  const lib = LIBRARY_BY_ID[liftId];
  return lib ? unitForEquipment(lib.equipment) : '';
}

/** Dumbbell lifts are entered per dumbbell; everything else as the total. */
export function defaultLoadEntry(liftId: string): LoadEntry {
  const lift = LIFTS[liftId];
  // a one-arm lift moves one dumbbell, so per-DB already is the total
  if (lift?.uni) return 'total';
  return unitOf(liftId) === 'kg / DB' ? 'perSide' : 'total';
}

export function loadEntryFor(liftId: string): LoadEntry {
  return chosen[liftId] ?? defaultLoadEntry(liftId);
}

/** How many times the entered weight is moved per rep. */
export function loadFactor(liftId: string, set: Pick<LoggedSet, 'perSide'>): number {
  // L/R-logged sets already sum both sides' reps, each side moving the weight once
  if (set.perSide) return 1;
  return loadEntryFor(liftId) === 'perSide' ? 2 : 1;
}

const num = (s: string | undefined) => {
  const n = parseFloat(s ?? '');
  return Number.isFinite(n) ? n : 0;
};

/** A set's volume (kg moved), honouring how its weight was entered. */
export function setVolume(liftId: string | undefined, set: LoggedSet, add = 0): number {
  const factor = liftId ? loadFactor(liftId, set) : 1;
  return (num(set.w) + add) * setReps(set) * factor;
}

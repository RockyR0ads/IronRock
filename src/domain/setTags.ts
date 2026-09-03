import type { LoggedSet, SetQuality, SetFlag, SetType } from './types';

/**
 * Structured per-set nuance: how the set actually went, captured as quick taps
 * rather than prose. `quality` is single-choice technique; `flags` are occasional
 * modifiers. Colours here drive both the picker chips and the glanceable markers.
 */

export interface QualityMeta {
  id: SetQuality;
  label: string;
  /** A hex used for the chip + row marker. */
  color: string;
  /** Reads as a problem worth flagging on the row. */
  concern: boolean;
}

export const QUALITY: QualityMeta[] = [
  { id: 'clean', label: 'Clean', color: '#41C277', concern: false },
  { id: 'grindy', label: 'Grindy', color: '#F0BE4B', concern: true },
  { id: 'broke', label: 'Form broke', color: '#FF5247', concern: true },
  { id: 'short', label: 'Cut short', color: '#FF5247', concern: true },
];

export interface FlagMeta {
  id: SetFlag;
  label: string;
  /** Short label for the compact row/history marker. */
  short: string;
  color: string;
  concern: boolean;
}

export const FLAGS: FlagMeta[] = [
  { id: 'pain', label: 'Pain / tweak', short: 'Pain', color: '#FF5247', concern: true },
  { id: 'assisted', label: 'Assisted / forced', short: 'Assist', color: '#9AA0A8', concern: false },
  { id: 'pr', label: 'PR / best', short: 'PR', color: '#2DD4BF', concern: false },
];

/** A special working-set type (drop, failure, rest-pause, myo-reps). */
export interface SetTypeMeta {
  id: SetType;
  label: string;
  /** Compact badge shown in the set-number cell and history. */
  short: string;
  blurb: string;
  color: string;
}

export const SET_TYPES: SetTypeMeta[] = [
  { id: 'drop', label: 'Drop set', short: 'D', blurb: 'Strip the weight and keep going past failure.', color: '#C08BF5' },
  { id: 'failure', label: 'To failure', short: 'F', blurb: 'Taken to muscular failure.', color: '#FF5247' },
  { id: 'restpause', label: 'Rest-pause', short: 'RP', blurb: 'Short rests inside one set for extra reps.', color: '#5AC8FA' },
  { id: 'myo', label: 'Myo-reps', short: 'M', blurb: 'An activation set, then mini-sets.', color: '#FF9F45' },
];

export const SET_TYPE_BY_ID: Record<string, SetTypeMeta> = Object.fromEntries(
  SET_TYPES.map((t) => [t.id, t])
);

/** Metadata for a set's type, or undefined for an ordinary straight set. */
export function setTypeMeta(type: SetType | undefined): SetTypeMeta | undefined {
  return type ? SET_TYPE_BY_ID[type] : undefined;
}

export const QUALITY_BY_ID: Record<string, QualityMeta> = Object.fromEntries(
  QUALITY.map((q) => [q.id, q])
);
export const FLAG_BY_ID: Record<string, FlagMeta> = Object.fromEntries(FLAGS.map((f) => [f.id, f]));

/** Does the set carry any logged nuance (note, quality, or flags)? */
export function hasSetDetail(set: Pick<LoggedSet, 'note' | 'quality' | 'flags'>): boolean {
  return !!(set.note || set.quality || (set.flags && set.flags.length > 0));
}

/**
 * The colour to mark a set's row with, if any: the most severe signal wins —
 * a concerning quality or flag (red/amber) over a benign one, over nothing.
 */
export function setMarkerColor(
  set: Pick<LoggedSet, 'quality' | 'flags'>
): string | null {
  const q = set.quality ? QUALITY_BY_ID[set.quality] : undefined;
  const flagMetas = (set.flags ?? []).map((f) => FLAG_BY_ID[f]).filter(Boolean);
  const concerns = [q, ...flagMetas].filter((m): m is QualityMeta | FlagMeta => !!m && m.concern);
  // red beats amber beats a benign colour
  const red = concerns.find((m) => m.color === '#FF5247');
  if (red) return red.color;
  const amber = concerns.find((m) => m.color === '#F0BE4B');
  if (amber) return amber.color;
  if (q) return q.color;
  const firstFlag = flagMetas[0];
  return firstFlag ? firstFlag.color : null;
}

// Cable attachments: the handle clipped onto a cable stack changes the lift
// (a rope pushdown and a bar pushdown load differently), so cable exercises
// carry an attachment choice instead of a separate exercise per handle.
// The choice is a standing per-lift setting, stamped onto each logged session.

import { LIBRARY_BY_ID } from './library';
import { muscleGroupOf } from './overview';
import type { Lift } from './types';

export type BodyPart = 'Arms' | 'Back' | 'Shoulders' | 'Chest' | 'Legs' | 'Core';

/** Body-part cards shown first, so the handle list stays short. */
export const BODY_PARTS: BodyPart[] = ['Arms', 'Back', 'Shoulders', 'Chest', 'Legs', 'Core'];

export interface Attachment {
  id: string;
  label: string;
  /** Body parts this handle is a staple for (drives the first-step filter). */
  parts: BodyPart[];
}

export const ATTACHMENTS: Attachment[] = [
  { id: 'rope', label: 'Rope', parts: ['Arms', 'Back', 'Shoulders', 'Legs', 'Core'] },
  { id: 'straight', label: 'Straight bar', parts: ['Arms', 'Back', 'Shoulders'] },
  { id: 'revolving', label: 'Revolving bar', parts: ['Arms'] },
  { id: 'ez', label: 'EZ curl bar', parts: ['Arms'] },
  { id: 'vbar', label: 'V-bar', parts: ['Arms'] },
  { id: 'lat', label: 'Wide lat bar', parts: ['Back'] },
  { id: 'neutrallat', label: 'Neutral-grip lat bar', parts: ['Back'] },
  { id: 'closegrip', label: 'Close-grip row handle', parts: ['Back'] },
  { id: 'mag', label: 'MAG grip', parts: ['Back'] },
  { id: 'tbar', label: 'Wide row bar', parts: ['Back'] },
  { id: 'single', label: 'D-handle', parts: ['Arms', 'Back', 'Shoulders', 'Chest', 'Core'] },
  { id: 'double', label: 'Pair of D-handles', parts: ['Chest', 'Shoulders', 'Back'] },
  { id: 'stirrup', label: 'Stirrup handle', parts: ['Arms', 'Shoulders', 'Chest'] },
  { id: 'cuff', label: 'Wrist cuff', parts: ['Shoulders'] },
  { id: 'ankle', label: 'Ankle strap', parts: ['Legs', 'Core'] },
  { id: 'harness', label: 'Ab crunch harness', parts: ['Core'] },
  { id: 'none', label: 'Bare cable', parts: ['Shoulders', 'Chest'] },
];

/** Handles that are staples for a body part. */
export function attachmentsFor(part: BodyPart): Attachment[] {
  return ATTACHMENTS.filter((a) => a.parts.includes(part));
}

/** Built-in cable lifts and the handle they're usually done with. */
const CABLE_DEFAULTS: Record<string, string> = {
  pushdown: 'straight',
  cableohext: 'rope',
  cablecurl: 'straight',
  reversecurl: 'straight',
  latpulldown: 'lat',
  cablefly: 'double',
  reversecablefly: 'none',
  cablelatraise: 'single',
  cableyraise: 'single',
  facepull: 'rope',
  singlecablerow: 'single',
  straightarmpd: 'straight',
  cablerow: 'vbar',
  ropepushdown: 'rope',
  singlepushdown: 'single',
  leanlatraise: 'single',
};

/**
 * Lifts whose handle is part of the exercise (a rope pushdown is always a
 * rope) — no picker for these; the attachment is just recorded.
 */
const FIXED: Record<string, string> = {
  ropepushdown: 'rope',
  cableohext: 'rope',
  facepull: 'rope',
  singlepushdown: 'single',
  singlecablerow: 'single',
  leanlatraise: 'single',
  latpulldown: 'lat',
};

/** The handle a lift is defined by, from the table or its name; else undefined. */
export function fixedAttachment(lift: Lift): string | undefined {
  if (FIXED[lift.id]) return FIXED[lift.id];
  if (!isCable(lift)) return undefined;
  const n = lift.name;
  if (/\brope\b/i.test(n)) return 'rope';
  if (/\bv[- ]?bar\b/i.test(n)) return 'vbar';
  if (/\bstraight[- ]bar\b/i.test(n)) return 'straight';
  if (/\bez[- ]?bar\b/i.test(n)) return 'ez';
  if (/\bankle\b/i.test(n)) return 'ankle';
  if (/\b(single|one)[- ]arm\b/i.test(n)) return 'single';
  return undefined;
}

/** Cable lift where the handle is a real choice (so show the picker). */
export function attachmentChoosable(lift: Lift): boolean {
  return isCable(lift) && !fixedAttachment(lift);
}

/** Is this lift done on a cable stack (so an attachment applies)? */
export function isCable(lift: Lift): boolean {
  if (lift.id in CABLE_DEFAULTS) return true;
  const lib = LIBRARY_BY_ID[lift.lib ?? lift.id];
  if (lib) return lib.equipment === 'cable';
  return /\bcable\b/i.test(lift.name);
}

/** The lift's usual attachment, before the lifter picks one. */
export function defaultAttachment(lift: Lift): string {
  return CABLE_DEFAULTS[lift.id] ?? 'single';
}

/** The attachment in use: the lifter's choice, else the lift's usual one. */
export function attachmentFor(lift: Lift, chosen: string | undefined): string | undefined {
  if (!isCable(lift)) return undefined;
  return fixedAttachment(lift) ?? chosen ?? defaultAttachment(lift);
}

export function attachmentLabel(id: string | undefined): string {
  return ATTACHMENTS.find((a) => a.id === id)?.label ?? '';
}

/** The body part a lift trains, as one of the attachment picker's cards. */
export function bodyPartOf(liftId: string, customGroups: Record<string, string> = {}): BodyPart | undefined {
  const g = muscleGroupOf(liftId, customGroups);
  return (BODY_PARTS as string[]).includes(g) ? (g as BodyPart) : undefined;
}

export function isBodyPart(g: string): g is BodyPart {
  return (BODY_PARTS as string[]).includes(g);
}

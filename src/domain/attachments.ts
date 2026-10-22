// Cable attachments: the handle clipped onto a cable stack changes the lift
// (a rope pushdown and a bar pushdown load differently), so cable exercises
// carry an attachment choice instead of a separate exercise per handle.
// The choice is a standing per-lift setting, stamped onto each logged session.

import { LIBRARY_BY_ID } from './library';
import type { Lift } from './types';

export interface Attachment {
  id: string;
  label: string;
}

export const ATTACHMENTS: Attachment[] = [
  { id: 'rope', label: 'Rope' },
  { id: 'straight', label: 'Straight bar' },
  { id: 'ez', label: 'EZ bar' },
  { id: 'vbar', label: 'V-bar' },
  { id: 'lat', label: 'Lat bar (wide)' },
  { id: 'closegrip', label: 'Close-grip handle' },
  { id: 'single', label: 'Single D-handle' },
  { id: 'double', label: 'Two D-handles' },
  { id: 'mag', label: 'MAG grip' },
  { id: 'ankle', label: 'Ankle strap' },
  { id: 'none', label: 'No attachment' },
];

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
  return chosen ?? defaultAttachment(lift);
}

export function attachmentLabel(id: string | undefined): string {
  return ATTACHMENTS.find((a) => a.id === id)?.label ?? '';
}

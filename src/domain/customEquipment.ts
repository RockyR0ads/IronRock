// What a custom exercise is done on. Stored on the exercise (not just folded
// into its logging unit) so "Lateral raise" on a machine reads as a machine
// everywhere it shows up.

export const CUSTOM_EQUIPMENT = [
  { label: 'Machine', unit: 'kg' },
  { label: 'Cable', unit: 'kg' },
  { label: 'Dumbbell', unit: 'kg / DB' },
  { label: 'Barbell', unit: 'kg on bar' },
  { label: 'Smith machine', unit: 'kg on bar' },
  { label: 'Kettlebell', unit: 'kg' },
  { label: 'Band', unit: 'kg' },
  { label: 'Bodyweight', unit: 'bodyweight' },
  { label: 'Other', unit: 'kg' },
] as const;

export type CustomEquipment = (typeof CUSTOM_EQUIPMENT)[number]['label'];

export function unitForCustomEquipment(eq: string): string {
  return CUSTOM_EQUIPMENT.find((e) => e.label === eq)?.unit ?? 'kg';
}

/**
 * The equipment of a custom exercise: what was chosen, or — for ones made
 * before equipment was stored — what its unit gives away. Plain "kg" could be
 * a machine, cable or anything else, so that stays unknown.
 */
export function customEquipment(c: { unit: string; equipment?: string }): string | undefined {
  if (c.equipment) return c.equipment;
  if (c.unit === 'kg on bar') return 'Barbell';
  if (c.unit === 'kg / DB') return 'Dumbbell';
  if (c.unit === 'bodyweight') return 'Bodyweight';
  return undefined;
}

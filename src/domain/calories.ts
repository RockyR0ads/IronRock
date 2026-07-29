/**
 * Calorie targets for a cut. Maintenance (TDEE) is estimated with the
 * Mifflin–St Jeor BMR equation × an activity multiplier; the daily target is
 * maintenance minus the deficit implied by the weight goal.
 */

export type Sex = 'male' | 'female';

/** One-time details needed to estimate maintenance calories. */
export interface Profile {
  /** Height in cm (raw input). */
  heightCm?: string;
  /** Age in years (raw input). */
  age?: string;
  sex?: Sex;
  /** Activity level id (see ACTIVITY_LEVELS). */
  activity?: string;
}

export interface ActivityLevel {
  id: string;
  label: string;
  mult: number;
  note: string;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary', label: 'Sedentary', mult: 1.2, note: 'Desk job, little exercise' },
  { id: 'light', label: 'Light', mult: 1.375, note: '1–3 sessions a week' },
  { id: 'moderate', label: 'Moderate', mult: 1.55, note: '3–5 sessions a week' },
  { id: 'active', label: 'Active', mult: 1.725, note: '6–7 sessions a week' },
];

/** Roughly the energy in a kg of body fat. */
export const KCAL_PER_KG = 7700;

export interface CalorieTarget {
  /** Basal metabolic rate. */
  bmr: number;
  /** Maintenance calories (TDEE). */
  maintenance: number;
  /** Daily deficit applied to hit the goal. */
  deficit: number;
  /** Daily calorie target (maintenance − deficit). */
  target: number;
}

/** All the profile fields needed for an estimate are filled. */
export function profileComplete(p: Profile): boolean {
  return (
    parseFloat(p.heightCm ?? '') > 0 &&
    parseFloat(p.age ?? '') > 0 &&
    !!p.sex &&
    !!p.activity
  );
}

/** Mifflin–St Jeor basal metabolic rate. */
export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Daily calorie deficit for a weekly loss rate (kg/week). */
export function deficitForRate(kgPerWeek: number): number {
  return (kgPerWeek * KCAL_PER_KG) / 7;
}

/**
 * Maintenance and a daily target for a given bodyweight and required daily
 * deficit, or null if the profile isn't complete.
 */
export function calorieTarget(
  p: Profile,
  weightKg: number,
  deficitPerDay: number
): CalorieTarget | null {
  if (!profileComplete(p) || !(weightKg > 0)) return null;
  const cm = parseFloat(p.heightCm!);
  const age = parseFloat(p.age!);
  const mult = ACTIVITY_LEVELS.find((a) => a.id === p.activity)?.mult ?? 1.2;

  const bmr = bmrMifflin(p.sex!, weightKg, cm, age);
  const maintenance = Math.round(bmr * mult);
  const deficit = Math.max(0, Math.round(deficitPerDay));
  return { bmr: Math.round(bmr), maintenance, deficit, target: maintenance - deficit };
}

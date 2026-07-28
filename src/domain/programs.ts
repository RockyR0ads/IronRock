import { PROGRAM_PROFILE } from './programInfo';

/** Where a program came from: your own plan, or a well-known published one. */
export type ProgramOrigin = 'custom' | 'staple';

export type ProgramLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/** A selectable training program. */
export interface ProgramMeta {
  id: string;
  name: string;
  /** One-line description of the plan. */
  tagline: string;
  /** What it's for / who it suits. */
  focus: string;
  /** Training days per week. */
  days: number;
  level: ProgramLevel;
  origin: ProgramOrigin;
  /** Fully wired with day-by-day data (drives the week & tracker). */
  ready?: boolean;
  /** Block / cycle length in weeks, when fixed. */
  weeks?: number;
}

/**
 * The program catalogue. The PPL cut is the built-in plan the app is designed
 * around and the only one fully wired to drive the week; the rest are popular
 * published programs listed for reference, ready to be built out.
 */
export const PROGRAMS: ProgramMeta[] = [
  {
    id: 'ppl-cut',
    name: 'PPL · Cut',
    tagline: PROGRAM_PROFILE.tagline,
    focus: 'Push / Pull / Legs ×2 — hold strength on a deficit, grow the arms.',
    days: 6,
    level: 'Intermediate',
    origin: 'custom',
    ready: true,
    weeks: 6,
  },
  {
    id: 'starting-strength',
    name: 'Starting Strength',
    tagline: 'The classic barbell linear progression.',
    focus: 'Squat, press and pull full-body, adding weight every session. Fastest beginner gains.',
    days: 3,
    level: 'Beginner',
    origin: 'staple',
  },
  {
    id: 'stronglifts-5x5',
    name: 'StrongLifts 5×5',
    tagline: 'Two alternating full-body days, 5×5.',
    focus: 'Five compounds across A/B workouts, +2.5 kg each session. Simple and effective.',
    days: 3,
    level: 'Beginner',
    origin: 'staple',
  },
  {
    id: 'gzclp',
    name: 'GZCLP',
    tagline: 'GZCL linear progression, tiered by intensity.',
    focus: 'T1 heavy, T2 volume, T3 accessories — structured beginner-to-intermediate strength.',
    days: 4,
    level: 'Beginner',
    origin: 'staple',
  },
  {
    id: 'madcow-5x5',
    name: 'Madcow 5×5',
    tagline: 'Weekly-progression 5×5 for when linear stalls.',
    focus: 'Ramping sets to a top 5, progressing week to week instead of session to session.',
    days: 3,
    level: 'Intermediate',
    origin: 'staple',
  },
  {
    id: 'texas-method',
    name: 'Texas Method',
    tagline: 'Volume, recovery and intensity across the week.',
    focus: 'A volume day, a light day, then a weekly PR day — the step up from linear progression.',
    days: 3,
    level: 'Intermediate',
    origin: 'staple',
  },
  {
    id: 'wendler-531',
    name: '5/3/1 · BBB',
    tagline: 'Percentage-based waves, Boring But Big volume.',
    focus: 'Slow, sustainable strength off your training max, with 5×10 supplemental volume.',
    days: 4,
    level: 'Intermediate',
    origin: 'staple',
    ready: true,
    weeks: 4,
  },
  {
    id: 'nsuns-531',
    name: 'nSuns 531 LP',
    tagline: 'High-volume 5/3/1 with daily top sets.',
    focus: 'Auto-regulated linear progression on big lifts — a lot of volume, fast progress.',
    days: 5,
    level: 'Intermediate',
    origin: 'staple',
  },
  {
    id: 'phul',
    name: 'PHUL',
    tagline: 'Power & hypertrophy, upper/lower split.',
    focus: 'Two heavy power days and two higher-rep hypertrophy days for size and strength.',
    days: 4,
    level: 'Intermediate',
    origin: 'staple',
  },
  {
    id: 'phat',
    name: 'PHAT',
    tagline: "Layne Norton's power-hypertrophy adaptive training.",
    focus: 'Two power days and three hypertrophy days — high frequency, high volume for mass.',
    days: 5,
    level: 'Advanced',
    origin: 'staple',
  },
  {
    id: 'reddit-ppl',
    name: 'Reddit PPL',
    tagline: 'The r/Fitness 6-day Push/Pull/Legs.',
    focus: 'A popular high-frequency PPL run six days a week, built on 5/3/1-style main lifts.',
    days: 6,
    level: 'Intermediate',
    origin: 'staple',
  },
];

export const DEFAULT_PROGRAM = PROGRAMS[0].id;

export function programMeta(id: string): ProgramMeta | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

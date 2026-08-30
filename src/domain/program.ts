import type { Day } from './types';

/**
 * The six-day Push/Pull/Legs week, ported exactly from the reference.
 * Push A (heavy), Pull A (heavy), Legs A (strength),
 * Push B (volume), Pull B (volume), Legs B (strength).
 */
export const DAYS: Day[] = [
  {
    key: 'pushA',
    label: 'Push',
    variant: 'A · heavy',
    note: 'Heavy press lead. Triceps volume after.',
    blocks: [
      { lift: 'bench', sets: 4, reps: 5, rpe: 8, cls: 'r-hi', cat: 'hpress', prog: 'hold' },
      { lift: 'ohp', sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cablelatraise', sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'cgbench', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'triceps', prog: 'hold' },
      { lift: 'cableohext', sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'triceps', prog: 'push' },
      { lift: 'skull', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
    ],
  },
  {
    key: 'pullA',
    label: 'Pull',
    variant: 'A · heavy',
    note: 'Heavy vertical + horizontal. Biceps volume after.',
    blocks: [
      { lift: 'pullup', sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'row', sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'hpull', prog: 'hold' },
      { lift: 'facepull', sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', prog: 'push' },
      { lift: 'ezcurl', sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'inclinecurl', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'hammer', sets: 2, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'legsA',
    label: 'Legs',
    variant: 'A · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'squat', sets: 5, reps: 3, rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'rdl', sets: 3, reps: [4, 5], rpe: 8, cls: 'r-hi', cat: 'hinge', prog: 'hold' },
      { lift: 'calf', sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf', prog: 'push' },
    ],
  },
  {
    key: 'pushB',
    label: 'Push',
    variant: 'B · volume',
    note: 'Incline-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'dbincline', sets: 4, reps: 8, rpe: 7, cls: 'r-mid', cat: 'hpress', drift: true, prog: 'hold' },
      { lift: 'dbohp', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpress', prog: 'hold' },
      { lift: 'cablelatraise', sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'latdelt', prog: 'push' },
      { lift: 'dips', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-iso', cat: 'triceps', prog: 'hold' },
      { lift: 'skull', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'triceps', prog: 'push' },
      { lift: 'cableohext', sets: 3, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'triceps', prog: 'push' },
    ],
  },
  {
    key: 'pullB',
    label: 'Pull',
    variant: 'B · volume',
    note: 'Row-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'csrow', sets: 4, reps: 10, rpe: 7, cls: 'r-mid', cat: 'hpull', drift: true, prog: 'hold' },
      { lift: 'pullup', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpull', prog: 'hold' },
      { lift: 'facepull', sets: 3, reps: [12, 15], rpe: 9, cls: 'r-iso', cat: 'reardelt', prog: 'push' },
      { lift: 'inclinecurl', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'ezcurl', sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'biceps', prog: 'push' },
      { lift: 'hammer', sets: 2, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps', prog: 'push' },
    ],
  },
  {
    key: 'legsB',
    label: 'Legs',
    variant: 'B · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'frontsquat', sets: 4, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'squat', prog: 'hold' },
      { lift: 'bss', sets: 3, reps: 5, rpe: 8, cls: 'r-hi', cat: 'uni', perLeg: true, prog: 'hold' },
      { lift: 'calf', sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf', prog: 'push' },
    ],
  },
];

export function defaultDay(key: string): Day | undefined {
  return DAYS.find((d) => d.key === key);
}

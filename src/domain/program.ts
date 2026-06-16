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
      { lift: 'bench', sets: 4, reps: 5, rpe: 8, cls: 'r-hi', cat: 'hpress' },
      { lift: 'ohp', sets: 3, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpress' },
      { lift: 'latraise', sets: 3, reps: 15, rpe: 9, cls: 'r-iso', cat: 'latdelt' },
      { lift: 'cgbench', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'triceps' },
      { lift: 'ohext', sets: 3, reps: 12, rpe: 9, cls: 'r-iso', cat: 'triceps' },
      { lift: 'skull', sets: 3, reps: 12, rpe: '9–10', cls: 'r-iso', cat: 'triceps' },
    ],
  },
  {
    key: 'pullA',
    label: 'Pull',
    variant: 'A · heavy',
    note: 'Heavy vertical + horizontal. Biceps volume after.',
    blocks: [
      { lift: 'pullup', sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'vpull' },
      { lift: 'row', sets: 4, reps: [6, 8], rpe: 8, cls: 'r-hi', cat: 'hpull' },
      { lift: 'reardelt', sets: 3, reps: 15, rpe: 9, cls: 'r-iso', cat: 'reardelt' },
      { lift: 'ezcurl', sets: 3, reps: [8, 10], rpe: 9, cls: 'r-iso', cat: 'biceps' },
      { lift: 'inclinecurl', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps' },
      { lift: 'hammer', sets: 2, reps: 12, rpe: '9–10', cls: 'r-iso', cat: 'biceps' },
    ],
  },
  {
    key: 'legsA',
    label: 'Legs',
    variant: 'A · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'squat', sets: 5, reps: 3, rpe: 8, cls: 'r-hi', cat: 'squat' },
      { lift: 'rdl', sets: 3, reps: [4, 5], rpe: 8, cls: 'r-hi', cat: 'hinge' },
      { lift: 'calf', sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf' },
    ],
  },
  {
    key: 'pushB',
    label: 'Push',
    variant: 'B · volume',
    note: 'Incline-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'dbincline', sets: 4, reps: 8, rpe: 7, cls: 'r-mid', cat: 'hpress', drift: true },
      { lift: 'dbohp', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpress' },
      { lift: 'latraise', sets: 3, reps: 15, rpe: 9, cls: 'r-iso', cat: 'latdelt' },
      { lift: 'dips', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-iso', cat: 'triceps' },
      { lift: 'skull', sets: 3, reps: 12, rpe: '9–10', cls: 'r-iso', cat: 'triceps' },
      { lift: 'ohext', sets: 3, reps: 12, rpe: 9, cls: 'r-iso', cat: 'triceps' },
    ],
  },
  {
    key: 'pullB',
    label: 'Pull',
    variant: 'B · volume',
    note: 'Row-led volume. First lift starts RPE 7.',
    blocks: [
      { lift: 'csrow', sets: 4, reps: 10, rpe: 7, cls: 'r-mid', cat: 'hpull', drift: true },
      { lift: 'pullup', sets: 3, reps: [8, 10], rpe: 8, cls: 'r-hi', cat: 'vpull' },
      { lift: 'reardelt', sets: 3, reps: 15, rpe: 9, cls: 'r-iso', cat: 'reardelt' },
      { lift: 'inclinecurl', sets: 3, reps: [10, 12], rpe: '9–10', cls: 'r-iso', cat: 'biceps' },
      { lift: 'ezcurl', sets: 3, reps: 10, rpe: 9, cls: 'r-iso', cat: 'biceps' },
      { lift: 'hammer', sets: 2, reps: 12, rpe: '9–10', cls: 'r-iso', cat: 'biceps' },
    ],
  },
  {
    key: 'legsB',
    label: 'Legs',
    variant: 'B · strength',
    note: 'Heavy, crisp, no grinding. Stronger — not bigger.',
    blocks: [
      { lift: 'frontsquat', sets: 4, reps: [3, 5], rpe: 8, cls: 'r-hi', cat: 'squat' },
      { lift: 'bss', sets: 3, reps: 5, rpe: 8, cls: 'r-hi', cat: 'uni', perLeg: true },
      { lift: 'calf', sets: 4, reps: [10, 12], rpe: 9, cls: 'r-iso', cat: 'calf' },
    ],
  },
];

export function defaultDay(key: string): Day | undefined {
  return DAYS.find((d) => d.key === key);
}

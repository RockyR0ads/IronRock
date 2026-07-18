import type { WarmupFeel } from './types';

/** A warm-up feel option: the code, a short label, the full relative phrase, and what it means. */
export interface FeelOption {
  value: WarmupFeel;
  /** Short label, e.g. "Easier". */
  label: string;
  /** Full relative phrase, e.g. "Same as usual". */
  phrase: string;
  blurb: string;
}

/** The warm-up feel scale, from freshest to most fatigued. */
export const FEEL_OPTIONS: FeelOption[] = [
  { value: 'E', label: 'Easier', phrase: 'Easier than usual', blurb: 'Moved better than usual — feeling strong today.' },
  { value: 'S', label: 'Same', phrase: 'Same as usual', blurb: 'Felt about normal for this weight.' },
  { value: 'H', label: 'Harder', phrase: 'Harder than usual', blurb: 'Heavier or slower than usual — take it steady.' },
];

const BY_VALUE: Record<WarmupFeel, FeelOption> = {
  E: FEEL_OPTIONS[0],
  S: FEEL_OPTIONS[1],
  H: FEEL_OPTIONS[2],
};

/** The option for a feel code. */
export function feelOption(value: WarmupFeel): FeelOption {
  return BY_VALUE[value];
}

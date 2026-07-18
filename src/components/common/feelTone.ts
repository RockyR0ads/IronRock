import type { WarmupFeel } from '../../domain/types';

/** Warm-up feel code → pill/button colouring, as a readiness cue (fresh → fatigued). */
export const FEEL_TONE: Record<WarmupFeel, string> = {
  E: 'border-green/50 bg-green/15 text-green',
  S: 'border-blue/50 bg-blue/15 text-blue',
  H: 'border-red/50 bg-red/15 text-red',
};

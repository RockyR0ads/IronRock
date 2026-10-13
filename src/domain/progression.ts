import { round } from './calc';
import { rpeNum } from './format';
import type { Block, Increment, LiftHistory } from './types';

/**
 * Suggest the load and reps to open the next session of a lift with, from how
 * last session's top set went — the program's own progression rule made
 * automatic so you're not re-deciding every time.
 *
 * - `push` slots (arms, delts, isolation) double-progress: build reps to the
 *   top of the range, then add the smallest step and drop back to the bottom.
 * - `hold` slots (RPE-capped compounds) only add load when the top of the range
 *   was reached at or under the target RPE; otherwise repeat the same weight.
 *
 * Upper-body lifts step by 2.5 kg, squats and deadlifts by 5 kg (rounded to the
 * user's increment).
 */

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const topReps = (b: Block) => (Array.isArray(b.reps) ? b.reps[1] : b.reps);
const botReps = (b: Block) => (Array.isArray(b.reps) ? b.reps[0] : b.reps);

export interface Suggestion {
  /** Suggested working weight (kg). */
  w: number;
  /** Suggested rep target. */
  reps: number;
  /** True when the weight went up from last session. */
  bumped: boolean;
  /** Short reason, e.g. "+2.5 · hit 8 @ RPE ≤ 8" or "build to 12 reps". */
  note: string;
}

export function suggestNext(
  block: Block,
  history: LiftHistory | undefined,
  inc: Increment
): Suggestion | null {
  if (!history) return null;
  const w = num(history.w);
  const reps = num(history.reps);
  const rpe = num(history.rpe);
  if (w <= 0 || reps <= 0) return null;

  const top = topReps(block);
  const bot = botReps(block);
  const targetRpe = rpeNum(block.rpe);
  const step = block.cat === 'squat' || block.cat === 'hinge' ? 5 : 2.5;
  const hitTop = reps >= top;
  const underRpe = rpe === 0 || rpe <= targetRpe; // unrated → assume it was fine

  if (block.prog === 'push') {
    if (hitTop) {
      return { w: round(w + step, inc), reps: bot, bumped: true, note: `+${step} · hit ${top} reps` };
    }
    return { w, reps, bumped: false, note: `beat ${reps} reps to add load` };
  }

  // default + 'hold': RPE-capped compound
  if (hitTop && underRpe) {
    return {
      w: round(w + step, inc),
      reps: bot,
      bumped: true,
      note: `+${step} · ${top} @ RPE ≤ ${targetRpe}`,
    };
  }
  return {
    w,
    reps,
    bumped: false,
    note: hitTop ? 'hold · RPE was high' : `hold · build to ${top} reps`,
  };
}

import type { ActiveWorkout } from '../state/selectors';
import { useRestTimer } from '../state/RestTimer';
import { Dumbbell, ChevronRight } from './common/icons';

/**
 * A hero banner pinned to the top of the app while a workout is in progress, so
 * it's obvious you've got one on the go as you move around the rest of the app.
 * Tapping resumes it. Hidden on the workout page itself.
 */
export function ActiveWorkoutBar({
  workout,
  onResume,
}: {
  workout: ActiveWorkout;
  onResume: () => void;
}) {
  const rest = useRestTimer();
  const resting = rest.running && rest.duration > 0;
  const restPct = resting ? (rest.secondsLeft / rest.duration) * 100 : 0;

  return (
    <div className="sticky top-0 z-50 px-3 pt-safe">
      <button
        type="button"
        onClick={onResume}
        className="relative mt-2 flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-secondary px-4 py-3 text-left text-bg shadow-card transition-transform active:scale-[0.99]"
      >
        {resting && (
          // a depleting overlay that recedes as the rest counts down, draining
          // back to the solid banner — mirrors the exercise cards' rest fill
          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-bg/25 transition-[width] duration-1000 ease-linear"
            style={{ width: `${restPct}%` }}
            aria-hidden
          />
        )}
        <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg/20">
          <Dumbbell className="h-5 w-5" />
        </span>
        <span className="relative z-10 min-w-0 flex-1 leading-tight">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-bg/70">
            Workout in progress
          </span>
          <span className="mt-0.5 block truncate font-display text-[15px] font-black uppercase tracking-[-0.01em]">
            {workout.title}
            {workout.total > 0 && (
              <span className="ml-2 font-mono text-[12px] font-bold normal-case tracking-normal text-bg/80">
                {workout.done}/{workout.total} sets
              </span>
            )}
          </span>
        </span>
        <span className="relative z-10 flex shrink-0 items-center gap-1 font-display text-[13px] font-bold">
          Resume
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}

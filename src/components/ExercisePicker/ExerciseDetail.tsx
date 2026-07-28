import { LIBRARY_BY_ID } from '../../domain/library';
import { ChevronLeft, PlusIcon } from '../common/icons';
import { ExerciseGuide } from '../common/ExerciseGuide';

/**
 * Preview a library exercise: its start/finish photos auto-flip (a pseudo-gif)
 * over the step-by-step instructions.
 */
export function ExerciseDetail({
  id,
  isCurrent,
  onBack,
  onSelect,
}: {
  id: string;
  isCurrent: boolean;
  onBack: () => void;
  onSelect: () => void;
}) {
  const ex = LIBRARY_BY_ID[id];
  if (!ex) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-5 pb-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to list"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="m-0 min-w-0 flex-1 truncate font-display text-[16px] font-bold tracking-[-0.01em]">
          {ex.name}
        </h3>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">
        <ExerciseGuide ex={ex} />
      </div>

      <div className="border-t border-line px-5 py-3 pb-safe">
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
        >
          <PlusIcon className="h-4 w-4" /> {isCurrent ? 'Keep this exercise' : 'Add this exercise'}
        </button>
      </div>
    </div>
  );
}

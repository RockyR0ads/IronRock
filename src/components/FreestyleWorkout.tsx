import { useState } from 'react';
import { useStore } from '../state/StoreContext';
import { effBlocks, FREESTYLE_KEY } from '../state/store';
import { CAT, CAT_ORDER, liftsInCategory } from '../domain/lifts';
import { ChevronLeft, PlusIcon } from './common/icons';
import { ExerciseCard } from './DayView/ExerciseCard';
import { RestTimerBar } from './RestTimerBar';
import { ExercisePicker, type PickerRequest } from './ExercisePicker/ExercisePicker';

type PickerMode = { kind: 'swap'; index: number } | { kind: 'add' };

/**
 * Ad-hoc workout logging, unrelated to the program. Reuses the shared
 * ExerciseCard, ExercisePicker and rest timer, backed by a dedicated
 * "freestyle" day in the store.
 */
export function FreestyleWorkout({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useStore();
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const blocks = effBlocks(state, FREESTYLE_KEY);

  function pickerRequest(): PickerRequest | null {
    if (!picker) return null;
    if (picker.kind === 'swap') {
      const block = blocks[picker.index];
      if (!block) return null;
      return {
        title: `Swap — ${CAT[block.cat]}`,
        currentId: block.lift,
        groups: [{ cat: block.cat, liftIds: liftsInCategory(block.cat) }],
      };
    }
    return {
      title: 'Add exercise',
      groups: CAT_ORDER.map((cat) => ({ cat, liftIds: liftsInCategory(cat) })),
    };
  }

  function handlePick(liftId: string) {
    if (!picker) return;
    if (picker.kind === 'swap') {
      dispatch({ type: 'swapBlock', dayKey: FREESTYLE_KEY, index: picker.index, liftId });
    } else {
      dispatch({ type: 'addBlock', dayKey: FREESTYLE_KEY, liftId });
    }
    setPicker(null);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center justify-between gap-3 pb-2 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to the week"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 leading-none">
            <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
              Freestyle
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              Log any workout
            </div>
          </div>
        </div>
        {blocks.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear this freestyle workout — all exercises and sets?'))
                dispatch({ type: 'restoreDay', dayKey: FREESTYLE_KEY });
            }}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
          >
            Clear
          </button>
        )}
      </header>

      <p className="mb-5 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        Add whatever you're training today and log your sets — weight, reps, and RPE. No program,
        no targets. Saves on this device.
      </p>

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <PlusIcon className="h-6 w-6" />
          </div>
          <p className="m-0 font-display text-[16px] font-bold">No exercises yet</p>
          <p className="mx-auto mt-1 max-w-[32ch] text-[13px] text-muted-2">
            Add your first exercise to start logging this workout.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {blocks.map((block, i) => (
            <ExerciseCard
              key={`${block.lift}-${i}`}
              block={block}
              index={i}
              dayKey={FREESTYLE_KEY}
              variant="freestyle"
              onSwap={(index) => setPicker({ kind: 'swap', index })}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPicker({ kind: 'add' })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3.5 font-display text-[14px] font-bold text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
      >
        <PlusIcon className="h-4 w-4" /> Add exercise
      </button>

      <RestTimerBar />

      <ExercisePicker
        request={pickerRequest()}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

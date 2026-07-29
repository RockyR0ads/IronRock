import { useEffect, useState } from 'react';
import { useStore } from '../state/StoreContext';
import { effBlocks } from '../state/store';
import { defaultDay } from '../domain/program';
import { ChevronLeft, ChevronDown } from './common/icons';
import { SectionHead } from './common/SectionHead';
import { DayView } from './DayView/DayView';
import { DayNav } from './DayView/DayNav';
import { RestTimerBar } from './RestTimerBar';
import { ReferencePanels } from './ReferencePanels';
import { ExercisePicker, type PickerRequest } from './ExercisePicker/ExercisePicker';

/** What the open picker is doing: swapping a block, or adding a new one. */
type PickerMode = { kind: 'swap'; index: number } | { kind: 'add' };

/**
 * The PPL program week: the day switcher, the day's exercise cards, settings and
 * the reference panels. Owns the swap/add exercise picker for the active day.
 */
export function TrainWeek({
  onBack,
  onOpenExercise,
}: {
  onBack: () => void;
  onOpenExercise?: (liftId: string) => void;
}) {
  const { state, dispatch } = useStore();
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  // close the day dropdown on Escape
  useEffect(() => {
    if (!dayPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDayPickerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dayPickerOpen]);

  function pickerRequest(): PickerRequest | null {
    if (!picker) return null;
    if (picker.kind === 'swap') {
      const block = effBlocks(state, state.day)[picker.index];
      if (!block) return null;
      return { title: 'Swap exercise', currentId: block.lift };
    }
    return { title: 'Add exercise' };
  }

  function handlePick(liftId: string) {
    if (!picker) return;
    if (picker.kind === 'swap') {
      dispatch({ type: 'swapBlock', dayKey: state.day, index: picker.index, liftId });
    } else {
      dispatch({ type: 'addBlock', dayKey: state.day, liftId });
    }
    setPicker(null);
  }

  const day = defaultDay(state.day);
  const dayLetter = day?.variant.split('·')[0].trim();

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6 sm:pb-16">
      <header className="flex items-center justify-between gap-3 pb-2 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 leading-none">
            <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
              The week
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              PPL · Cut
            </div>
          </div>
        </div>

        {/* day switcher: opens the day selector dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDayPickerOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={dayPickerOpen}
            className="flex items-center gap-2 rounded-full border border-line-2 bg-surface py-2 pl-3.5 pr-2.5 transition-colors hover:border-accent/50"
          >
            <span className="font-display text-[14px] font-bold tracking-[-0.01em]">{day?.label}</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              {dayLetter}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform ${dayPickerOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {dayPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setDayPickerOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,82vw)] rounded-2xl border border-line-2 bg-surface-2 p-2 shadow-pop animate-fade-in">
                <DayNav onSelect={() => setDayPickerOpen(false)} />
              </div>
            </>
          )}
        </div>
      </header>

      <SectionHead n="1" title="The week" hint="Log your sets. Tap a lift to swap it, or add your own." />
      <DayView
        onSwap={(index) => setPicker({ kind: 'swap', index })}
        onAdd={() => setPicker({ kind: 'add' })}
        onOpenExercise={onOpenExercise}
      />

      <SectionHead n="2" title="Reference" />
      <ReferencePanels />

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>

      <RestTimerBar />

      <ExercisePicker request={pickerRequest()} onPick={handlePick} onClose={() => setPicker(null)} />
    </div>
  );
}

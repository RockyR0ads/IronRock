import { useState } from 'react';
import { useStore } from './state/StoreContext';
import { effBlocks, computedInUse } from './state/store';
import { e1rmFor } from './state/selectors';
import { CAT, CAT_ORDER, liftsInCategory } from './domain/lifts';
import { Dumbbell, ChevronLeft, ChevronRight } from './components/common/icons';
import { SectionHead } from './components/common/SectionHead';
import { GlobalControls } from './components/GlobalControls';
import { ReferenceLifts } from './components/ReferenceLifts/ReferenceLifts';
import { DayView } from './components/DayView/DayView';
import { DayNav } from './components/DayView/DayNav';
import { RestTimerBar } from './components/RestTimerBar';
import { ReferencePanels } from './components/ReferencePanels';
import {
  ExercisePicker,
  type PickerRequest,
} from './components/ExercisePicker/ExercisePicker';

type Page = 'week' | 'reference';

/** What the open picker is doing: swapping a block, or adding a new one. */
type PickerMode = { kind: 'swap'; index: number } | { kind: 'add' };

export default function App() {
  const { state, dispatch } = useStore();
  const [page, setPage] = useState<Page>('week');
  const [picker, setPicker] = useState<PickerMode | null>(null);

  function pickerRequest(): PickerRequest | null {
    if (!picker) return null;
    if (picker.kind === 'swap') {
      const block = effBlocks(state, state.day)[picker.index];
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
      dispatch({ type: 'swapBlock', dayKey: state.day, index: picker.index, liftId });
    } else {
      dispatch({ type: 'addBlock', dayKey: state.day, liftId });
    }
    setPicker(null);
  }

  if (page === 'reference') {
    return <ReferencePage onBack={() => setPage('week')} />;
  }

  const refIds = computedInUse(state);
  const refsSet = refIds.filter((id) => e1rmFor(state, id) !== null).length;

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-36 pt-safe sm:px-6 sm:pb-24">
      <header className="flex items-center justify-between pb-2 pt-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-bg shadow-glow">
            <Dumbbell className="h-5 w-5" />
          </span>
          <div className="leading-none">
            <div className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
              IronRock
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-2">
              RPE Load Sheet
            </div>
          </div>
        </div>
        <span className="rounded-full border border-line-2 bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          PPL · Cut
        </span>
      </header>

      <p className="mb-3 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        Set your reference lifts, then log your working sets for each day. Targets come from your
        estimated 1RM, and everything saves on this device.
      </p>

      {/* entry point to the reference-lifts page */}
      <button
        type="button"
        onClick={() => setPage('reference')}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-accent/50"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-display text-[15px] font-bold tracking-[-0.01em]">
              Reference lifts
            </span>
            <span className="text-[12px] text-muted-2">
              {refsSet} of {refIds.length} set · drives your targets
            </span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
      </button>

      <SectionHead n="1" title="The week" hint="Log your sets. Tap a lift to swap it, or add your own." />
      <DayView
        onSwap={(index) => setPicker({ kind: 'swap', index })}
        onAdd={() => setPicker({ kind: 'add' })}
      />

      <SectionHead n="2" title="Settings" />
      <GlobalControls />

      <SectionHead n="3" title="Reference" />
      <ReferencePanels />

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2 pb-safe sm:static sm:px-0 sm:pb-0">
        <div className="mx-auto max-w-[760px] space-y-2">
          <RestTimerBar />
          <DayNav />
        </div>
      </div>

      <ExercisePicker
        request={pickerRequest()}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

function ReferencePage({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-16 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the week"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="leading-none">
          <div className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Reference lifts
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-2">
            Your estimated maxes
          </div>
        </div>
      </header>

      <p className="mb-5 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        One honest set each — weight, reps, and the RPE it actually felt like. These estimate your
        1RM and set the target loads on every working set in the week.
      </p>

      <ReferenceLifts />

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to the week
        </button>
      </div>
    </div>
  );
}

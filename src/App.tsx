import { useState } from 'react';
import { useStore } from './state/StoreContext';
import { effBlocks } from './state/store';
import { CAT, CAT_ORDER, liftsInCategory } from './domain/lifts';
import { Dumbbell } from './components/common/icons';
import { SectionHead } from './components/common/SectionHead';
import { GlobalControls } from './components/GlobalControls';
import { ReferenceLifts } from './components/ReferenceLifts/ReferenceLifts';
import { DayView } from './components/DayView/DayView';
import { DayNav } from './components/DayView/DayNav';
import { ReferencePanels } from './components/ReferencePanels';
import {
  ExercisePicker,
  type PickerRequest,
} from './components/ExercisePicker/ExercisePicker';

/** What the open picker is doing: swapping a block, or adding a new one. */
type PickerMode = { kind: 'swap'; index: number } | { kind: 'add' };

export default function App() {
  const { state, dispatch } = useStore();
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

      <p className="mb-2 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        Enter one honest set per main lift — weight, reps, and the RPE it actually felt like.
        Everything else fills in from your estimated 1RM, and saves on this device.
      </p>

      <GlobalControls />

      <SectionHead
        n="1"
        title="Your reference lifts"
        hint="One set each — weight × reps @ the RPE it felt."
      />
      <ReferenceLifts />

      <SectionHead n="2" title="The week" hint="Tap a lift to swap it, or add your own." />
      <DayView
        onSwap={(index) => setPicker({ kind: 'swap', index })}
        onAdd={() => setPicker({ kind: 'add' })}
      />

      <SectionHead n="3" title="Reference" />
      <ReferencePanels />

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>

      <DayNav />

      <ExercisePicker
        request={pickerRequest()}
        onPick={handlePick}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

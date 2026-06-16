import { useStore } from '../../state/StoreContext';
import { effBlocks } from '../../state/store';
import { blockLoad } from '../../state/selectors';
import { defaultDay } from '../../domain/program';
import { LIFTS } from '../../domain/lifts';
import { repLabel, feelLabel, isPerLeg } from '../../domain/format';
import { SwapIcon, TrashIcon, PlusIcon } from '../common/icons';
import type { Block, BlockClass } from '../../domain/types';

/** Intensity → dot color. */
const DOT: Record<BlockClass, string> = {
  'r-hi': 'bg-red',
  'r-mid': 'bg-blue',
  'r-iso': 'bg-yellow',
};

/** Intensity → RPE chip color. */
const CHIP: Record<BlockClass, string> = {
  'r-hi': 'bg-red/15 text-red',
  'r-mid': 'bg-blue/15 text-blue',
  'r-iso': 'bg-yellow/15 text-yellow',
};

function Load({ block }: { block: Block }) {
  const { state, dispatch } = useStore();
  const lift = LIFTS[block.lift];
  const perLeg = isPerLeg(block, lift.uni);

  if (lift.type === 'computed') {
    const load = blockLoad(state, block);
    if (load === null) {
      return (
        <div className="text-right">
          <div className="rounded-lg bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted-2">
            enter ref →
          </div>
        </div>
      );
    }
    return (
      <div className="text-right leading-none">
        <div className="font-mono text-[30px] font-bold tracking-[-0.02em] tabular-nums text-ink">
          {load}
          <span className="ml-1 align-baseline text-[13px] font-medium text-muted">kg</span>
        </div>
        <div className="mt-1.5 text-[11px] text-muted-2">
          {lift.unit}
          {perLeg ? ' · each' : ''}
        </div>
      </div>
    );
  }

  // manual lift — feel-based weight the user keeps
  const value = state.manual[block.lift] ?? '';
  return (
    <div className="text-right">
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder="–"
          aria-label={`${lift.name} weight`}
          onChange={(e) => dispatch({ type: 'setManual', id: block.lift, value: e.target.value })}
          className="h-12 w-[92px] rounded-xl border border-line-2 bg-surface-2 pl-2 pr-7 text-right font-mono text-[20px] font-bold text-ink transition-colors placeholder:text-muted-2 focus:border-yellow focus:outline-none"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-2">
          kg
        </span>
      </div>
    </div>
  );
}

function BlockRow({
  block,
  index,
  onSwap,
  onRemove,
}: {
  block: Block;
  index: number;
  onSwap: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const lift = LIFTS[block.lift];
  const perLeg = isPerLeg(block, lift.uni);
  const scheme = `${block.sets} × ${repLabel(block.reps)}${perLeg ? '/leg' : ''}`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[block.cls]}`} aria-hidden />
            <span className="truncate font-display text-[16px] font-bold tracking-[-0.01em]">
              {lift.name}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-muted">{scheme}</span>
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${CHIP[block.cls]}`}
            >
              {feelLabel(block)}
            </span>
          </div>
        </div>
        <Load block={block} />
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => onSwap(index)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <SwapIcon className="h-3.5 w-3.5" /> Swap
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:bg-red/15 hover:text-red"
        >
          <TrashIcon className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}

export function DayView({
  onSwap,
  onAdd,
}: {
  onSwap: (index: number) => void;
  onAdd: () => void;
}) {
  const { state, dispatch } = useStore();
  const day = defaultDay(state.day);
  if (!day) return null;
  const blocks = effBlocks(state, state.day);
  const customized = state.customDays[state.day] !== undefined;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 font-display text-[24px] font-black tracking-[-0.01em]">
            {day.label}
            <span className="ml-2 align-middle text-[14px] font-semibold uppercase tracking-[0.08em] text-accent">
              {day.variant}
            </span>
          </h3>
          <p className="m-0 mt-1 text-[13px] text-muted">{day.note}</p>
        </div>
        {customized && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'restoreDay', dayKey: state.day })}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
          >
            Restore
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block, i) => (
          <BlockRow
            key={`${block.lift}-${i}`}
            block={block}
            index={i}
            onSwap={onSwap}
            onRemove={(index) => dispatch({ type: 'removeBlock', dayKey: state.day, index })}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3.5 font-display text-[14px] font-bold text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
      >
        <PlusIcon className="h-4 w-4" /> Add exercise
      </button>
    </div>
  );
}

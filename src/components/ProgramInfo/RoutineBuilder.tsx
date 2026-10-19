import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { liftById } from '../../state/store';
import type { Block, Reps } from '../../domain/types';
import { ChevronLeft, PlusIcon, TrashIcon, CheckIcon } from '../common/icons';
import { ExercisePicker, type PickerRequest } from '../ExercisePicker/ExercisePicker';

type PickerTarget = { dayKey: string; request: PickerRequest; mode: 'add' | 'swap'; index?: number };

function schemeLabel(b: Block): string {
  const reps = Array.isArray(b.reps) ? `${b.reps[0]}–${b.reps[1]}` : String(b.reps);
  return `${b.sets} × ${reps} @ RPE ${b.rpe}`;
}

/**
 * Build-your-own routine: add days, fill each with exercises from the library,
 * reorder them, and set the sets/reps/RPE per lift. Everything persists as the
 * 'custom' program, which the week engine runs like any other.
 */
export function RoutineBuilder({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useStore();
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [editing, setEditing] = useState<{ key: string; index: number } | null>(null);
  const days = state.routineDays;
  const total = days.reduce((n, d) => n + d.blocks.length, 0);
  const isActive = state.activeProgram === 'custom';

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-24 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-secondary/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Routine builder
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {days.length} day{days.length === 1 ? '' : 's'} · {total} exercise{total === 1 ? '' : 's'}
          </div>
        </div>
      </header>

      <p className="mb-4 mt-3 text-[13px] leading-relaxed text-muted">
        Add training days and fill each with your own lifts. Tap a lift to set its sets, reps and
        RPE. When you're ready, make it your active program.
      </p>

      <div className="flex flex-col gap-3">
        {days.map((day) => (
          <section key={day.key} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center gap-2">
              <input
                value={day.label}
                onChange={(e) => dispatch({ type: 'renameCustomDay', key: day.key, label: e.target.value })}
                aria-label="Day name"
                className="min-w-0 flex-1 rounded-lg bg-surface-2 px-2.5 py-1.5 font-display text-[15px] font-bold text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70"
              />
              <button
                type="button"
                onClick={() => dispatch({ type: 'removeCustomDay', key: day.key })}
                aria-label="Delete day"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-2 transition-colors hover:text-accent"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5">
              {day.blocks.length === 0 && (
                <p className="m-0 py-2 text-center text-[12px] text-muted-2">No exercises yet.</p>
              )}
              {day.blocks.map((b, i) => {
                const open = editing?.key === day.key && editing.index === i;
                return (
                  <div key={i} className="rounded-xl border border-line-2 bg-surface-2">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="flex flex-col">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => dispatch({ type: 'customMoveBlock', key: day.key, from: i, to: i - 1 })}
                          className="h-4 leading-none text-muted-2 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={i === day.blocks.length - 1}
                          onClick={() => dispatch({ type: 'customMoveBlock', key: day.key, from: i, to: i + 1 })}
                          className="h-4 leading-none text-muted-2 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(open ? null : { key: day.key, index: i })}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate font-display text-[14px] font-bold text-ink">
                          {liftById(state, b.lift).name}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-2">{schemeLabel(b)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPicker({
                            dayKey: day.key,
                            mode: 'swap',
                            index: i,
                            request: { title: 'Swap exercise', currentId: b.lift },
                          })
                        }
                        className="shrink-0 rounded-lg px-2 py-1 font-mono text-[11px] font-bold text-secondary"
                      >
                        Swap
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'customRemoveBlock', key: day.key, index: i })}
                        aria-label="Remove exercise"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-2 transition-colors hover:text-accent"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {open && (
                      <SchemeEditor
                        block={b}
                        onSave={(sets, reps, rpe) => {
                          dispatch({ type: 'customSetScheme', key: day.key, index: i, sets, reps, rpe });
                          setEditing(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setPicker({ dayKey: day.key, mode: 'add', request: { title: 'Add exercise' } })}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-2 py-2 font-display text-[13px] font-bold text-muted transition-colors hover:border-secondary/50 hover:text-secondary"
            >
              <PlusIcon className="h-4 w-4" /> Add exercise
            </button>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'addCustomDay' })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3.5 font-display text-[14px] font-bold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <PlusIcon className="h-4 w-4" /> Add day
      </button>

      {total > 0 && (
        <button
          type="button"
          disabled={isActive}
          onClick={() => dispatch({ type: 'setActiveProgram', id: 'custom' })}
          className={[
            'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] transition-transform active:scale-[0.99]',
            isActive ? 'border border-green/60 bg-green/10 text-green' : 'bg-accent text-bg shadow-glow',
          ].join(' ')}
        >
          {isActive ? (
            <>
              <CheckIcon className="h-4 w-4" /> Your active program
            </>
          ) : (
            'Train this routine'
          )}
        </button>
      )}

      <ExercisePicker
        request={picker?.request ?? null}
        onPick={(id) => {
          if (!picker) return;
          if (picker.mode === 'add') dispatch({ type: 'customAddBlock', key: picker.dayKey, liftId: id });
          else if (picker.index !== undefined)
            dispatch({ type: 'customSwapBlock', key: picker.dayKey, index: picker.index, liftId: id });
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </div>
  );
}

/** Inline sets / reps / RPE editor for one slot. */
function SchemeEditor({
  block,
  onSave,
}: {
  block: Block;
  onSave: (sets: number, reps: Reps, rpe: number | string) => void;
}) {
  const [sets, setSets] = useState(String(block.sets));
  const [lo, setLo] = useState(String(Array.isArray(block.reps) ? block.reps[0] : block.reps));
  const [hi, setHi] = useState(Array.isArray(block.reps) ? String(block.reps[1]) : '');
  const [rpe, setRpe] = useState(String(block.rpe));

  const save = () => {
    const s = Math.max(1, Math.round(parseFloat(sets) || block.sets));
    const low = Math.max(1, Math.round(parseFloat(lo) || 1));
    const high = hi.trim() ? Math.max(low, Math.round(parseFloat(hi) || low)) : low;
    const reps: Reps = high > low ? [low, high] : low;
    const rpeNum = parseFloat(rpe);
    onSave(s, reps, Number.isFinite(rpeNum) ? rpeNum : block.rpe);
  };

  const field = 'w-full rounded-lg bg-surface-3 px-2 py-1.5 text-center font-mono text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70';

  return (
    <div className="border-t border-line-2 px-3 py-2.5">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] items-end gap-2">
        <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-2">
          Sets
          <input value={sets} onChange={(e) => setSets(e.target.value)} inputMode="numeric" className={`mt-1 ${field}`} />
        </label>
        <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-2">
          Reps
          <input value={lo} onChange={(e) => setLo(e.target.value)} inputMode="numeric" className={`mt-1 ${field}`} />
        </label>
        <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-2">
          to
          <input value={hi} onChange={(e) => setHi(e.target.value)} inputMode="numeric" placeholder="—" className={`mt-1 ${field}`} />
        </label>
        <label className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-2">
          RPE
          <input value={rpe} onChange={(e) => setRpe(e.target.value)} inputMode="decimal" className={`mt-1 ${field}`} />
        </label>
      </div>
      <button
        type="button"
        onClick={save}
        className="mt-2.5 w-full rounded-lg bg-secondary/15 py-2 font-display text-[13px] font-bold text-secondary transition-colors hover:bg-secondary/25"
      >
        Save
      </button>
    </div>
  );
}

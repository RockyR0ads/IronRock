import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { effBlocks, setsFor } from '../../state/store';
import { dayStats, isBlockComplete } from '../../state/selectors';
import { defaultDay } from '../../domain/program';
import { newSessionId } from '../../domain/session';
import type { WorkoutStats } from '../../domain/stats';
import { CheckIcon, PlusIcon } from '../common/icons';
import { ExerciseCard } from './ExerciseCard';
import { WorkoutSummary } from '../WorkoutSummary';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function DayView({
  onSwap,
  onAdd,
  onOpenExercise,
}: {
  onSwap: (index: number) => void;
  onAdd: () => void;
  onOpenExercise?: (liftId: string) => void;
}) {
  const { state, dispatch } = useStore();
  const [summary, setSummary] = useState<WorkoutStats | null>(null);
  const day = defaultDay(state.day);
  const blocks = effBlocks(state, state.day);
  const customized = state.customDays[state.day] !== undefined;
  const hasLogs = (state.logs[state.day] ?? []).some((s) => s.length > 0);

  // Completion of every block, used to auto-advance to the next unfinished one.
  const completion = blocks.map((b, i) => isBlockComplete(b, setsFor(state, state.day, i)));
  const completionKey = completion.map((c) => (c ? '1' : '0')).join('');
  const allDone = blocks.length > 0 && completion.every(Boolean);
  const prev = useRef<{ day: string; comp: boolean[] } | null>(null);

  // --- hold-to-drag reordering ---------------------------------------------
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const drag = useRef<{
    from: number;
    pointerId: number;
    offset: number; // pointer Y minus dragged card's top, at grab time
    rects: { top: number; height: number }[];
    shift: number; // px to move siblings by (dragged height + gap)
    target: number;
    el: HTMLDivElement;
  } | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = { day: state.day, comp: completion };
    if (!before || before.day !== state.day) return; // skip first paint / day switches

    const justDone = completion.findIndex((c, i) => c && !before.comp[i]);
    if (justDone === -1) return;

    let next = -1;
    for (let k = justDone + 1; k < completion.length; k++)
      if (!completion[k]) {
        next = k;
        break;
      }
    if (next === -1)
      for (let k = 0; k < justDone; k++)
        if (!completion[k]) {
          next = k;
          break;
        }
    if (next === -1) return; // whole day complete

    const card = document.getElementById(`blk-${state.day}-${next}`);
    const addBtn = document.getElementById(`addset-${state.day}-${next}`);
    card?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    addBtn?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionKey, state.day]);

  const GAP = 12; // matches gap-3 between cards

  function applyTransforms(pointerY: number) {
    const d = drag.current;
    if (!d) return;
    const top = pointerY - d.offset;
    const center = top + d.rects[d.from].height / 2;
    // where would the dragged card land?
    let target = d.from;
    for (let i = 0; i < d.rects.length; i++) {
      if (i === d.from) continue;
      const mid = d.rects[i].top + d.rects[i].height / 2;
      if (i < d.from && center < mid) target = Math.min(target, i);
      if (i > d.from && center > mid) target = Math.max(target, i);
    }
    d.target = target;
    d.el.style.transform = `translateY(${top - d.rects[d.from].top}px) scale(1.02)`;
    d.el.style.zIndex = '30';
    d.el.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)';
    for (let i = 0; i < d.rects.length; i++) {
      const el = itemRefs.current[i];
      if (!el || i === d.from) continue;
      let dy = 0;
      if (target > d.from && i > d.from && i <= target) dy = -d.shift;
      else if (target < d.from && i < d.from && i >= target) dy = d.shift;
      el.style.transform = dy ? `translateY(${dy}px)` : '';
    }
  }

  function endDrag() {
    const d = drag.current;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    document.body.style.userSelect = '';
    if (d) {
      for (let i = 0; i < d.rects.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.boxShadow = '';
        el.style.transition = '';
      }
      if (d.target !== d.from) dispatch({ type: 'moveBlock', dayKey: state.day, from: d.from, to: d.target });
    }
    drag.current = null;
    setDragFrom(null);
  }

  function onDragMove(e: PointerEvent) {
    if (!drag.current || e.pointerId !== drag.current.pointerId) return;
    e.preventDefault(); // suppress page scroll while dragging
    applyTransforms(e.clientY);
  }

  function beginDrag(index: number, pointerId: number, pointerY: number) {
    const el = itemRefs.current[index];
    if (!el) return;
    const rects = itemRefs.current.map((n) => {
      const r = n?.getBoundingClientRect();
      return { top: r?.top ?? 0, height: r?.height ?? 0 };
    });
    drag.current = {
      from: index,
      pointerId,
      offset: pointerY - rects[index].top,
      rects,
      shift: rects[index].height + GAP,
      target: index,
      el,
    };
    setDragFrom(index);
    document.body.style.userSelect = 'none';
    navigator.vibrate?.(12);
    // siblings ease into their gaps; the dragged card follows the finger 1:1
    itemRefs.current.forEach((n, i) => {
      if (n && i !== index) n.style.transition = 'transform 180ms ease';
    });
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    applyTransforms(pointerY);
  }

  const HOLD_MS = 280;
  const SLOP = 8;

  function onItemPointerDown(e: React.PointerEvent, index: number) {
    if (e.button && e.button !== 0) return;
    const t = e.target as HTMLElement;
    // let controls (inputs, buttons, swipe rows) keep their own gestures
    if (t.closest('button, input, select, textarea, a, [data-nodrag]')) return;
    if (blocks.length < 2) return;
    const pointerId = e.pointerId;
    const startY = e.clientY;
    const startX = e.clientX;
    let holdTimer: number | null = window.setTimeout(() => {
      holdTimer = null;
      itemRefs.current[index]?.setPointerCapture?.(pointerId);
      beginDrag(index, pointerId, lastY);
    }, HOLD_MS);
    let lastY = startY;
    const preMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      lastY = ev.clientY;
      // a real drag/scroll before the hold fires cancels reordering
      if (holdTimer && (Math.abs(ev.clientY - startY) > SLOP || Math.abs(ev.clientX - startX) > SLOP))
        cancelPre();
    };
    const cancelPre = () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
      window.removeEventListener('pointermove', preMove);
      window.removeEventListener('pointerup', cancelPre);
      window.removeEventListener('pointercancel', cancelPre);
    };
    window.addEventListener('pointermove', preMove, { passive: true });
    window.addEventListener('pointerup', cancelPre);
    window.addEventListener('pointercancel', cancelPre);
  }

  if (!day) return null;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 font-display text-[24px] font-black tracking-[-0.01em]">
            {day.label}
            <span className="ml-2 align-middle text-[14px] font-semibold uppercase tracking-[0.08em] text-secondary">
              {day.variant}
            </span>
          </h3>
          <p className="m-0 mt-1 text-[13px] text-muted">{day.note}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {hasLogs && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all logged sets for this day?'))
                  dispatch({ type: 'clearDaySets', dayKey: state.day });
              }}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
            >
              Clear sets
            </button>
          )}
          {customized && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'restoreDay', dayKey: state.day })}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-muted-2 hover:bg-surface-2 hover:text-ink"
            >
              Restore
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {blocks.map((block, i) => (
          <div
            key={`${block.lift}-${i}`}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            onPointerDown={(e) => onItemPointerDown(e, i)}
            className={[
              'touch-pan-y rounded-2xl',
              dragFrom === i ? 'relative select-none' : '',
            ].join(' ')}
          >
            <ExerciseCard
              block={block}
              index={i}
              dayKey={state.day}
              onSwap={onSwap}
              onOpenExercise={onOpenExercise}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3.5 font-display text-[14px] font-bold text-muted transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
      >
        <PlusIcon className="h-4 w-4" /> Add exercise
      </button>

      {hasLogs && (
        <button
          type="button"
          onClick={() => {
            // snapshot the stats before archiving — completing clears the day
            setSummary(dayStats(state, state.day));
            dispatch({
              type: 'completeWorkout',
              dayKey: state.day,
              title: day.label,
              at: new Date().toISOString(),
              id: newSessionId(),
            });
          }}
          className={[
            'mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] transition-transform active:scale-[0.99]',
            allDone
              ? 'bg-green text-bg shadow-glow'
              : 'border border-line-2 bg-surface text-ink hover:border-green/60',
          ].join(' ')}
        >
          <CheckIcon className="h-4 w-4" /> Complete workout
        </button>
      )}

      {summary && (
        <WorkoutSummary
          title={day.label}
          stats={summary}
          archived={summary.sets > 0}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  );
}

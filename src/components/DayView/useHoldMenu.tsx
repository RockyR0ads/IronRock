import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { STEPS, stepValue, formatStepValue, type StepKind } from '../../domain/steps';

const HOLD_MS = 280;
const CHIP_W = 52;
const CHIP_H = 46;
const GAP = 6;
const PAD = 8;
const HEADER_H = 22;
const EXTRA_H = 40;
const MARGIN = 8;

const KIND_LABEL: Record<StepKind, string> = { weight: 'Weight', reps: 'Reps', rpe: 'RPE' };

const buzz = (ms: number) => navigator.vibrate?.(ms);

/**
 * Swallow the single "ghost" click the browser fires ~300ms after a touch
 * pointerup. Because we open pickers on pointerup, by the time that click
 * arrives an overlay/backdrop may sit where the cell was — the stray click would
 * land on it and dismiss what we just opened. One capture-phase listener eats it.
 */
function swallowNextClick() {
  const handler = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cleanup();
  };
  const cleanup = () => {
    document.removeEventListener('click', handler, true);
    clearTimeout(t);
  };
  const t = window.setTimeout(cleanup, 600);
  document.addEventListener('click', handler, true);
}

interface OpenState {
  left: number;
  top: number;
  width: number;
}

/**
 * Press-and-hold on a set value to open a small increment menu; then tap one of
 * the chips to apply it — no keyboard, no dragging. A short tap still runs
 * `onTap` (focus the input, or open the RPE picker). Scrolling a finger off the
 * cell cancels the hold, so the page still scrolls normally.
 */
export function useHoldMenu({
  kind,
  base,
  onApply,
  onTap,
  extra,
}: {
  kind: StepKind;
  /** Current numeric base to step from (already resolved, e.g. from last set). */
  base: () => number;
  onApply: (value: string) => void;
  onTap: (el: HTMLElement) => void;
  /** Optional toggle shown as a full-width switch below the chips. */
  extra?: { label: string; on: boolean; onSelect: () => void };
}) {
  const steps = STEPS[kind];
  const [open, setOpen] = useState<OpenState | null>(null);
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const suppressClick = useRef(false);
  const el = useRef<HTMLElement | null>(null);
  const downXY = useRef<{ x: number; y: number } | null>(null);
  const maxMove = useRef(0);

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const close = useCallback(() => setOpen(null), []);

  const openMenu = useCallback(() => {
    const node = el.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const width = PAD * 2 + steps.length * CHIP_W + (steps.length - 1) * GAP;
    const height = PAD * 2 + HEADER_H + CHIP_H + (extra ? EXTRA_H + GAP : 0);
    const cx = rect.left + rect.width / 2;
    const left = Math.max(MARGIN, Math.min(window.innerWidth - MARGIN - width, cx - width / 2));
    // above the cell by default; flip below if it would clip the top
    const above = rect.top - height - 10;
    const top = above < MARGIN ? rect.bottom + 10 : above;
    held.current = true;
    node.blur();
    buzz(12);
    setOpen({ left, top, width });
  }, [steps.length, extra]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button > 0) return; // ignore right/middle click
    if (open) {
      // a tap on the cell while the menu is up just dismisses it
      close();
      suppressClick.current = true;
      return;
    }
    el.current = e.currentTarget;
    held.current = false;
    maxMove.current = 0;
    downXY.current = { x: e.clientX, y: e.clientY };
    e.preventDefault(); // block native focus; a tap focuses via onTap instead
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — degrade to element-local events */
    }
    clearTimer();
    timer.current = window.setTimeout(openMenu, HOLD_MS);
  };

  // A small wobble is still a tap; past TAP_SLOP we cancel the pending hold-menu
  // (the finger is moving — scroll or swipe). Only a real drag past DRAG_SLOP
  // suppresses the tap, so the row's swipe-to-delete can take over without a
  // jittery finger-tap losing its onTap (open picker / focus input).
  const TAP_SLOP = 8;
  const DRAG_SLOP = 16;
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (open || !downXY.current) return;
    const dist = Math.hypot(e.clientX - downXY.current.x, e.clientY - downXY.current.y);
    if (dist > maxMove.current) maxMove.current = dist;
    if (dist > TAP_SLOP) clearTimer();
  };

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    clearTimer();
    try {
      el.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing captured */
    }
    if (held.current) {
      held.current = false; // menu stays open for a tap; nothing to apply yet
    } else if (el.current && maxMove.current <= DRAG_SLOP) {
      onTap(el.current); // a tap (allowing finger wobble), not the end of a drag
      swallowNextClick(); // don't let the trailing ghost-click dismiss what opened
    }
    downXY.current = null;
    suppressClick.current = true; // swallow the click the browser fires after
  };

  // a scroll gesture cancels the hold, so the page keeps scrolling normally
  const onPointerCancel = () => {
    clearTimer();
    held.current = false;
    downXY.current = null;
  };

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onTap(e.currentTarget); // keyboard / non-pointer activation
  };

  const apply = (delta: number) => {
    onApply(formatStepValue(stepValue(kind, base(), delta)));
    buzz(10);
    close();
  };

  // dismiss on Escape while open
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const menu: ReactNode = open
    ? createPortal(
        <div className="fixed inset-0 z-[70]">
          {/* backdrop: a tap anywhere outside the chips closes the menu */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-transparent"
          />
          <div
            role="menu"
            aria-label={`Adjust ${KIND_LABEL[kind]}`}
            className="absolute rounded-2xl border border-line-2 bg-surface-2 p-2 shadow-pop animate-fade-in"
            style={{ left: open.left, top: open.top, width: open.width }}
          >
            <div className="mb-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
              {KIND_LABEL[kind]} · now {formatStepValue(base())}
            </div>
            <div className="flex justify-center" style={{ gap: GAP }}>
              {steps.map((s) => {
                const positive = s.delta > 0;
                return (
                  <button
                    key={s.delta}
                    type="button"
                    role="menuitem"
                    onClick={() => apply(s.delta)}
                    style={{ width: CHIP_W, height: CHIP_H }}
                    className={[
                      'flex flex-col items-center justify-center rounded-xl border font-mono transition-colors active:scale-95',
                      positive
                        ? 'border-green/40 bg-green/10 text-green hover:bg-green/20'
                        : 'border-red/40 bg-red/10 text-red hover:bg-red/20',
                    ].join(' ')}
                  >
                    <span className="text-[14px] font-bold leading-none">{s.label}</span>
                    <span className="mt-0.5 text-[10px] leading-none text-muted-2">
                      {formatStepValue(stepValue(kind, base(), s.delta))}
                    </span>
                  </button>
                );
              })}
            </div>
            {extra && (
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={extra.on}
                onClick={() => {
                  extra.onSelect();
                  buzz(10);
                  close();
                }}
                style={{ height: EXTRA_H, marginTop: GAP }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-line-2 bg-surface-3 px-3 transition-colors hover:border-secondary/50"
              >
                <span className="font-mono text-[12px] font-bold text-ink">{extra.label}</span>
                <span
                  className={[
                    'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                    extra.on ? 'bg-accent' : 'bg-line-2',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all',
                      extra.on ? 'left-[18px]' : 'left-0.5',
                    ].join(' ')}
                  />
                </span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel,
      onClick,
    },
    menu,
    open: !!open,
  };
}

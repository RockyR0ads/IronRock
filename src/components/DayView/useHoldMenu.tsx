import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { STEPS, stepValue, formatStepValue, type StepKind } from '../../domain/steps';

const HOLD_MS = 280;
const CHIP_W = 52;
const CHIP_H = 46;
const GAP = 6;
const PAD = 8;
const HEADER_H = 22;
const MARGIN = 8;

const KIND_LABEL: Record<StepKind, string> = { weight: 'Weight', reps: 'Reps', rpe: 'RPE' };

const buzz = (ms: number) => navigator.vibrate?.(ms);

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
}: {
  kind: StepKind;
  /** Current numeric base to step from (already resolved, e.g. from last set). */
  base: () => number;
  onApply: (value: string) => void;
  onTap: (el: HTMLElement) => void;
}) {
  const steps = STEPS[kind];
  const [open, setOpen] = useState<OpenState | null>(null);
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const suppressClick = useRef(false);
  const el = useRef<HTMLElement | null>(null);

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
    const height = PAD * 2 + HEADER_H + CHIP_H;
    const cx = rect.left + rect.width / 2;
    const left = Math.max(MARGIN, Math.min(window.innerWidth - MARGIN - width, cx - width / 2));
    // above the cell by default; flip below if it would clip the top
    const above = rect.top - height - 10;
    const top = above < MARGIN ? rect.bottom + 10 : above;
    held.current = true;
    node.blur();
    buzz(12);
    setOpen({ left, top, width });
  }, [steps.length]);

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
    e.preventDefault(); // block native focus; a tap focuses via onTap instead
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — degrade to element-local events */
    }
    clearTimer();
    timer.current = window.setTimeout(openMenu, HOLD_MS);
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
    } else if (el.current) {
      onTap(el.current);
    }
    suppressClick.current = true; // swallow the click the browser fires after
  };

  // a scroll gesture cancels the hold, so the page keeps scrolling normally
  const onPointerCancel = () => {
    clearTimer();
    held.current = false;
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
          </div>
        </div>,
        document.body
      )
    : null;

  return {
    handlers: {
      onPointerDown,
      onPointerUp: end,
      onPointerCancel,
      onClick,
    },
    menu,
    open: !!open,
  };
}

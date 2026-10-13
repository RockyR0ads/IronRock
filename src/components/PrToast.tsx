import { useEffect, useState } from 'react';
import { TrophyIcon } from './common/icons';

export interface PrEventDetail {
  lift: string;
  message: string;
}

/** Fire a PR celebration from anywhere — a set check-off dispatches this. */
export function celebratePr(detail: PrEventDetail) {
  try {
    navigator.vibrate?.([20, 40, 20]);
  } catch {
    /* no haptics */
  }
  window.dispatchEvent(new CustomEvent<PrEventDetail>('ironrock:pr', { detail }));
}

interface Toast extends PrEventDetail {
  id: number;
}

/**
 * App-level listener that pops a brief celebratory banner when a set sets a
 * personal record. Stacks a few, each auto-dismissing.
 */
export function PrToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let seq = 0;
    const onPr = (e: Event) => {
      const detail = (e as CustomEvent<PrEventDetail>).detail;
      if (!detail?.message) return;
      const id = ++seq;
      setToasts((t) => [...t.slice(-2), { id, ...detail }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
    };
    window.addEventListener('ironrock:pr', onPr);
    return () => window.removeEventListener('ironrock:pr', onPr);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-safe">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="mt-2 flex items-center gap-2.5 rounded-2xl border border-yellow/50 bg-surface-2/95 px-4 py-2.5 shadow-pop backdrop-blur-md animate-sheet-up"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow/20 text-yellow">
            <TrophyIcon className="h-4 w-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[13px] font-black uppercase tracking-[-0.01em] text-yellow">
              New PR
            </span>
            <span className="block font-mono text-[12px] text-ink">{t.message}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

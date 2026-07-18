import { useEffect } from 'react';
import { FEEL_OPTIONS } from '../../domain/feel';
import { FEEL_TONE } from '../common/feelTone';
import type { WarmupFeel } from '../../domain/types';

/**
 * Chooser for how a warm-up felt relative to normal — the warm-up stand-in for
 * RPE. Opens from the feel cell on a warm-up row.
 */
export function FeelPicker({
  title,
  value,
  onPick,
  onClear,
  onClose,
}: {
  title: string;
  value: WarmupFeel | null;
  onPick: (feel: WarmupFeel) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`How did the warm-up feel — ${title}`}
        className="w-full rounded-t-3xl border-t border-line bg-surface p-5 pb-safe animate-sheet-up sm:max-w-[440px] sm:rounded-3xl sm:border"
      >
        <div className="flex justify-center pb-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">
          How did it feel?
        </h3>
        <p className="m-0 mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
          {title} · vs how this weight usually feels
        </p>

        <div className="mt-4 space-y-2">
          {FEEL_OPTIONS.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onPick(o.value)}
                aria-pressed={selected}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  selected ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-line-2',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border font-display text-[18px] font-black',
                    FEEL_TONE[o.value],
                  ].join(' ')}
                >
                  {o.value}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[14px] font-bold tracking-[-0.01em]">
                    {o.phrase}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted-2">{o.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          {value !== null && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl bg-surface-2 px-4 py-3 font-display text-[14px] font-bold text-muted transition-colors hover:text-ink"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface-2 py-3 font-display text-[14px] font-bold text-ink transition-colors hover:bg-surface-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

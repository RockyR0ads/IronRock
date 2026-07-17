import { useEffect } from 'react';
import { RPE_SCALE } from '../../domain/rpeScale';
import { rpeHue } from '../../domain/format';

/**
 * Bottom-sheet picker for a set's RPE: every half-point from 10 down to 1 with
 * the effort it should have felt like. Opens from the RPE pill on a set row.
 */
export function RpePicker({
  title,
  value,
  onPick,
  onClear,
  onClose,
}: {
  title: string;
  /** Currently selected rating, if any. */
  value: number | null;
  onPick: (rpe: number) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Rate ${title}`}
        className={[
          'flex w-full flex-col overflow-hidden border-line bg-surface animate-sheet-up',
          'h-[80vh] rounded-t-3xl border-t',
          'sm:h-[74vh] sm:max-w-[480px] sm:rounded-3xl sm:border',
        ].join(' ')}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <div className="px-5 py-3.5">
          <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">
            How hard was it?
          </h3>
          <p className="m-0 mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            {title}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-2">
          <div className="space-y-1.5">
            {RPE_SCALE.map((step) => {
              const hue = rpeHue(step.value);
              const selected = value === step.value;
              return (
                <button
                  key={step.value}
                  type="button"
                  onClick={() => onPick(step.value)}
                  aria-pressed={selected}
                  className={[
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                    selected
                      ? 'border-accent bg-accent/10'
                      : 'border-line bg-surface-2 hover:border-line-2',
                  ].join(' ')}
                >
                  <span
                    className="flex h-10 w-11 shrink-0 items-center justify-center rounded-lg border font-mono text-[15px] font-bold tabular-nums"
                    style={{
                      backgroundColor: `hsl(${hue} 65% 45% / 0.22)`,
                      borderColor: `hsl(${hue} 65% 55% / 0.55)`,
                      color: `hsl(${hue} 85% 75%)`,
                    }}
                  >
                    {step.value}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] leading-snug text-muted">
                    {step.feel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3 pb-safe">
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

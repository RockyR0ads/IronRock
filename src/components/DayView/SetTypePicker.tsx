import { useEffect } from 'react';
import { SET_TYPES } from '../../domain/setTags';
import type { SetType } from '../../domain/types';

/**
 * Chooser for a working set's type — a straight set, or a special one (drop,
 * failure, rest-pause, myo-reps). Opens from the set-number cell.
 */
export function SetTypePicker({
  title,
  value,
  onPick,
  onClose,
}: {
  title: string;
  value: SetType | undefined;
  /** Pick a type, or `undefined` for an ordinary straight set. */
  onPick: (type: SetType | undefined) => void;
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
        aria-label={`Set type — ${title}`}
        className="w-full rounded-t-3xl border-t border-line bg-surface p-5 pb-safe animate-sheet-up sm:max-w-[440px] sm:rounded-3xl sm:border"
      >
        <div className="flex justify-center pb-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">Set type</h3>
        <p className="m-0 mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
          {title}
        </p>

        <div className="mt-4 space-y-2">
          {/* straight set — clears any type */}
          <button
            type="button"
            onClick={() => onPick(undefined)}
            aria-pressed={!value}
            className={[
              'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
              !value ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-line-2',
            ].join(' ')}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-3 font-mono text-[15px] font-bold text-muted">
              #
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[14px] font-bold tracking-[-0.01em]">
                Straight set
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted-2">
                An ordinary working set.
              </span>
            </span>
          </button>

          {SET_TYPES.map((t) => {
            const selected = value === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t.id)}
                aria-pressed={selected}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  selected ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-line-2',
                ].join(' ')}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-display text-[15px] font-black"
                  style={{ backgroundColor: `${t.color}26`, color: t.color }}
                >
                  {t.short}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[14px] font-bold tracking-[-0.01em]">
                    {t.label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted-2">{t.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-surface-2 py-3 font-display text-[14px] font-bold text-ink transition-colors hover:bg-surface-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

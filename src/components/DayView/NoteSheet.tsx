import { useEffect, useRef, useState } from 'react';

/**
 * Bottom-sheet note editor for a single set: jot down whatever happened —
 * a form cue, a tweak, a drop set, why the weight moved. Opens from the note
 * bubble on a set row.
 */
export function NoteSheet({
  title,
  value,
  onSave,
  onClose,
}: {
  title: string;
  value: string;
  onSave: (note: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const save = () => onSave(text.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) save();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Note for ${title}`}
        className={[
          'flex w-full flex-col overflow-hidden border-line bg-surface animate-sheet-up',
          'rounded-t-3xl border-t',
          'sm:max-w-[480px] sm:rounded-3xl sm:border',
        ].join(' ')}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <div className="px-5 py-3.5">
          <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">Set note</h3>
          <p className="m-0 mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            {title}
          </p>
        </div>

        <div className="px-5 pb-2">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="What happened this set? Form cue, tweak, pain, drop set…"
            className="w-full resize-none rounded-xl border border-line-2 bg-surface-2 p-3.5 text-[15px] leading-relaxed text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
          />
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3 pb-safe">
          {value && (
            <button
              type="button"
              onClick={() => onSave('')}
              className="rounded-xl bg-surface-2 px-4 py-3 font-display text-[14px] font-bold text-muted transition-colors hover:text-ink"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

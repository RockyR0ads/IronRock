import { useEffect, useRef, useState } from 'react';
import type { LoggedSet, SetQuality, SetFlag } from '../../domain/types';
import { QUALITY, FLAGS } from '../../domain/setTags';

export interface SetLogPatch {
  note: string;
  quality?: SetQuality;
  flags: SetFlag[];
}

/**
 * Bottom-sheet set log: capture what actually happened on a set — technique
 * quality (one tap), any flags (pain, assisted, drop, PR), and a free-text note.
 * Structured so it's fast to log and later trendable. Opens from the note bubble.
 */
export function NoteSheet({
  title,
  set,
  onSave,
  onClose,
}: {
  title: string;
  set: Pick<LoggedSet, 'note' | 'quality' | 'flags'>;
  onSave: (patch: SetLogPatch) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(set.note ?? '');
  const [quality, setQuality] = useState<SetQuality | undefined>(set.quality);
  const [flags, setFlags] = useState<SetFlag[]>(set.flags ?? []);
  const ref = useRef<HTMLTextAreaElement>(null);

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

  const toggleFlag = (id: SetFlag) =>
    setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const save = () => onSave({ note: text.trim(), quality, flags });
  const clearAll = () => onSave({ note: '', quality: undefined, flags: [] });
  const hasAnything = !!(text.trim() || quality || flags.length);

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
        aria-label={`Log for ${title}`}
        className={[
          'flex max-h-[90vh] w-full flex-col overflow-hidden border-line bg-surface animate-sheet-up',
          'rounded-t-3xl border-t',
          'sm:max-w-[480px] sm:rounded-3xl sm:border',
        ].join(' ')}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <div className="px-5 py-3.5">
          <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">Set log</h3>
          <p className="m-0 mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            {title}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 pb-2">
          {/* technique quality — single choice */}
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted">How did it go?</span>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY.map((q) => {
                const on = quality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setQuality(on ? undefined : q.id)}
                    style={
                      on
                        ? { backgroundColor: `${q.color}26`, borderColor: `${q.color}80`, color: q.color }
                        : undefined
                    }
                    className={[
                      'rounded-full border px-3 py-1.5 font-display text-[13px] font-bold transition-colors',
                      on ? '' : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* flags — multi-select */}
          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Flags</span>
            <div className="flex flex-wrap gap-1.5">
              {FLAGS.map((f) => {
                const on = flags.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFlag(f.id)}
                    style={
                      on
                        ? { backgroundColor: `${f.color}26`, borderColor: `${f.color}80`, color: f.color }
                        : undefined
                    }
                    className={[
                      'rounded-full border px-3 py-1.5 font-display text-[13px] font-bold transition-colors',
                      on ? '' : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* free text */}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Note</span>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Anything else — a cue, what changed, how it felt…"
              className="w-full resize-none rounded-xl border border-line-2 bg-surface-2 p-3.5 text-[15px] leading-relaxed text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3 pb-safe">
          {hasAnything && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl bg-surface-2 px-4 py-3 font-display text-[14px] font-bold text-muted transition-colors hover:text-ink"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { BODY_PARTS, attachmentsFor, type Attachment, type BodyPart } from '../domain/attachments';
import { AttachmentIcon } from './AttachmentIcon';
import { BodyPartIcon } from './BodyPartIcon';

/**
 * Pick a cable attachment in two steps: a body-part card first (the lift's own
 * part flagged as suggested), then that part's staple handles as icon cards.
 */
export function AttachmentChips({
  value,
  onPick,
  suggested,
}: {
  value: string | undefined;
  onPick: (id: string) => void;
  /** The lift's body part, flagged on the first step. */
  suggested?: BodyPart;
}) {
  const [part, setPart] = useState<BodyPart | null>(null);

  if (!part) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BODY_PARTS.map((p) => {
          const hint = p === suggested;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPart(p)}
              className={[
                'flex flex-col gap-1.5 rounded-2xl border p-3 text-left transition-colors',
                hint ? 'border-accent bg-accent/10' : 'border-line-2 bg-surface-2 hover:border-secondary/50',
              ].join(' ')}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-[15px] font-bold tracking-[-0.01em]">{p}</span>
                {hint && <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-accent">This lift</span>}
              </span>
              <BodyPartIcon part={p} className="mx-auto h-28 w-14" />
              <span className="text-[11px] text-muted-2">{attachmentsFor(p).length} attachments</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setPart(null)}
        className="mb-3 text-[13px] font-semibold text-muted hover:text-ink"
      >
        ← Body parts · <span className="text-ink">{part}</span>
      </button>
      <AttachmentGrid items={attachmentsFor(part)} value={value} onPick={onPick} />
    </div>
  );
}

function AttachmentGrid({ items, value, onPick }: { items: Attachment[]; value: string | undefined; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((a) => {
        const on = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.id)}
            aria-pressed={on}
            aria-label={a.label}
            title={a.label}
            className={[
              'flex flex-col items-center gap-1 rounded-2xl border px-2 pb-2 pt-3 transition-colors',
              on ? 'border-accent bg-accent/10 text-accent' : 'border-line-2 bg-surface-2 text-ink hover:border-secondary/50',
            ].join(' ')}
          >
            <AttachmentIcon id={a.id} className="h-12 w-12" />
            <span className={`text-center text-[10px] font-semibold leading-tight ${on ? 'text-accent' : 'text-muted-2'}`}>
              {a.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Bottom sheet holding the icon grid — the same picker used when adding an exercise. */
export function AttachmentSheet({
  title,
  suggested,
  value,
  onPick,
  onClose,
}: {
  title: string;
  suggested?: BodyPart;
  value: string | undefined;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} attachment`}
        className="w-full rounded-t-3xl border-t border-line bg-surface px-5 pb-6 pt-3 animate-sheet-up sm:max-w-[560px] sm:rounded-3xl sm:border"
      >
        <div className="flex justify-center pb-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>
        <h2 className="font-display text-[20px] font-bold tracking-[-0.01em]">{title}</h2>
        <p className="mt-1 text-[13px] text-muted">Which attachment is on the cable?</p>
        <div className="mt-4 pb-safe">
          <AttachmentChips
            suggested={suggested}
            value={value}
            onPick={(id) => {
              onPick(id);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

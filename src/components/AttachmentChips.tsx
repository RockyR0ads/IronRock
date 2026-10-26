import { ATTACHMENTS } from '../domain/attachments';
import { AttachmentIcon } from './AttachmentIcon';

/** Pick a cable attachment — a grid of drawn handles, the current one highlighted. */
export function AttachmentChips({ value, onPick }: { value: string | undefined; onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {ATTACHMENTS.map((a) => {
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
            <span className={`text-[10px] font-semibold leading-tight ${on ? 'text-accent' : 'text-muted-2'}`}>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Bottom sheet holding the icon grid — the same picker used when adding an exercise. */
export function AttachmentSheet({
  title,
  value,
  onPick,
  onClose,
}: {
  title: string;
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

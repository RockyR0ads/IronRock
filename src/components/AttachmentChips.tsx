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

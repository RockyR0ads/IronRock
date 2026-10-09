import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { NoteIcon } from '../common/icons';

/**
 * A free-text note for the whole workout. Collapsed to a slim prompt until
 * there's something to say; the text is archived onto the session on complete.
 */
export function WorkoutNote({ dayKey }: { dayKey: string }) {
  const { state, dispatch } = useStore();
  const note = state.dayNote[dayKey] ?? '';
  const [open, setOpen] = useState(note.length > 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-3 font-display text-[13px] font-bold text-muted-2 transition-colors hover:border-secondary/50 hover:text-secondary"
      >
        <NoteIcon className="h-4 w-4" /> Add a workout note
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
      <label
        htmlFor={`note-${dayKey}`}
        className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2"
      >
        <NoteIcon className="h-3.5 w-3.5" /> Workout note
      </label>
      <textarea
        id={`note-${dayKey}`}
        value={note}
        autoFocus={note.length === 0}
        onChange={(e) => dispatch({ type: 'setDayNote', dayKey, note: e.target.value })}
        placeholder="How did it go? Energy, sleep, aches, PRs…"
        rows={3}
        className="w-full resize-y rounded-xl border border-line-2 bg-surface-2 px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
      />
    </div>
  );
}

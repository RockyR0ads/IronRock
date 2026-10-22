import { useState } from 'react';
import { useStore } from '../state/StoreContext';
import { liftById } from '../state/store';
import { liftMeasure, fmtSecs, parseSecs } from '../domain/measure';
import type { LoggedSet, Session } from '../domain/types';
import { PlusIcon, TrashIcon } from './common/icons';

/** Local datetime-input value for an ISO timestamp. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const cell =
  'h-10 w-full rounded-lg bg-surface-2 text-center font-mono text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70';

/**
 * Edit an archived workout: fix a mistyped set, add or remove sets and
 * exercises, rename it, change its date, or amend the note. Works on a draft —
 * nothing changes until Save.
 */
export function SessionEditor({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState<Session>(() => structuredClone(session));
  const [when, setWhen] = useState(toLocalInput(session.at));

  const setSet = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    setDraft((d) => {
      const next = structuredClone(d);
      next.exercises[ei].sets[si] = { ...next.exercises[ei].sets[si], ...patch };
      return next;
    });
  const edit = (fn: (d: Session) => void) =>
    setDraft((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });

  function save() {
    const at = new Date(when);
    // keep the original time-of-completion semantics: shift startedAt with it
    const moved = Number.isFinite(at.getTime()) ? at.toISOString() : draft.at;
    const delta = Date.parse(moved) - Date.parse(session.at);
    const startedAt =
      draft.startedAt && delta ? new Date(Date.parse(draft.startedAt) + delta).toISOString() : draft.startedAt;
    const remaining = draft.exercises.filter((ex) => ex.sets.length > 0).length;
    if (remaining === 0 && !confirm('Every exercise was removed — delete this workout?')) return;
    dispatch({
      type: 'updateSession',
      session: { ...draft, at: moved, startedAt, title: draft.title.trim() || session.title, note: draft.note?.trim() || undefined },
    });
    onDone();
  }

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
          Name
          <input
            value={draft.title}
            onChange={(e) => edit((d) => (d.title = e.target.value))}
            className="mt-1 h-10 w-full rounded-lg bg-surface-2 px-3 font-display text-[15px] font-bold normal-case tracking-normal text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70"
          />
        </label>
        <label className="mt-3 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
          Date & time
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg bg-surface-2 px-3 font-mono text-[14px] normal-case tracking-normal text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70"
          />
        </label>
        <label className="mt-3 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
          Note
          <textarea
            value={draft.note ?? ''}
            onChange={(e) => edit((d) => (d.note = e.target.value))}
            rows={2}
            className="mt-1 w-full resize-y rounded-lg bg-surface-2 px-3 py-2 text-[14px] normal-case tracking-normal text-ink focus:outline-none focus:ring-2 focus:ring-secondary/70"
          />
        </label>
      </div>

      <div className="mt-3 space-y-3">
        {draft.exercises.map((ex, ei) => {
          const measure = liftMeasure(liftById(state, ex.liftId));
          const cols = measure === 'weight' ? ['kg', 'reps'] : measure === 'time' ? ['kg', 'time'] : ['m', 'time'];
          return (
            <div key={`${ex.liftId}-${ei}`} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold">{ex.name}</span>
                <button
                  type="button"
                  onClick={() => edit((d) => d.exercises.splice(ei, 1))}
                  aria-label={`Remove ${ex.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-2 hover:text-accent"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-[1.6rem_1fr_1fr_3.2rem_2rem] gap-1.5 px-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-2">
                <span />
                <span className="text-center">{cols[0]}</span>
                <span className="text-center">{cols[1]}</span>
                <span className="text-center">rpe</span>
                <span />
              </div>
              <div className="mt-1 space-y-1.5">
                {ex.sets.map((set, si) => (
                  <div key={si} className="grid grid-cols-[1.6rem_1fr_1fr_3.2rem_2rem] items-center gap-1.5">
                    <span className="text-center font-mono text-[12px] text-muted-2">{set.warmup ? 'W' : si + 1}</span>
                    {measure === 'distance' ? (
                      <input
                        inputMode="decimal"
                        aria-label="Distance in metres"
                        value={set.dist ?? ''}
                        onChange={(e) => setSet(ei, si, { dist: e.target.value })}
                        className={cell}
                      />
                    ) : (
                      <input
                        inputMode="decimal"
                        aria-label="Weight"
                        value={set.w}
                        onChange={(e) => setSet(ei, si, { w: e.target.value })}
                        className={cell}
                      />
                    )}
                    {measure === 'weight' ? (
                      <input
                        inputMode="numeric"
                        aria-label="Reps"
                        value={set.reps}
                        onChange={(e) => setSet(ei, si, { reps: e.target.value })}
                        className={cell}
                      />
                    ) : (
                      <TimeField value={set.secs ?? ''} onChange={(v) => setSet(ei, si, { secs: v })} />
                    )}
                    <input
                      inputMode="decimal"
                      aria-label="RPE"
                      value={set.rpe}
                      onChange={(e) => setSet(ei, si, { rpe: e.target.value })}
                      className={cell}
                    />
                    <button
                      type="button"
                      onClick={() => edit((d) => d.exercises[ei].sets.splice(si, 1))}
                      aria-label="Remove set"
                      className="flex h-10 items-center justify-center text-muted-2 hover:text-accent"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  edit((d) => {
                    const working = d.exercises[ei].sets.filter((s) => !s.warmup);
                    const last = working[working.length - 1];
                    d.exercises[ei].sets.push(
                      last
                        ? { ...last, warmup: undefined, note: undefined, done: true }
                        : { w: '', reps: '', rpe: '', done: true }
                    );
                  })
                }
                className="mt-2 inline-flex items-center gap-1 font-display text-[12px] font-bold text-secondary"
              >
                <PlusIcon className="h-3.5 w-3.5" /> Add set
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-2xl border border-line-2 bg-surface-2 py-3 font-display text-[14px] font-bold text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-2xl bg-accent py-3 font-display text-[14px] font-black text-bg shadow-glow"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

/** Time entry that accepts "90" or "1:30" and stores seconds. */
function TimeField({ value, onChange }: { value: string; onChange: (secs: string) => void }) {
  const [text, setText] = useState(value ? fmtSecs(Number(value)) : '');
  return (
    <input
      inputMode="text"
      aria-label="Time"
      placeholder="m:ss"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const s = parseSecs(e.target.value);
        onChange(s === null ? '' : String(s));
      }}
      className={cell}
    />
  );
}

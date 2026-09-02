import { useRef, useState } from 'react';
import { useStore } from '../state/StoreContext';
import type { Increment } from '../domain/types';
import { exportBackup, importBackup, recordBackup } from '../domain/backup';
import { parseStrong, StrongImportError } from '../domain/strongImport';

const INCREMENTS: Increment[] = [1, 2.5, 5];

export function GlobalControls() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const strongRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [strongStatus, setStrongStatus] = useState<string | null>(null);

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!confirm('Restore this backup? It replaces all current data in the app.')) return;
    try {
      await importBackup(file); // reloads on success
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not read that file.');
    }
  }

  async function onStrongFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStrongStatus(null);
    try {
      const result = parseStrong(await file.text());
      const known = new Set(state.sessions.map((s) => s.id));
      const fresh = result.sessions.filter((s) => !known.has(s.id)).length;
      const skipped = result.sessions.length - fresh;
      if (fresh === 0) {
        setStrongStatus(`Nothing new — those ${result.workouts} workouts are already imported.`);
        return;
      }
      const unitNote = result.unit === 'lb' ? ' Weights were converted from lb to kg.' : '';
      const skipNote = skipped > 0 ? ` (${skipped} already imported will be skipped.)` : '';
      const ok = confirm(
        `Import ${fresh} workout${fresh === 1 ? '' : 's'} — ${result.exercises} exercises, ` +
          `${result.sets} sets — from Strong?${skipNote}${unitNote}\n\n` +
          `They'll be added to your History; nothing you already have is changed.`,
      );
      if (!ok) return;
      dispatch({ type: 'importSessions', sessions: result.sessions, customLifts: result.customLifts });
      const unmatchedNote = result.unmatched.length
        ? ` ${result.unmatched.length} exercise${result.unmatched.length === 1 ? '' : 's'} kept under Strong's own name.`
        : '';
      setStrongStatus(`Imported ${fresh} workout${fresh === 1 ? '' : 's'}.${unmatchedNote}`);
    } catch (err) {
      setStrongStatus(
        err instanceof StrongImportError
          ? err.message
          : "Couldn't read that file — export it from Strong as CSV and try again.",
      );
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-[120px] flex-1">
          <label
            htmlFor="bw"
            className="mb-1.5 block text-[12px] font-medium text-muted"
          >
            Bodyweight
          </label>
          <div className="relative">
            <input
              id="bw"
              type="number"
              inputMode="decimal"
              placeholder="90"
              value={state.bw}
              onChange={(e) => dispatch({ type: 'setBw', value: e.target.value })}
              className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 pl-3 pr-9 font-mono text-[15px] text-ink transition-colors focus:border-secondary focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-2">
              kg
            </span>
          </div>
        </div>

        <div className="flex-1">
          <span className="mb-1.5 block text-[12px] font-medium text-muted">Round to</span>
          <div
            role="group"
            aria-label="Rounding increment"
            className="flex h-11 gap-1 rounded-xl border border-line-2 bg-surface-2 p-1"
          >
            {INCREMENTS.map((inc) => {
              const active = state.inc === inc;
              return (
                <button
                  key={inc}
                  type="button"
                  aria-pressed={active}
                  onClick={() => dispatch({ type: 'setInc', value: inc })}
                  className={[
                    'flex-1 rounded-lg font-mono text-[13px] transition-colors',
                    active
                      ? 'bg-ink font-bold text-bg'
                      : 'text-muted hover:bg-surface-3 hover:text-ink',
                  ].join(' ')}
                >
                  {inc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="m-0 mt-2 text-[11px] leading-relaxed text-muted-2">
        Used for bodyweight lifts. A more recent weigh-in on the Weight page takes over.
      </p>

      {/* backup — the only copy of your data lives in this browser */}
      <div className="mt-4 border-t border-line pt-4">
        <span className="block font-display text-[13px] font-bold tracking-[-0.01em]">Backup &amp; restore</span>
        <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-muted-2">
          Your data lives only in this browser. Export a file now and again so a
          cleared browser can&apos;t wipe it out.
        </p>
        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!exportBackup()) {
                setStatus('Nothing to export yet.');
              } else {
                recordBackup(state.sessions.length);
                setStatus('Backup downloaded.');
              }
            }}
            className="flex-1 rounded-xl bg-secondary/15 py-2.5 font-display text-[13px] font-bold text-secondary transition-colors hover:bg-secondary/25"
          >
            Export backup
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl border border-line-2 bg-surface-2 py-2.5 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50"
          >
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
        </div>
        {status && <p className="m-0 mt-2 text-[11px] font-medium text-muted">{status}</p>}
      </div>

      {/* import history from the Strong app */}
      <div className="mt-4 border-t border-line pt-4">
        <span className="block font-display text-[13px] font-bold tracking-[-0.01em]">
          Import from Strong
        </span>
        <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-muted-2">
          Coming from Strong? Export your data there (Profile → Settings → Export Data)
          and load the CSV here. Your whole history lands in History and the charts.
        </p>
        <button
          type="button"
          onClick={() => strongRef.current?.click()}
          className="mt-2.5 w-full rounded-xl border border-line-2 bg-surface-2 py-2.5 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50"
        >
          Import Strong CSV
        </button>
        <input
          ref={strongRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={onStrongFile}
          className="hidden"
        />
        {strongStatus && (
          <p className="m-0 mt-2 text-[11px] font-medium text-muted">{strongStatus}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset the week? This clears every logged set across all days. Your references, exercise swaps, and last-session weights are kept.')) {
              dispatch({ type: 'resetWeek' });
            }
          }}
          className="text-[12px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
        >
          Reset week
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear ALL data — references, logged sets, exercise swaps, and history?')) {
              dispatch({ type: 'clearAll' });
            }
          }}
          className="text-[12px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
        >
          Clear all data
        </button>
      </div>
    </div>
  );
}

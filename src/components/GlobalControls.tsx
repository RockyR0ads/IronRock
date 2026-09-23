import { useRef, useState } from 'react';
import { useStore } from '../state/StoreContext';
import type { Increment } from '../domain/types';
import { exportBackup, importBackup, recordBackup } from '../domain/backup';
import {
  getCloudConfig,
  setCloudConfig,
  clearCloudConfig,
  cloudBackup,
  cloudRestore,
  DEFAULT_CLOUD_URL,
} from '../domain/cloudBackup';
import { parseStrong, StrongImportError } from '../domain/strongImport';

const INCREMENTS: Increment[] = [1, 2.5, 5];

export function GlobalControls() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const strongRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [strongStatus, setStrongStatus] = useState<string | null>(null);

  // --- cloud backup (the user's own LeaveNow Azure endpoint) ---
  const [cloud, setCloud] = useState(getCloudConfig());
  const [cloudUrl, setCloudUrl] = useState(cloud?.url ?? DEFAULT_CLOUD_URL);
  const [cloudSecret, setCloudSecret] = useState(cloud?.secret ?? '');
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);

  function saveCloud() {
    const url = cloudUrl.trim();
    const secret = cloudSecret.trim();
    if (!url || !secret) {
      setCloudStatus('Enter both the server URL and the secret.');
      return;
    }
    setCloudConfig({ url, secret });
    setCloud({ url, secret });
    setCloudStatus('Saved. Try “Back up now”.');
  }

  function disconnectCloud() {
    if (!confirm('Disconnect cloud backup? Your data stays; this only forgets the server and secret on this device.')) return;
    clearCloudConfig();
    setCloud(null);
    setCloudSecret('');
    setCloudStatus(null);
  }

  async function doCloudBackup() {
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      const bytes = await cloudBackup(state.sessions.length);
      setCloudStatus(`Backed up to the cloud (${(bytes / 1024).toFixed(1)} KB).`);
    } catch (err) {
      setCloudStatus(err instanceof Error ? err.message : 'Backup failed.');
    } finally {
      setCloudBusy(false);
    }
  }

  async function doCloudRestore() {
    if (!confirm('Restore from the cloud? This replaces all data currently in the app on this device.')) return;
    setCloudBusy(true);
    setCloudStatus(null);
    try {
      await cloudRestore(); // reloads on success
    } catch (err) {
      setCloudStatus(err instanceof Error ? err.message : 'Restore failed.');
      setCloudBusy(false);
    }
  }

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

      {/* cloud backup — the user's own LeaveNow Azure endpoint */}
      <div className="mt-4 border-t border-line pt-4">
        <span className="block font-display text-[13px] font-bold tracking-[-0.01em]">Cloud backup</span>
        <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-muted-2">
          Back up to your own server so a lost, reset, or reinstalled phone can be
          restored in a tap.
        </p>

        {cloud ? (
          <div className="mt-2.5">
            <p className="m-0 mb-2 truncate font-mono text-[11px] text-muted-2" title={cloud.url}>
              Connected · {cloud.url.replace(/^https?:\/\//, '')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={cloudBusy}
                onClick={doCloudBackup}
                className="flex-1 rounded-xl bg-secondary/15 py-2.5 font-display text-[13px] font-bold text-secondary transition-colors hover:bg-secondary/25 disabled:opacity-50"
              >
                {cloudBusy ? 'Working…' : 'Back up now'}
              </button>
              <button
                type="button"
                disabled={cloudBusy}
                onClick={doCloudRestore}
                className="flex-1 rounded-xl border border-line-2 bg-surface-2 py-2.5 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50 disabled:opacity-50"
              >
                Restore from cloud
              </button>
            </div>
            <button
              type="button"
              onClick={disconnectCloud}
              className="mt-2 text-[11px] font-medium text-muted-2 underline-offset-4 hover:text-accent hover:underline"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
            <input
              type="url"
              inputMode="url"
              value={cloudUrl}
              onChange={(e) => setCloudUrl(e.target.value)}
              placeholder="Backup endpoint URL"
              aria-label="Cloud backup endpoint URL"
              className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3 font-mono text-[12px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
            />
            <input
              type="password"
              value={cloudSecret}
              onChange={(e) => setCloudSecret(e.target.value)}
              placeholder="Backup secret"
              aria-label="Cloud backup secret"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3 font-mono text-[13px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
            />
            <button
              type="button"
              onClick={saveCloud}
              className="w-full rounded-xl bg-secondary/15 py-2.5 font-display text-[13px] font-bold text-secondary transition-colors hover:bg-secondary/25"
            >
              Connect
            </button>
          </div>
        )}
        {cloudStatus && <p className="m-0 mt-2 text-[11px] font-medium text-muted">{cloudStatus}</p>}
      </div>

      {/* local file backup — offline fallback / manual copy */}
      <div className="mt-4 border-t border-line pt-4">
        <span className="block font-display text-[13px] font-bold tracking-[-0.01em]">Local file backup</span>
        <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-muted-2">
          Prefer a file? Export a JSON copy you keep yourself, or import one to restore.
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

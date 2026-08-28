import { useRef, useState } from 'react';
import { useStore } from '../state/StoreContext';
import { useStorageHealth } from '../state/storageHealth';
import { exportBackup, importBackup, recordBackup, shouldNudgeBackup } from '../domain/backup';

/**
 * A top-of-app safety banner. Priority order:
 *  1. loadFailed  — saved data couldn't be read; saving is paused. Not dismissible.
 *  2. quotaFailed — storage is full; changes aren't saving. Not dismissible.
 *  3. backup nudge — several workouts since the last export. Dismissible.
 */
export function DataBanner() {
  const { state } = useStore();
  const health = useStorageHealth();
  const [dismissed, setDismissed] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await importBackup(file); // reloads on success
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not read that file.');
    }
  }

  const doExport = () => {
    if (exportBackup()) {
      recordBackup(state.sessions.length);
      setDismissed(true);
    }
  };

  let tone = '';
  let title = '';
  let body = '';
  let actions: React.ReactNode = null;

  if (health.loadFailed) {
    tone = 'border-accent/50 bg-accent/10';
    title = 'Your saved data couldn’t be read';
    body =
      'To avoid overwriting it, saving is paused for now. Import your latest backup, or reload to try again.';
    actions = (
      <>
        <BtnPrimary onClick={() => fileRef.current?.click()}>Import backup</BtnPrimary>
        <BtnGhost onClick={() => location.reload()}>Reload</BtnGhost>
      </>
    );
  } else if (health.quotaFailed) {
    tone = 'border-accent/50 bg-accent/10';
    title = 'Storage is full — changes aren’t saving';
    body = 'Export a backup now so nothing is lost, then clear old history to free space.';
    actions = <BtnPrimary onClick={doExport}>Export backup</BtnPrimary>;
  } else if (!dismissed && shouldNudgeBackup(state.sessions.length)) {
    tone = 'border-secondary/40 bg-secondary/10';
    title = 'Time to back up';
    body = 'You’ve logged new workouts since your last backup. Export keeps them safe from a cleared browser.';
    actions = (
      <>
        <BtnPrimary onClick={doExport}>Export backup</BtnPrimary>
        <BtnGhost onClick={() => setDismissed(true)}>Later</BtnGhost>
      </>
    );
  } else {
    return null;
  }

  return (
    <div className="px-3 pt-safe">
      <div className={`mt-2 rounded-2xl border ${tone} px-4 py-3`}>
        <div className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">{title}</div>
        <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{body}</p>
        {err && <p className="m-0 mt-1 text-[12px] font-medium text-accent">{err}</p>}
        <div className="mt-2.5 flex gap-2">{actions}</div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onImport}
        className="hidden"
      />
    </div>
  );
}

function BtnPrimary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-accent px-3.5 py-2 font-display text-[13px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99]"
    >
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2 font-display text-[13px] font-bold text-ink transition-colors hover:border-line-2"
    >
      {children}
    </button>
  );
}

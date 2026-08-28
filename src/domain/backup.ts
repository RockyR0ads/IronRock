import { STORAGE_KEY } from '../state/store';

/**
 * Local data safety net. Everything lives in localStorage, which the browser can
 * evict (storage pressure, "clear browsing data", iOS's 7-day rule). These helpers
 * let the user keep an off-device copy and ask the browser not to evict.
 */

/** Ask the browser to keep our storage (won't evict under pressure). Best-effort. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* not supported */
  }
  return false;
}

const LAST_BACKUP_KEY = 'ironrock-last-backup';

interface LastBackup {
  at: number;
  sessions: number;
}

/** Record that a backup was just taken (for the "time to back up" nudge). */
export function recordBackup(sessionCount: number): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify({ at: Date.now(), sessions: sessionCount }));
  } catch {
    /* best effort */
  }
}

function getLastBackup(): LastBackup | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as LastBackup) : null;
  } catch {
    return null;
  }
}

const NUDGE_SESSIONS = 5;
const NUDGE_DAYS = 14;

/**
 * Whether to nudge the user to export: several new workouts since the last
 * backup, or it's been a couple of weeks with new activity. Never nudges an
 * empty app.
 */
export function shouldNudgeBackup(sessionCount: number): boolean {
  if (sessionCount === 0) return false;
  const last = getLastBackup();
  if (!last) return sessionCount >= 3; // has data, never backed up
  const newSessions = sessionCount - last.sessions;
  const days = (Date.now() - last.at) / 86_400_000;
  return newSessions >= NUDGE_SESSIONS || (newSessions > 0 && days >= NUDGE_DAYS);
}

/** Download the current data as a timestamped JSON backup file. */
export function exportBackup(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `ironrock-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

/**
 * Restore a backup file. Validates it looks like IronRock data, writes it to
 * storage, and reloads so the app boots from it. Throws with a friendly message
 * if the file isn't a valid backup.
 */
export async function importBackup(file: File): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't valid JSON — pick an IronRock backup file.");
  }
  const looksRight =
    typeof parsed === 'object' &&
    parsed !== null &&
    ('sessions' in parsed || 'refs' in parsed || 'logs' in parsed);
  if (!looksRight) throw new Error("That doesn't look like an IronRock backup.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  location.reload();
}

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

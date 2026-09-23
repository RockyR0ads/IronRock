import { STORAGE_KEY } from '../state/store';
import { recordBackup } from './backup';

/**
 * Cloud backup to the user's own server (a LeaveNow Azure Function foreign
 * endpoint). The whole localStorage document is pushed as one JSON blob, gated
 * by a shared secret sent in the `X-Backup-Secret` header.
 *
 * The endpoint + secret live in their OWN localStorage key — deliberately NOT
 * part of the app state that gets backed up — so the backup blob never contains
 * the credential and restoring on a new device doesn't clobber the connection.
 */

const CLOUD_KEY = 'ironrock-cloud-v1';

/** Suggested endpoint, prefilled in the setup form (user can change it). */
export const DEFAULT_CLOUD_URL = 'https://leavenow-96391.azurewebsites.net/api/ironrock/backup';

export interface CloudConfig {
  /** Full backup endpoint URL. */
  url: string;
  /** Shared secret, sent as the X-Backup-Secret header. */
  secret: string;
}

export function getCloudConfig(): CloudConfig | null {
  try {
    const raw = localStorage.getItem(CLOUD_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<CloudConfig>;
    if (!c.url || !c.secret) return null;
    return { url: c.url, secret: c.secret };
  } catch {
    return null;
  }
}

export function setCloudConfig(cfg: CloudConfig): void {
  try {
    localStorage.setItem(CLOUD_KEY, JSON.stringify({ url: cfg.url.trim(), secret: cfg.secret.trim() }));
  } catch {
    /* best effort */
  }
}

export function clearCloudConfig(): void {
  try {
    localStorage.removeItem(CLOUD_KEY);
  } catch {
    /* best effort */
  }
}

export function isCloudConfigured(): boolean {
  return getCloudConfig() !== null;
}

/** Human-friendly message for a failed request, mapping the common statuses. */
function statusMessage(status: number): string {
  if (status === 401) return 'Wrong backup secret — check it in settings.';
  if (status === 503) return 'The server has no backup secret configured yet.';
  if (status === 404) return 'No cloud backup found yet.';
  if (status === 413) return 'Your data is too large for the backup endpoint.';
  return `Server error (${status}).`;
}

/** Push the current data to the cloud. Returns the byte count on success. */
export async function cloudBackup(sessionCount: number): Promise<number> {
  const cfg = getCloudConfig();
  if (!cfg) throw new Error('Cloud backup isn’t set up yet.');
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('Nothing to back up yet.');

  let res: Response;
  try {
    res = await fetch(cfg.url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Backup-Secret': cfg.secret },
      body: raw,
    });
  } catch {
    throw new Error('Couldn’t reach the server — check your connection and the URL.');
  }
  if (!res.ok) throw new Error(statusMessage(res.status));

  recordBackup(sessionCount); // resets the "back up" nudge
  return new Blob([raw]).size;
}

/**
 * Pull the cloud backup and restore it, replacing all local data and reloading.
 * Validates the payload looks like IronRock data before overwriting anything.
 */
export async function cloudRestore(): Promise<void> {
  const cfg = getCloudConfig();
  if (!cfg) throw new Error('Cloud backup isn’t set up yet.');

  let res: Response;
  try {
    res = await fetch(cfg.url, { headers: { 'X-Backup-Secret': cfg.secret } });
  } catch {
    throw new Error('Couldn’t reach the server — check your connection and the URL.');
  }
  if (!res.ok) throw new Error(statusMessage(res.status));

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The cloud backup was unreadable.');
  }
  const looksRight =
    typeof parsed === 'object' &&
    parsed !== null &&
    ('sessions' in parsed || 'refs' in parsed || 'logs' in parsed);
  if (!looksRight) throw new Error('That doesn’t look like an IronRock backup.');

  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  location.reload();
}

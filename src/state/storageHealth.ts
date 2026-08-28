import { useSyncExternalStore } from 'react';

/**
 * Tracks whether persistence is healthy, so the UI can warn the user before a
 * silent problem becomes data loss:
 *  - `loadFailed`: the saved data existed but couldn't be parsed. Saving is
 *    frozen so we don't overwrite the (recoverable) original.
 *  - `quotaFailed`: a write was rejected because storage is full, so recent
 *    changes aren't being persisted.
 */
export interface StorageHealth {
  loadFailed: boolean;
  quotaFailed: boolean;
}

let health: StorageHealth = { loadFailed: false, quotaFailed: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getStorageHealth(): StorageHealth {
  return health;
}

export function markLoadFailed(): void {
  if (health.loadFailed) return;
  health = { ...health, loadFailed: true };
  emit();
}

export function markQuotaFailed(): void {
  if (health.quotaFailed) return;
  health = { ...health, quotaFailed: true };
  emit();
}

/** Cleared after a successful import/reload path re-establishes good data. */
export function clearStorageHealth(): void {
  health = { loadFailed: false, quotaFailed: false };
  emit();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStorageHealth(): StorageHealth {
  return useSyncExternalStore(subscribe, getStorageHealth, getStorageHealth);
}

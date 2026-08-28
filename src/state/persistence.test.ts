import { describe, it, expect, beforeEach } from 'vitest';
import { loadState, saveState, initialState, STORAGE_KEY } from './store';
import { getStorageHealth, clearStorageHealth } from './storageHealth';

describe('persistence safety', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStorageHealth();
  });

  it('quarantines unreadable data and refuses to overwrite it', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not valid json');
    const state = loadState();

    // flagged as failed, so the app knows not to trust persistence
    expect(getStorageHealth().loadFailed).toBe(true);

    // the raw bytes are quarantined, not discarded
    const quarantined = Object.keys(localStorage).filter((k) =>
      k.startsWith(`${STORAGE_KEY}-corrupt-`)
    );
    expect(quarantined).toHaveLength(1);

    // the critical guarantee: a save must NOT clobber the original with empty state
    saveState(state);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{ this is not valid json');
  });

  it('loads and saves normally when data is valid', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialState(), bw: '80' }));
    const loaded = loadState();
    expect(loaded.bw).toBe('80');
    expect(getStorageHealth().loadFailed).toBe(false);

    saveState({ ...loaded, bw: '82' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).bw).toBe('82');
  });

  it('treats missing data as a fresh start (no failure, save allowed)', () => {
    const state = loadState();
    expect(getStorageHealth().loadFailed).toBe(false);
    saveState(state);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });
});

/**
 * Thin wrapper over the Screen Wake Lock API so the phone doesn't dim or sleep
 * while a rest timer is counting down. The OS drops the lock whenever the page
 * is hidden, so callers re-acquire on visibility change. All best-effort: on a
 * browser without the API, every call is a safe no-op.
 */

type Sentinel = { release: () => Promise<void>; addEventListener: (t: string, cb: () => void) => void };

let sentinel: Sentinel | null = null;

export async function acquireWake(): Promise<void> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<Sentinel> } }).wakeLock;
    if (!wl || sentinel) return;
    sentinel = await wl.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    /* unsupported or denied — fine */
  }
}

export async function releaseWake(): Promise<void> {
  try {
    await sentinel?.release();
  } catch {
    /* already gone */
  }
  sentinel = null;
}

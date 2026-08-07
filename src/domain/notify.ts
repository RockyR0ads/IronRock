/**
 * Rest-timer notifications. On mobile the app is usually backgrounded or the
 * screen is locked during a rest, so a live countdown is shown in the tray and
 * an alerting one fires when it's up. The countdown is redrawn each second but
 * kept SILENT (`silent: true`) and replaces itself in place (`renotify: false`,
 * same `tag`), so updating it never sounds or vibrates — only the completion
 * notification alerts.
 *
 * Android Chrome only allows notifications via the service worker registration
 * (`new Notification()` throws), so we prefer `registration.showNotification`
 * and fall back to the constructor on desktop where there may be no SW.
 */

const TAG = 'ironrock-rest';
const ICON = `${import.meta.env.BASE_URL}pwa-192x192.png`;

// vibrate/renotify aren't in every TS DOM lib's NotificationOptions.
type RestNotifyOptions = NotificationOptions & { vibrate?: number[]; renotify?: boolean };

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notifyPermission(): NotificationPermission {
  return notifySupported() ? Notification.permission : 'denied';
}

/** Ask once (must be called from a user gesture). Returns the resolved state. */
export async function requestNotify(): Promise<NotificationPermission> {
  if (!notifySupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function swReg(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

async function show(title: string, options: RestNotifyOptions) {
  if (notifyPermission() !== 'granted') return;
  const reg = await swReg();
  if (reg) {
    await reg.showNotification(title, options);
  } else {
    try {
      new Notification(title, options);
    } catch {
      /* SW-only platform with no active registration — nothing to show */
    }
  }
}

/**
 * Redraw the live rest countdown. Silent + renotify:false + a stable tag means
 * it replaces the previous notification in place without any sound or vibration,
 * so it can tick every second without pinging.
 */
export function updateRestNotification(secondsLeft: number) {
  void show('Resting', {
    tag: TAG,
    body: `${fmt(secondsLeft)} until your next set`,
    icon: ICON,
    badge: ICON,
    silent: true,
    renotify: false,
    requireInteraction: true,
  });
}

/** Alerting notification when the rest is up. */
export function completeRestNotification() {
  void show('Rest complete', {
    tag: TAG,
    body: 'Back to the bar — start your next set.',
    icon: ICON,
    badge: ICON,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  });
}

/** Dismiss any ongoing rest notification (on skip, or when the app refocuses). */
export async function clearRestNotification() {
  const reg = await swReg();
  if (!reg) return;
  const notes = await reg.getNotifications({ tag: TAG });
  notes.forEach((n) => n.close());
}

/**
 * Rest-timer notifications. On mobile the app is usually backgrounded during a
 * rest, so a single tray notification is posted showing the *absolute* finish
 * time (which stays accurate without any updates), and an alerting one fires
 * when it's up.
 *
 * We deliberately do NOT redraw a per-second countdown: re-posting the same tag
 * every second makes paired wearables (Wear OS / watchOS) buzz on every update,
 * even with `silent: true` / `renotify: false`, because the phone→watch bridge
 * treats each re-post as a fresh arrival. The live second-by-second countdown
 * lives in the in-app bar instead; the tray just says when the rest ends.
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

function clockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
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
 * Post the rest notification once. Shows the absolute finish time so it stays
 * accurate without any per-second updates (see the file header for why we don't
 * redraw it). Silent, so posting it doesn't buzz.
 */
export function showRestNotification(secondsLeft: number) {
  const end = new Date(Date.now() + secondsLeft * 1000);
  void show('Resting', {
    tag: TAG,
    body: `Next set at ${clockTime(end)} · ${fmt(secondsLeft)} to go`,
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

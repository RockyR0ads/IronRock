import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  requestNotify,
  showRestNotification,
  completeRestNotification,
  clearRestNotification,
} from './notify';

/**
 * Native rest-timer plugin (Android). On a native build this drives a live
 * lock-screen chronometer and an alerting completion notification; the web build
 * never calls it (see `restNotifier` selection below).
 */
interface RestTimerNative {
  start(options: { seconds: number }): Promise<void>;
  stop(): Promise<void>;
  requestPermission(): Promise<{ granted: boolean }>;
}

const Native = registerPlugin<RestTimerNative>('RestTimer');

/**
 * Platform-agnostic rest notifications. The web impl posts a single static
 * "finish time" notification only while backgrounded (the browser can't tick a
 * tray timer without buzzing); the native impl hands the whole rest to the OS,
 * which shows a real ticking countdown and fires the alert on its own.
 */
export interface RestNotifier {
  /** Ask for notification permission — call from a user gesture. */
  requestPermission(): void;
  /** A rest just started (`seconds` total). */
  start(seconds: number): void;
  /** App went to the background mid-rest. */
  background(secondsLeft: number): void;
  /** App returned to the foreground. */
  foreground(): void;
  /** The rest elapsed. */
  complete(): void;
  /** Rest skipped / cleared early. */
  stop(): void;
}

const nativeNotifier: RestNotifier = {
  requestPermission() {
    void Native.requestPermission();
  },
  // The OS owns the countdown once started — show it immediately (lock screen),
  // and let the scheduled alarm fire the completion alert.
  start(seconds) {
    void Native.start({ seconds });
  },
  background() {},
  foreground() {},
  complete() {},
  stop() {
    void Native.stop();
  },
};

const webNotifier: RestNotifier = {
  requestPermission() {
    void requestNotify();
  },
  start(seconds) {
    if (document.hidden) showRestNotification(seconds);
  },
  background(secondsLeft) {
    showRestNotification(secondsLeft);
  },
  foreground() {
    void clearRestNotification();
  },
  complete() {
    if (document.hidden) completeRestNotification();
  },
  stop() {
    void clearRestNotification();
  },
};

export const restNotifier: RestNotifier = Capacitor.isNativePlatform()
  ? nativeNotifier
  : webNotifier;

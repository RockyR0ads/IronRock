import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  requestNotify,
  updateRestNotification,
  completeRestNotification,
  clearRestNotification,
} from '../domain/notify';

/** Default rest between sets, in seconds. */
export const REST_DEFAULT = 120;

interface RestTimerValue {
  /** Seconds remaining; 0 when idle. */
  secondsLeft: number;
  /** The duration the current rest started from (for progress display). */
  duration: number;
  running: boolean;
  /** Id of the card that started the current rest (for its background fill). */
  ownerId: string | null;
  /** Start (or restart) a rest countdown, optionally tagged to a card id. */
  start: (seconds?: number, ownerId?: string) => void;
  /** Add/remove time (e.g. ±15s) without restarting. */
  addTime: (delta: number) => void;
  /** Stop and reset to idle. */
  skip: () => void;
}

const RestTimerContext = createContext<RestTimerValue | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [duration, setDuration] = useState(REST_DEFAULT);
  const [running, setRunning] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  // live mirrors so the visibility listener can read current values
  const leftRef = useRef(0);
  const runningRef = useRef(false);
  leftRef.current = secondsLeft;
  runningRef.current = running;

  const stop = useCallback(() => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback((seconds = REST_DEFAULT, owner: string | null = null) => {
    setDuration(seconds);
    setSecondsLeft(seconds);
    setOwnerId(owner);
    setRunning(true);
    // called from a set tap (a user gesture), so it's a valid time to prompt.
    // The in-app bar covers the foreground case; the tray countdown is for when
    // the app is backgrounded.
    void requestNotify();
    if (document.hidden) updateRestNotification(seconds);
  }, []);

  const skip = useCallback(() => {
    stop();
    setSecondsLeft(0);
    setOwnerId(null);
    void clearRestNotification();
  }, [stop]);

  const addTime = useCallback((delta: number) => {
    setSecondsLeft((s) => Math.max(0, s + delta));
    setDuration((d) => Math.max(d, 0));
  }, []);

  // Drive the countdown.
  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          if (tick.current) clearInterval(tick.current);
          tick.current = null;
          navigator.vibrate?.(300);
          if (document.hidden) completeRestNotification();
          return 0;
        }
        const next = s - 1;
        // live tick — silent, so redrawing each second doesn't ping
        if (document.hidden) updateRestNotification(next);
        return next;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
      tick.current = null;
    };
  }, [running]);

  // The in-app bar covers the visible case, so only surface a notification when
  // the app is backgrounded; clear it the moment the app comes back to front.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        if (runningRef.current) updateRestNotification(leftRef.current);
      } else {
        void clearRestNotification();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <RestTimerContext.Provider
      value={{ secondsLeft, duration, running, ownerId, start, addTime, skip }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRestTimer(): RestTimerValue {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error('useRestTimer must be used within a RestTimerProvider');
  return ctx;
}

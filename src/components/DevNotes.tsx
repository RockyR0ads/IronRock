import { useEffect, useRef, useState } from 'react';

// Dev-only notes: jot issues and ideas while using the app, then "Copy all" and
// paste them to Claude. Notes stay on this device (localStorage) — no backend.
// The bubble only shows in dev mode: visit /?dev=1 once (or tap the version in
// Settings five times); /?dev=0 or the same taps turn it off.

export interface DevNote {
  id: string;
  kind: 'issue' | 'idea';
  text: string;
  /** ISO time the note was saved. */
  at: string;
  /** Screen the app was on, e.g. "/exercisePage/bench". */
  screen: string;
  version: string;
}

const NOTES_KEY = 'devnotes';
const FLAG_KEY = 'devmode';
const POS_KEY = 'devnotes-pos';

export const APP_VERSION = `${__APP_VERSION__} (${__APP_COMMIT__})`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked — notes just won't persist */
  }
}

export function devModeOn(): boolean {
  return read(FLAG_KEY, false);
}

/** Flip dev mode and tell the bubble to show or hide. */
export function setDevMode(on: boolean) {
  write(FLAG_KEY, on);
  window.dispatchEvent(new Event('devmode'));
}

/** Honour ?dev=1 / ?dev=0 once, then drop it from the URL. */
function applyDevParam() {
  const url = new URL(window.location.href);
  const v = url.searchParams.get('dev');
  if (v !== '1' && v !== '0') return;
  setDevMode(v === '1');
  url.searchParams.delete('dev');
  window.history.replaceState(window.history.state, '', url.toString());
}

const pad = (n: number) => String(n).padStart(2, '0');
function stamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The clipboard text: a header naming the app and build, then one line per note. */
export function formatNotes(notes: DevNote[], now = new Date()): string {
  const lines = [...notes]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((n) => `- [${n.kind}] ${stamp(new Date(n.at))} · ${n.screen} · ${n.text.replace(/\s*\n\s*/g, ' ')}`);
  return [`# IronRock dev notes`, `Version ${APP_VERSION} · copied ${stamp(now)}`, '', ...lines].join('\n');
}

export function DevNotes({ screen }: { screen: string }) {
  const [on, setOn] = useState(() => {
    applyDevParam();
    return devModeOn();
  });
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<DevNote[]>(() => read(NOTES_KEY, []));
  const [text, setText] = useState('');
  const [kind, setKind] = useState<DevNote['kind']>('issue');
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState(() => read(POS_KEY, { x: -1, y: -1 }));
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  useEffect(() => {
    const sync = () => setOn(devModeOn());
    window.addEventListener('devmode', sync);
    return () => window.removeEventListener('devmode', sync);
  }, []);

  if (!on) return null;

  const save = (next: DevNote[]) => {
    setNotes(next);
    write(NOTES_KEY, next);
  };

  function add() {
    const t = text.trim();
    if (!t) return;
    save([
      ...notes,
      { id: Date.now().toString(36), kind, text: t, at: new Date().toISOString(), screen, version: APP_VERSION },
    ]);
    setText('');
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(formatNotes(notes));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Copy failed — clipboard not available here.');
    }
  }

  // default spot: bottom-right, above the safe area
  const x = pos.x < 0 ? window.innerWidth - 64 : Math.min(pos.x, window.innerWidth - 52);
  const y = pos.y < 0 ? window.innerHeight - 140 : Math.min(pos.y, window.innerHeight - 52);

  return (
    <>
      <button
        type="button"
        aria-label="Dev notes"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { dx: e.clientX - x, dy: e.clientY - y, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const nx = e.clientX - d.dx;
          const ny = e.clientY - d.dy;
          if (!d.moved && Math.hypot(nx - x, ny - y) < 6) return;
          d.moved = true;
          setPos({ x: Math.max(4, nx), y: Math.max(4, ny) });
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d?.moved) write(POS_KEY, pos);
          else setOpen(true);
        }}
        style={{ left: x, top: y, touchAction: 'none' }}
        className="fixed z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-accent/60 bg-surface font-mono text-[11px] font-bold text-accent shadow-card"
      >
        {notes.length || 'DEV'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Dev notes"
            className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-line bg-surface sm:max-w-[560px] sm:rounded-3xl sm:border"
          >
            <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
              <div>
                <div className="font-display text-[18px] font-black uppercase">Dev notes</div>
                <div className="font-mono text-[10px] text-muted-2">
                  {screen} · {APP_VERSION}
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-semibold text-muted">
                Close
              </button>
            </div>

            <div className="px-5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's wrong, or what would be better?"
                rows={3}
                className="w-full rounded-xl border border-line-2 bg-surface-2 p-3 text-[14px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                {(['issue', 'idea'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                    className={[
                      'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold capitalize',
                      kind === k ? 'border-accent bg-accent/10 text-accent' : 'border-line-2 text-muted',
                    ].join(' ')}
                  >
                    {k}
                  </button>
                ))}
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={add}
                  disabled={!text.trim()}
                  className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-bold text-bg disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-line px-5 py-3">
              {notes.length === 0 && <p className="text-[13px] text-muted-2">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="flex items-start gap-2 border-b border-line/60 py-2.5 last:border-b-0">
                  <span
                    className={`mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${n.kind === 'issue' ? 'bg-accent/15 text-accent' : 'bg-green/15 text-green'}`}
                  >
                    {n.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="whitespace-pre-wrap text-[13px] text-ink">{n.text}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-2">
                      {stamp(new Date(n.at))} · {n.screen}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Clear note"
                    onClick={() => save(notes.filter((x) => x.id !== n.id))}
                    className="text-[16px] leading-none text-muted-2 hover:text-ink"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-line px-5 py-3 pb-safe">
              <button
                type="button"
                onClick={copyAll}
                disabled={notes.length === 0}
                className="flex-1 rounded-xl bg-secondary/15 py-2.5 text-[14px] font-bold text-secondary disabled:opacity-40"
              >
                {copied ? 'Copied' : 'Copy all'}
              </button>
              <button
                type="button"
                onClick={() => confirm(`Clear all ${notes.length} notes?`) && save([])}
                disabled={notes.length === 0}
                className="rounded-xl border border-line-2 px-4 py-2.5 text-[14px] font-semibold text-muted disabled:opacity-40"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

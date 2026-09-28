import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { buildSteps, STRETCH_TEMPLATES, sessionAreas } from '../../domain/stretchProgram';
import { newSessionId } from '../../domain/session';
import type { StretchSession } from '../../domain/stretchSession';
import { CheckIcon, ChevronLeft, ChevronRight } from '../common/icons';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

const TYPE_LABEL = { dynamic: 'Move', static: 'Hold', pnf: 'Contract–relax' } as const;
const SIDE_LABEL = { L: 'Left', R: 'Right' } as const;

/**
 * The guided, hands-free session player. Walks the built step list, running a
 * countdown per hold, auto-advancing (with a buzz) on zero, and archiving the
 * session when the flow finishes. The step cursor lives in the store so leaving
 * and coming back resumes where you were.
 */
export function StretchPlayer({ onExit }: { onExit: () => void }) {
  const { state, dispatch } = useStore();
  const active = state.stretch.active;
  const steps = useMemo(
    () => (active ? buildSteps(active.type, active.week) : []),
    [active?.type, active?.week],
  );

  const idx = active?.step ?? 0;
  const step = steps[idx];
  const [remaining, setRemaining] = useState(step?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [summary, setSummary] = useState<StretchSession | null>(null);

  // reset the clock whenever the step changes
  useEffect(() => {
    setRemaining(steps[idx]?.seconds ?? 0);
    setPaused(false);
  }, [idx, steps]);

  // the countdown — one setTimeout per second; auto-advances at zero
  useEffect(() => {
    if (paused || summary || !step) return;
    if (remaining <= 0) {
      navigator.vibrate?.(idx + 1 >= steps.length ? [90, 60, 90, 60, 220] : 180);
      advance(idx + 1);
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, paused, summary, step, idx, steps.length]);

  // nothing in progress and no summary to show — bail back to the home view
  useEffect(() => {
    if (!active && !summary) onExit();
  }, [active, summary, onExit]);

  function heldSeconds(count: number): number {
    return steps.slice(0, count).reduce((sum, s) => sum + s.seconds, 0);
  }

  // move to a step index; past the end, finish (archiving what was completed)
  function advance(next: number) {
    if (!active) return;
    if (next >= steps.length) {
      finish(steps.length);
      return;
    }
    dispatch({ type: 'setStretchStep', step: next });
  }

  function finish(completed: number) {
    if (!active) return;
    if (completed <= 0) {
      dispatch({ type: 'cancelStretch' });
      onExit();
      return;
    }
    const session: StretchSession = {
      id: newSessionId(),
      at: new Date().toISOString(),
      type: active.type,
      steps: completed,
      holdSec: heldSeconds(completed),
      areas: sessionAreas(active.type),
    };
    dispatch({ type: 'completeStretch', session });
    setSummary(session);
  }

  function endEarly() {
    if (confirm('End this session? What you’ve done so far is saved to history.')) finish(idx);
  }

  if (summary) {
    const tmpl = STRETCH_TEMPLATES[summary.type];
    return (
      <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col items-center justify-center px-6 pt-safe text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green text-bg shadow-glow">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h2 className="mt-5 font-display text-[26px] font-black uppercase tracking-[-0.01em]">
          {tmpl.label} done
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          {summary.steps} holds · {mmss(summary.holdSec)} under tension
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-8 w-full rounded-2xl bg-secondary py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] text-bg shadow-glow transition-transform active:scale-[0.99]"
        >
          Done
        </button>
      </div>
    );
  }

  if (!step) return null;

  const tmpl = STRETCH_TEMPLATES[active!.type];
  const pct = step.seconds > 0 ? ((step.seconds - remaining) / step.seconds) * 100 : 0;
  const next = steps[idx + 1];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-5 pb-8 pt-safe">
      {/* top bar */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={endEarly}
          aria-label="End session"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-muted hover:text-ink"
        >
          ✕
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-2">
          {tmpl.label} · {idx + 1} / {steps.length}
        </span>
        <span className="h-10 w-10" />
      </div>

      {/* progress dots */}
      <div className="mt-3 flex gap-1">
        {steps.map((_, i) => (
          <span
            key={i}
            className={[
              'h-1 flex-1 rounded-full transition-colors',
              i < idx ? 'bg-secondary' : i === idx ? 'bg-secondary/50' : 'bg-line',
            ].join(' ')}
          />
        ))}
      </div>

      {/* the current hold */}
      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {TYPE_LABEL[step.type]}
          </span>
          {step.side && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
              {SIDE_LABEL[step.side]}
            </span>
          )}
          {step.sets > 1 && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              Round {step.set}/{step.sets}
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-[30px] font-black uppercase leading-[1.05] tracking-[-0.01em]">
          {step.name}
        </h1>

        {/* countdown ring */}
        <div className="relative mt-6 flex h-52 w-52 items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(var(--line))" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(var(--secondary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={(2 * Math.PI * 45 * (100 - pct)) / 100}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <span className="font-mono text-[46px] font-bold tabular-nums text-ink">{mmss(remaining)}</span>
        </div>

        <p className="mt-6 max-w-[42ch] text-[14px] leading-relaxed text-muted">{step.cue}</p>
      </div>

      {/* controls */}
      <div className="mt-2">
        <div className="flex items-center justify-center gap-2">
          <CtrlBtn label="−15s" onClick={() => setRemaining((r) => Math.max(0, r - 15))} />
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-display text-[13px] font-black uppercase text-bg shadow-glow transition-transform active:scale-95"
          >
            {paused ? 'Go' : 'Hold'}
          </button>
          <CtrlBtn label="+15s" onClick={() => setRemaining((r) => r + 15)} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => advance(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="min-w-0 truncate font-mono text-[11px] text-muted-2">
            {next ? `Next: ${next.name}${next.side ? ` · ${SIDE_LABEL[next.side]}` : ''}` : 'Last hold'}
          </span>
          <button
            type="button"
            onClick={() => advance(idx + 1)}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-[13px] font-semibold text-secondary transition-colors hover:text-secondary-deep"
          >
            Skip <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 w-16 rounded-xl border border-line-2 bg-surface-2 font-mono text-[13px] font-bold text-muted transition-colors hover:text-ink"
    >
      {label}
    </button>
  );
}

import { weeklyMuscleSets, type MuscleVolume } from '../domain/insights';
import { isDeloadActive } from '../domain/deload';
import { useEffect, useState } from 'react';
import { useStore } from '../state/StoreContext';
import { effBlocks } from '../state/store';
import { defaultDay, daysForProgram } from '../domain/program';
import { programMeta } from '../domain/programs';
import { programCycle, rotationProgress, type RotationProgress } from '../domain/programTracker';
import { ChevronLeft, ChevronDown } from './common/icons';
import { DayView } from './DayView/DayView';
import { DayNav } from './DayView/DayNav';
import { WorkoutClockBar } from './DayView/WorkoutClockBar';
import { DeloadBanner } from './DeloadBanner';
import { RestTimerBar } from './RestTimerBar';
import { ExercisePicker, type PickerRequest } from './ExercisePicker/ExercisePicker';

/** What the open picker is doing: swapping a block, or adding a new one. */
type PickerMode = { kind: 'swap'; index: number } | { kind: 'add' };

/**
 * The PPL program week: the day switcher, the day's exercise cards, settings and
 * the reference panels. Owns the swap/add exercise picker for the active day.
 */
export function TrainWeek({
  onBack,
  onOpenExercise,
  onOpenSession,
}: {
  onBack: () => void;
  onOpenExercise?: (liftId: string) => void;
  /** Open an archived workout in History. */
  onOpenSession?: (sessionId: string) => void;
}) {
  const { state, dispatch } = useStore();
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  // close the day dropdown on Escape
  useEffect(() => {
    if (!dayPickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDayPickerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dayPickerOpen]);

  function pickerRequest(): PickerRequest | null {
    if (!picker) return null;
    if (picker.kind === 'swap') {
      const block = effBlocks(state, state.day)[picker.index];
      if (!block) return null;
      return { title: 'Swap exercise', currentId: block.lift };
    }
    return { title: 'Add exercise' };
  }

  function handlePick(liftId: string) {
    if (!picker) return;
    if (picker.kind === 'swap') {
      dispatch({ type: 'swapBlock', dayKey: state.day, index: picker.index, liftId });
    } else {
      dispatch({ type: 'addBlock', dayKey: state.day, liftId });
    }
    setPicker(null);
  }

  const day = defaultDay(state.day);
  const dayLetter = day?.variant.split('·')[0].trim();
  // this day's position in the program week (1-based), for the switcher pill
  const dayNum = daysForProgram(state.activeProgram).findIndex((d) => d.key === state.day) + 1;
  const programName = programMeta(state.activeProgram)?.name ?? 'Training';

  // Where the lifter is in the block: weeks advance by finishing every day of
  // the program, not by the calendar (a deload or a hand-set week restarts it).
  const cycle = programCycle(state.activeProgram);
  const prog = rotationProgress(state.sessions, cycle, {
    programStart: state.programStart,
    lastDeload: state.lastDeload,
    weekSet: state.weekSet,
  });
  const [weekOpen, setWeekOpen] = useState(false);
  const weekLabel = isDeloadActive(state) || prog?.isDeload ? 'Deload week' : `Week ${prog.weekInBlock}`;

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6 sm:pb-16">
      {weekOpen && (
        <WeekSheet
          prog={prog}
          // this week's work: from the week in progress's first workout, but never more
          // than 7 days back (a stalled week shouldn't pile up a month of sets)
          volume={weeklyMuscleSets(
            state.sessions,
            daysForProgram(state.activeProgram),
            [prog.history.find((w) => !w.end)?.start ?? new Date().toISOString(), new Date(Date.now() - 7 * 864e5).toISOString()]
              .sort()
              .pop()
          )}
          days={daysForProgram(state.activeProgram).map((d) => ({ key: d.key, label: `${d.label} · ${d.variant}` }))}
          // keep this week's progress: the set week starts where the current one did
          onSet={(w) =>
            dispatch({ type: 'setWeek', set: { week: (prog.block - 1) * prog.cycleWeeks + w, at: prog.weekStartedAt ?? new Date().toISOString() } })
          }
          onAuto={() => dispatch({ type: 'setWeek' })}
          onClose={() => setWeekOpen(false)}
        />
      )}
      <header className="flex items-center justify-between gap-3 pb-2 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-secondary/50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 leading-none">
            <button
              type="button"
              onClick={() => setWeekOpen(true)}
              aria-label={`${weekLabel} — how this is counted`}
              className="flex items-center gap-1 truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]"
            >
              {weekLabel}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-2" />
            </button>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              {programName}
            </div>
          </div>
        </div>

        {/* day switcher: opens the day selector dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDayPickerOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={dayPickerOpen}
            className="flex items-center gap-2 rounded-full border border-line-2 bg-surface py-2 pl-3.5 pr-2.5 transition-colors hover:border-secondary/50"
          >
            <span className="font-display text-[14px] font-bold tracking-[-0.01em]">
              {dayNum > 0 ? `Day ${dayNum}` : day?.label}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
              {dayLetter}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted transition-transform ${dayPickerOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {dayPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" aria-hidden onClick={() => setDayPickerOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(340px,82vw)] rounded-2xl border border-line-2 bg-surface-2 p-2 shadow-pop animate-fade-in">
                <DayNav onSelect={() => setDayPickerOpen(false)} />
              </div>
            </>
          )}
        </div>
      </header>

      <WorkoutClockBar dayKey={state.day} />

      <p className="mb-4 text-[13px] text-muted-2">
        Log your sets. Tap a lift to swap it, or add your own.
      </p>
      <DeloadBanner />
      <DayView
        onSwap={(index) => setPicker({ kind: 'swap', index })}
        onAdd={() => setPicker({ kind: 'add' })}
        onOpenExercise={onOpenExercise}
                onOpenSession={onOpenSession}
      />

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>

      <RestTimerBar />

      <ExercisePicker request={pickerRequest()} onPick={handlePick} onClose={() => setPicker(null)} />
    </div>
  );
}

/** Explains where the week number comes from, and lets the lifter set it. */
function WeekSheet({
  prog,
  volume,
  days,
  onSet,
  onAuto,
  onClose,
}: {
  prog: RotationProgress;
  volume: MuscleVolume[];
  days: { key: string; label: string }[];
  onSet: (week: number) => void;
  onAuto: () => void;
  onClose: () => void;
}) {
  const done = new Set(prog.doneThisWeek);
  const left = days.length - done.size;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Training week"
        className="w-full rounded-t-3xl border-t border-line bg-surface px-5 pb-6 pt-4 animate-sheet-up sm:max-w-[480px] sm:rounded-3xl sm:border"
      >
        <div className="font-display text-[20px] font-black uppercase">
          Week {prog.weekInBlock} <span className="text-muted-2">of {prog.cycleWeeks}</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          A week is done once you've trained every day of the program — the next workout starts the next week, however
          long it took.{' '}
          {left > 0 ? `${left} to go this week.` : ''}
          {prog.source === 'manual' && ' You set the week number by hand.'}
        </p>

        <ul className="mt-3 flex flex-col gap-1.5">
          {days.map((d) => {
            const on = done.has(d.key);
            return (
              <li key={d.key} className="flex items-center gap-2.5 text-[14px]">
                <span
                  className={[
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                    on ? 'bg-green text-bg' : 'border border-line-2 text-transparent',
                  ].join(' ')}
                  aria-hidden
                >
                  ✓
                </span>
                <span className={on ? 'text-muted line-through' : 'text-ink'}>{d.label}</span>
              </li>
            );
          })}
        </ul>

        {volume.length > 0 && (
          <>
            <div className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">Sets per muscle · this week vs plan</div>
            <ul className="flex flex-col gap-1.5">
              {volume.map((m) => {
                const pct = m.target ? Math.min(100, Math.round((m.done / m.target) * 100)) : 100;
                return (
                  <li key={m.muscle} className="flex items-center gap-2 text-[12px]">
                    <span className="w-[68px] shrink-0 font-semibold text-muted">{m.muscle}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className={`block h-full rounded-full ${m.done >= m.target ? 'bg-green' : 'bg-secondary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-12 text-right font-mono tabular-nums text-ink">
                      {m.done}/{m.target}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {prog.history.length > 0 && (
          <>
            <div className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">How long each week took</div>
            <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {[...prog.history].reverse().map((w) => {
                // a full week in ~7 days is on track; much longer means time off
                const tone = w.days > 14 ? 'text-red' : w.days > 9 ? 'text-orange' : 'text-green';
                return (
                  <li key={w.week} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[12px]">
                    <span className="w-14 font-mono font-bold text-ink">Wk {((w.week - 1) % prog.cycleWeeks) + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {shortDate(w.start)} → {w.end ? shortDate(w.end) : 'now'}
                    </span>
                    {w.longestGap >= 7 && <span className="font-mono text-[11px] text-red">{w.longestGap}d gap</span>}
                    <span className={`font-mono font-bold tabular-nums ${w.end ? tone : 'text-muted-2'}`}>
                      {w.days}d{w.end ? '' : '…'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">Set the current week</div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: prog.cycleWeeks }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onSet(w)}
              aria-pressed={w === prog.weekInBlock}
              className={[
                'h-10 w-10 rounded-xl border font-mono text-[14px] font-bold',
                w === prog.weekInBlock ? 'border-accent bg-accent/10 text-accent' : 'border-line-2 bg-surface-2 text-ink',
              ].join(' ')}
            >
              {w}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-2">Changes the number only — days already done this week stay ticked.</p>

        <div className="mt-5 flex gap-2">
          {prog.source === 'manual' && (
            <button type="button" onClick={onAuto} className="flex-1 rounded-xl border border-line-2 py-2.5 text-[13px] font-semibold text-muted">
              Back to automatic
            </button>
          )}
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-secondary/15 py-2.5 text-[13px] font-bold text-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

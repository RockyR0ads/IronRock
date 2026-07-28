import { useMemo, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { liftById } from '../../state/store';
import { e1rmFor } from '../../state/selectors';
import { newSessionId } from '../../domain/session';
import {
  W531_DAYS,
  W531_LIFTS,
  mainSets,
  warmupSets531,
  bbbSets,
  cycleWeek,
  WAVE_LABEL,
  CYCLE_WEEKS,
  tmFromOneRm,
  type W531Set,
} from '../../domain/wendler531';
import type { LoggedSet, Session } from '../../domain/types';
import { ChevronLeft, ChevronRight, CheckIcon } from '../common/icons';

/**
 * The 5/3/1 (Boring But Big) runner. Training Maxes come straight from the
 * Reference lifts (TM ≈ 90% of the estimated 1RM), so there's one place to keep
 * your maxes; the wave and BBB volume are computed from those.
 */
export function Wendler531({
  onBack,
  onOpenExercise,
  onOpenReference,
}: {
  onBack: () => void;
  onOpenExercise?: (liftId: string) => void;
  onOpenReference: () => void;
}) {
  const { state, dispatch } = useStore();
  const inc = state.inc;

  /** Training Max for a lift: 90% of its reference-set 1RM, or 0 if unset. */
  const tmFor = (liftId: string) => {
    const e = e1rmFor(state, liftId);
    return e === null ? 0 : tmFromOneRm(e, inc);
  };
  const missing = W531_LIFTS.filter((id) => tmFor(id) <= 0);

  const [dayIdx, setDayIdx] = useState(0);
  const day = W531_DAYS[dayIdx];
  const week = cycleWeek(state.programStart);
  const tm = tmFor(day.lift);

  const main = useMemo(() => mainSets(tm, week, inc), [tm, week, inc]);
  const warm = useMemo(() => warmupSets531(tm, inc), [tm, inc]);
  const bbb = useMemo(() => bbbSets(tm, inc), [tm, inc]);

  // ephemeral per-session logging (a workout is done in one sitting)
  const [mainDone, setMainDone] = useState<boolean[]>([false, false, false]);
  const [amrap, setAmrap] = useState('');
  const [bbbDone, setBbbDone] = useState(false);

  // reset the log when the day or week changes
  const dayKey = `${day.key}-${week}`;
  const [loggedFor, setLoggedFor] = useState(dayKey);
  if (loggedFor !== dayKey) {
    setLoggedFor(dayKey);
    setMainDone([false, false, false]);
    setAmrap('');
    setBbbDone(false);
  }

  function complete() {
    const liftName = liftById(state, day.lift).name;
    const sets: LoggedSet[] = [];
    main.forEach((s, i) => {
      if (!mainDone[i]) return;
      const reps = s.amrap ? amrap || String(s.reps) : String(s.reps);
      sets.push({ w: String(s.weight), reps, rpe: '', done: true });
    });
    if (bbbDone) bbb.forEach((s) => sets.push({ w: String(s.weight), reps: String(s.reps), rpe: '', done: true }));
    if (sets.length === 0) return;

    const session: Session = {
      id: newSessionId(),
      at: new Date().toISOString(),
      dayKey: day.key,
      title: `5/3/1 · ${day.label}`,
      exercises: [{ liftId: day.lift, name: liftName, sets }],
    };
    dispatch({ type: 'archiveSession', session });
    setDayIdx((i) => (i + 1) % W531_DAYS.length);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back home"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            5 / 3 / 1
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Boring But Big
          </div>
        </div>
      </header>

      {missing.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 p-5 text-center">
          <div className="font-display text-[16px] font-bold tracking-[-0.01em]">
            Set your maxes first
          </div>
          <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-muted-2">
            5/3/1 loads are a percentage of each lift's Training Max (90% of your 1RM). Add a
            reference set for {listNames(state, missing)} on the Reference lifts page and every
            workout fills in automatically.
          </p>
          <button
            type="button"
            onClick={onOpenReference}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.98]"
          >
            Set reference lifts
          </button>
        </div>
      ) : (
        <>
          {/* cycle week banner */}
          <div className="mt-4 rounded-2xl border border-accent/40 bg-surface px-4 py-3 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              Cycle week {week} of {CYCLE_WEEKS}
            </div>
            <div className="mt-0.5 font-display text-[18px] font-black uppercase tracking-[-0.01em]">
              {WAVE_LABEL[week]}
            </div>
          </div>

          {/* day switcher */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {W531_DAYS.map((d, i) => {
              const on = i === dayIdx;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDayIdx(i)}
                  className={[
                    'rounded-lg border py-2 font-display text-[13px] font-bold tracking-[-0.01em] transition-colors',
                    on
                      ? 'border-accent bg-accent text-bg'
                      : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
                  ].join(' ')}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* main lift */}
          <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenExercise?.(day.lift)}
                className="group flex items-center gap-1.5"
              >
                <span className="font-display text-[16px] font-black uppercase tracking-[-0.01em] transition-colors group-hover:text-accent">
                  {liftById(state, day.lift).name}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-2 transition-colors group-hover:text-accent" />
              </button>
              <span className="font-mono text-[11px] text-muted-2">TM {tm} kg</span>
            </div>

            <div className="mt-1 font-mono text-[11px] text-muted-2">
              Warm-up · {warm.map((s) => `${s.weight}×${s.reps}`).join('  ·  ')}
            </div>

            <div className="mt-3 space-y-1.5">
              {main.map((s, i) => (
                <SetRow
                  key={i}
                  n={i + 1}
                  set={s}
                  done={mainDone[i]}
                  onToggle={() => setMainDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                  amrap={amrap}
                  onAmrap={setAmrap}
                />
              ))}
            </div>
          </div>

          {/* BBB supplemental */}
          <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-[14px] font-bold tracking-[-0.01em]">
                  Boring But Big
                </div>
                <div className="mt-0.5 font-mono text-[13px] tabular-nums text-muted">
                  5 × 10 <span className="text-muted-2">@</span> {bbb[0].weight} kg
                </div>
              </div>
              <DoneButton done={bbbDone} onToggle={() => setBbbDone((v) => !v)} />
            </div>
          </div>

          {/* accessory */}
          <div className="mt-3 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
              Assistance
            </div>
            <div className="mt-0.5 text-[13px] text-muted">{day.accessory}</div>
          </div>

          <button
            type="button"
            onClick={complete}
            disabled={!mainDone.some(Boolean)}
            className={[
              'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-[15px] font-black uppercase tracking-[-0.01em] transition-transform active:scale-[0.99]',
              mainDone.some(Boolean)
                ? 'bg-green text-bg shadow-glow'
                : 'border border-line-2 bg-surface text-muted-2',
            ].join(' ')}
          >
            <CheckIcon className="h-4 w-4" /> Complete {day.label}
          </button>

          <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-2">
            Training Maxes come from your Reference lifts. To progress, bump the reference set as you
            get stronger.
          </p>
        </>
      )}
    </div>
  );
}

function listNames(state: ReturnType<typeof useStore>['state'], ids: string[]): string {
  const names = ids.map((id) => liftById(state, id).name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/* --------------------------------------------------------------- set rows */

function DoneButton({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={done ? 'Done, tap to undo' : 'Mark done'}
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
        done
          ? 'border-green bg-green text-bg'
          : 'border-line-2 bg-surface-2 text-muted-2 hover:bg-surface-3 hover:text-ink',
      ].join(' ')}
    >
      <CheckIcon className={`h-4 w-4 ${done ? '' : 'opacity-40'}`} />
    </button>
  );
}

function SetRow({
  n,
  set,
  done,
  onToggle,
  amrap,
  onAmrap,
}: {
  n: number;
  set: W531Set;
  done: boolean;
  onToggle: () => void;
  amrap: string;
  onAmrap: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-5 shrink-0 text-center font-mono text-[12px] font-bold text-muted-2">{n}</span>
      <span className="flex-1 font-mono text-[15px] font-bold tabular-nums">
        {set.weight} <span className="text-[11px] font-normal text-muted-2">kg</span>
        <span className="mx-1.5 text-muted-2">×</span>
        {set.reps}
        {set.amrap && <span className="text-accent">+</span>}
      </span>
      {set.amrap && (
        <input
          type="number"
          inputMode="numeric"
          value={amrap}
          onChange={(e) => onAmrap(e.target.value)}
          placeholder={`${set.reps}+`}
          aria-label="AMRAP reps achieved"
          className="h-9 w-16 rounded-lg border border-line-2 bg-surface-2 text-center font-mono text-[15px] font-bold text-ink placeholder:font-normal placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
      )}
      <DoneButton done={done} onToggle={onToggle} />
    </div>
  );
}

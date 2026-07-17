import { useState } from 'react';
import { useStore } from '../state/StoreContext';
import { workoutStats, volumeParts } from '../domain/stats';
import { sessionEntries, sessionDayLabel, sessionTimeLabel } from '../domain/session';
import { rpeHue } from '../domain/format';
import { ChevronLeft, ChevronRight, Dumbbell, TrashIcon } from './common/icons';
import type { Session } from '../domain/types';

/** Compact totals line shared by the list row and the detail header. */
function Totals({ session }: { session: Session }) {
  const { state } = useStore();
  const stats = workoutStats(sessionEntries(session), state.inc);
  const vol = volumeParts(stats.volume);
  return (
    <span className="font-mono text-[11px] text-muted-2">
      {stats.exercises.length} lifts · {stats.sets} sets ·{' '}
      <span className="text-accent">{vol.value}</span> {vol.unit}
    </span>
  );
}

function SessionDetail({ session, onBack }: { session: Session; onBack: () => void }) {
  const { state, dispatch } = useStore();
  const stats = workoutStats(sessionEntries(session), state.inc);

  return (
    <div>
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to history"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            {session.title}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {sessionDayLabel(session.at)} · {sessionTimeLabel(session.at)}
          </div>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { value: String(stats.exercises.length), unit: undefined, label: 'Lifts' },
          { value: String(stats.sets), unit: undefined, label: 'Sets' },
          { value: String(stats.reps), unit: undefined, label: 'Reps' },
          { ...volumeParts(stats.volume), label: 'Volume' },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-line bg-surface-2 px-2 py-3 text-center">
            <div className="whitespace-nowrap font-display text-[19px] font-black tabular-nums leading-none text-accent">
              {t.value}
              {t.unit && <span className="ml-0.5 text-[11px] text-muted-2">{t.unit}</span>}
            </div>
            <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-2">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {session.exercises.map((ex, i) => (
          <div key={`${ex.liftId}-${i}`} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="font-display text-[15px] font-bold tracking-[-0.01em]">{ex.name}</div>
            <div className="mt-2.5 space-y-1.5">
              {ex.sets.map((set, si) => {
                const rpe = parseFloat(set.rpe);
                return (
                  <div
                    key={si}
                    className="grid grid-cols-[1.6rem_1fr_1fr_3.5rem] items-center gap-2 font-mono text-[13px]"
                  >
                    <span className="text-muted-2">{si + 1}</span>
                    <span className="tabular-nums">
                      {set.w || '–'} <span className="text-[10px] text-muted-2">kg</span>
                    </span>
                    <span className="tabular-nums">
                      {set.reps || '–'} <span className="text-[10px] text-muted-2">reps</span>
                    </span>
                    {rpe > 0 ? (
                      <span
                        className="rounded-md border px-1 py-0.5 text-center text-[12px] font-bold tabular-nums"
                        style={{
                          backgroundColor: `hsl(${rpeHue(rpe)} 65% 45% / 0.22)`,
                          borderColor: `hsl(${rpeHue(rpe)} 65% 55% / 0.55)`,
                          color: `hsl(${rpeHue(rpe)} 85% 75%)`,
                        }}
                      >
                        {set.rpe}
                      </span>
                    ) : (
                      <span className="text-center text-muted-2">–</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm('Delete this workout from your history? This cannot be undone.')) {
            dispatch({ type: 'removeSession', id: session.id });
            onBack();
          }
        }}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-3 font-display text-[14px] font-bold text-red transition-colors hover:bg-red/10"
      >
        <TrashIcon className="h-4 w-4" /> Delete workout
      </button>
    </div>
  );
}

/**
 * Archived workouts, newest first. Sessions land here when a workout is
 * completed on the program day or the freestyle page.
 */
export function WorkoutHistory({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const session = state.sessions.find((s) => s.id === openId) ?? null;

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      {session ? (
        <SessionDetail session={session} onBack={() => setOpenId(null)} />
      ) : (
        <>
          <header className="flex items-center gap-3 pb-2 pt-6">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to the week"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 leading-none">
              <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
                History
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
                {state.sessions.length} workout{state.sessions.length === 1 ? '' : 's'} logged
              </div>
            </div>
          </header>

          {state.sessions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Dumbbell className="h-6 w-6" />
              </div>
              <p className="m-0 font-display text-[16px] font-bold">No workouts yet</p>
              <p className="mx-auto mt-1 max-w-[34ch] text-[13px] text-muted-2">
                Finish a session with <strong className="text-muted">Complete workout</strong> and it
                lands here, with everything you lifted.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              {state.sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOpenId(s.id)}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-accent/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate font-display text-[15px] font-bold tracking-[-0.01em]">
                        {s.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                        {sessionDayLabel(s.at)}
                      </span>
                    </span>
                    <span className="mt-1 block">
                      <Totals session={s} />
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

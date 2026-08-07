import type { ReactNode } from 'react';
import { useStore } from '../state/StoreContext';
import { effBlocks, setsFor, liftById, computedInUse } from '../state/store';
import { doneSetCount, e1rmFor } from '../state/selectors';
import { defaultDay } from '../domain/program';
import { sessionDayLabel } from '../domain/session';
import { programMeta } from '../domain/programs';
import { cycleWeek, WAVE_LABEL, CYCLE_WEEKS } from '../domain/wendler531';
import {
  Dumbbell,
  ChevronRight,
  PlusIcon,
  HistoryIcon,
  TrendIcon,
  TrendDownIcon,
  BookIcon,
  BendingBarbell,
  GearIcon,
} from './common/icons';

/** Where a home tile can take you. */
export type HomeDest =
  | 'week'
  | 'freestyle'
  | 'history'
  | 'progress'
  | 'program'
  | 'reference'
  | 'exercises'
  | 'weight'
  | 'settings';

/**
 * The landing hub. Leads with the program's current session, then routes out to
 * freestyle, history, charts, the program reference and reference lifts.
 */
export function Home({ onGo }: { onGo: (dest: HomeDest) => void }) {
  const { state } = useStore();

  const day = defaultDay(state.day);
  const blocks = effBlocks(state, state.day);
  const prescribed = blocks.reduce((n, b) => n + b.sets, 0);
  const done = blocks.reduce((n, _b, i) => n + doneSetCount(setsFor(state, state.day, i)), 0);
  const leadLift = blocks[0] ? liftById(state, blocks[0].lift).name : null;

  const refIds = computedInUse(state);
  const refsSet = refIds.filter((id) => e1rmFor(state, id) !== null).length;

  // the hero adapts to the active program (only the PPL cut runs its day engine)
  const prog = programMeta(state.activeProgram);
  const isPpl = state.activeProgram === 'ppl-cut';
  const is531 = state.activeProgram === 'wendler-531';
  const week531 = is531 ? cycleWeek(state.programStart) : 0;
  const heroKicker = isPpl ? (done > 0 ? 'Continue training' : "Today's session") : 'Active program';
  const heroLabel = isPpl ? (day?.label ?? 'Train') : (prog?.name ?? 'Train');
  const heroVariant = isPpl ? day?.variant : is531 ? WAVE_LABEL[week531] : undefined;
  const heroSub = isPpl
    ? leadLift
      ? `${leadLift} first`
      : 'Log your working sets'
    : is531
      ? `Cycle week ${week531} of ${CYCLE_WEEKS}`
      : (prog?.tagline ?? '');

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6 sm:pb-16">
      <header className="flex items-center gap-3 pb-2 pt-8">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-bg shadow-glow">
          <Dumbbell className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 leading-none">
          <div className="font-display text-[26px] font-black uppercase tracking-[-0.01em]">
            IronRock
          </div>
          <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {prog?.name ?? 'Training'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onGo('settings')}
          aria-label="Settings"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-muted transition-colors hover:border-secondary/50 hover:text-ink"
        >
          <GearIcon className="h-5 w-5" />
        </button>
      </header>

      {/* primary: today's programmed session */}
      <button
        type="button"
        onClick={() => onGo('week')}
        className="relative mt-5 flex w-full items-stretch justify-between gap-3 overflow-hidden rounded-3xl bg-accent p-5 text-left text-bg shadow-glow transition-transform active:scale-[0.99]"
      >
        {/* bending-barbell cutout filling the empty right — solid bg, like the text.
            Sits in the right zone so the plates clear the words; only the thin bar
            reaches back toward the text. */}
        <BendingBarbell className="pointer-events-none absolute -right-4 top-1/2 h-[86px] w-auto -translate-y-1/2 rotate-[-4deg] text-bg" />

        <span className="relative z-10 flex min-w-0 max-w-[56%] flex-col justify-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-bg/70">
            {heroKicker}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-[26px] font-black uppercase leading-none tracking-[-0.01em]">
              {heroLabel}
            </span>
            {heroVariant && (
              <span className="rounded-md bg-bg/25 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
                {heroVariant}
              </span>
            )}
          </span>
          <span className="mt-2 text-[13px] leading-snug text-bg/80">{heroSub}</span>
          {isPpl && prescribed > 0 && (
            <span className="mt-1 font-mono text-[12px] font-medium text-bg/70">
              {done} / {prescribed} sets done
            </span>
          )}
        </span>
      </button>

      <div className="mb-2 mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        Log & review
      </div>
      <div className="flex flex-col gap-2.5">
        <Tile
          icon={<PlusIcon className="h-5 w-5" />}
          title="Freestyle workout"
          sub="Log any session — no program"
          onClick={() => onGo('freestyle')}
        />
        <Tile
          icon={<HistoryIcon className="h-5 w-5" />}
          title="History"
          sub={
            state.sessions.length === 0
              ? 'Completed workouts land here'
              : `${state.sessions.length} workout${state.sessions.length === 1 ? '' : 's'} · last ${sessionDayLabel(state.sessions[0].at).toLowerCase()}`
          }
          onClick={() => onGo('history')}
        />
        <Tile
          icon={<TrendIcon className="h-5 w-5" />}
          title="Exercise charts"
          sub="See a lift trend over time"
          onClick={() => onGo('progress')}
        />
        <Tile
          icon={<GearIcon className="h-5 w-5" />}
          title="Exercises"
          sub="History, records & per-lift settings"
          onClick={() => onGo('exercises')}
        />
        <Tile
          icon={<TrendDownIcon className="h-5 w-5" />}
          title="Weight"
          sub="Track weigh-ins toward a goal"
          onClick={() => onGo('weight')}
        />
      </div>

      <div className="mb-2 mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        Program
      </div>
      <div className="flex flex-col gap-2.5">
        <Tile
          icon={<BookIcon className="h-5 w-5" />}
          title="The program"
          sub="Choose your plan · rules & the split"
          onClick={() => onGo('program')}
        />
        <Tile
          icon={<Dumbbell className="h-5 w-5" />}
          title="Reference lifts"
          sub={`${refsSet} of ${refIds.length} set · drives your targets`}
          onClick={() => onGo('reference')}
        />
      </div>

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>
    </div>
  );
}

function Tile({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-secondary/50"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[15px] font-bold tracking-[-0.01em]">{title}</span>
          <span className="text-[12px] text-muted-2">{sub}</span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
    </button>
  );
}

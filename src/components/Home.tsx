import type { ReactNode } from 'react';
import { useStore } from '../state/StoreContext';
import { effBlocks, setsFor, liftById, computedInUse } from '../state/store';
import { doneSetCount, e1rmFor, currentBodyweight } from '../state/selectors';
import { programCycle, rotationProgress } from '../domain/programTracker';
import { defaultDay, daysForProgram, PROGRAM_DAYS, CUSTOM_PROGRAM_ID } from '../domain/program';
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
  StretchIcon,
  TrophyIcon,
} from './common/icons';
import { PlateMark } from './common/BrandLogo';

/** Where a home tile can take you. */
export type HomeDest =
  | 'week'
  | 'freestyle'
  | 'history'
  | 'progress'
  | 'overview'
  | 'program'
  | 'reference'
  | 'exercises'
  | 'weight'
  | 'stretch'
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
  // runs the day engine (PPL, U/L+Arms, and the user's custom routine)
  const isDayProgram = !!PROGRAM_DAYS[state.activeProgram] || state.activeProgram === CUSTOM_PROGRAM_ID;
  const is531 = state.activeProgram === 'wendler-531';
  const week531 = is531 ? cycleWeek(state.programStart) : 0;
  const heroKicker = isDayProgram ? (done > 0 ? 'Continue training' : "Today's session") : 'Active program';
  const heroLabel = isDayProgram ? (day?.label ?? 'Train') : (prog?.name ?? 'Train');
  const heroVariant = isDayProgram ? day?.variant : is531 ? WAVE_LABEL[week531] : undefined;
  const heroSub = isDayProgram
    ? leadLift
      ? `${leadLift} first`
      : 'Log your working sets'
    : is531
      ? `Cycle week ${week531} of ${CYCLE_WEEKS}`
      : (prog?.tagline ?? '');

  // where the week stands: days of the rotation ticked off
  const rotation = isDayProgram
    ? rotationProgress(state.sessions, programCycle(state.activeProgram), {
        programStart: state.programStart,
        lastDeload: state.lastDeload,
        weekSet: state.weekSet,
      })
    : null;
  const weekDays = isDayProgram ? daysForProgram(state.activeProgram) : [];

  // at-a-glance numbers for the tiles
  const last = state.sessions[0];
  const daysSince = last ? Math.floor((Date.now() - Date.parse(last.at)) / 864e5) : null;
  const weekAgo = Date.now() - 7 * 864e5;
  const last7 = state.sessions.filter((x) => Date.parse(x.at) >= weekAgo).length;
  const bw = currentBodyweight(state);
  const goal = parseFloat(state.weightGoal?.target ?? '') || 0;

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6 sm:pb-16">
      <header className="flex items-center gap-3 pb-2 pt-8">
        <PlateMark size={48} className="shrink-0 drop-shadow-[0_4px_14px_rgba(255,82,71,0.35)]" />
        <div className="min-w-0 flex-1 leading-none">
          <div className="font-display text-[26px] font-black uppercase leading-none tracking-[-0.01em]">
            <span className="text-ink">Iron</span>
            <span className="brand-rock">Rock</span>
          </div>
          <div className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
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
          {isDayProgram && prescribed > 0 && (
            <span className="mt-1 font-mono text-[12px] font-medium text-bg/70">
              {done} / {prescribed} sets done
            </span>
          )}
          {rotation && weekDays.length > 0 && (
            <span className="mt-3 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-bg/80">
                {rotation.isDeload ? 'Deload' : `Week ${rotation.weekInBlock}/${rotation.cycleWeeks}`}
              </span>
              <span className="flex gap-1" aria-label={`${rotation.doneThisWeek.length} of ${weekDays.length} days done this week`}>
                {weekDays.map((d) => (
                  <span
                    key={d.key}
                    className={[
                      'h-2 w-5 rounded-full',
                      rotation.doneThisWeek.includes(d.key) ? 'bg-bg' : d.key === state.day ? 'bg-bg/50' : 'bg-bg/20',
                    ].join(' ')}
                  />
                ))}
              </span>
            </span>
          )}
        </span>
      </button>

      {/* at a glance */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat value={String(last7)} label="Last 7 days" />
        <Stat value={daysSince === null ? '—' : daysSince === 0 ? 'Today' : `${daysSince}d`} label="Since last" />
        <Stat value={state.sessions.length.toLocaleString()} label="Workouts" />
      </div>

      <button
        type="button"
        onClick={() => onGo('freestyle')}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-2 bg-surface/50 px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-accent/5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <PlusIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-bold tracking-[-0.01em]">Freestyle workout</span>
          <span className="text-[12px] text-muted-2">Log any session — no program</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
      </button>

      <SectionLabel>Log & review</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <GridTile
          tone="blue"
          icon={<HistoryIcon className="h-5 w-5" />}
          title="History"
          value={state.sessions.length ? state.sessions.length.toLocaleString() : undefined}
          sub={last ? `Last: ${sessionDayLabel(last.at)}` : 'Workouts land here'}
          onClick={() => onGo('history')}
        />
        <GridTile
          tone="green"
          icon={<TrendIcon className="h-5 w-5" />}
          title="Charts"
          sub="Every lift over time"
          onClick={() => onGo('progress')}
        />
        <GridTile
          tone="yellow"
          icon={<TrophyIcon className="h-5 w-5" />}
          title="Overview"
          sub="Volume, frequency & PRs"
          onClick={() => onGo('overview')}
        />
        <GridTile
          tone="secondary"
          icon={<Dumbbell className="h-5 w-5" />}
          title="Exercises"
          sub="Records & per-lift settings"
          onClick={() => onGo('exercises')}
        />
        <GridTile
          tone="orange"
          icon={<TrendDownIcon className="h-5 w-5" />}
          title="Weight"
          value={bw ? `${bw} kg` : undefined}
          sub={bw && goal ? `${Math.max(0, Math.round((bw - goal) * 10) / 10)} kg to ${goal}` : 'Track weigh-ins'}
          onClick={() => onGo('weight')}
        />
        <GridTile
          tone="red"
          icon={<StretchIcon className="h-5 w-5" />}
          title="Stretching"
          sub={
            state.stretch.active
              ? 'In progress — resume'
              : state.stretch.sessions.length
                ? `${state.stretch.sessions.length} sessions done`
                : 'Hips & hamstrings'
          }
          onClick={() => onGo('stretch')}
        />
      </div>

      <SectionLabel>Program</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5">
        <GridTile
          tone="accent"
          icon={<BookIcon className="h-5 w-5" />}
          title="The program"
          sub={prog?.name ?? 'Choose your plan'}
          onClick={() => onGo('program')}
        />
        <GridTile
          tone="accent"
          icon={<Dumbbell className="h-5 w-5" />}
          title="Reference lifts"
          value={`${refsSet}/${refIds.length}`}
          sub="Drive your targets"
          onClick={() => onGo('reference')}
        />
      </div>

      <footer className="mt-10 text-center text-[12px] text-muted-2">
        Saved locally · refresh-safe · works offline
      </footer>
    </div>
  );
}

const TONES = {
  blue: 'bg-blue/15 text-blue',
  green: 'bg-green/15 text-green',
  yellow: 'bg-yellow/15 text-yellow',
  orange: 'bg-orange/15 text-orange',
  red: 'bg-red/15 text-red',
  secondary: 'bg-secondary/15 text-secondary',
  accent: 'bg-accent/15 text-accent',
} as const;

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">{children}</div>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2.5 shadow-card">
      <div className="font-display text-[20px] font-black leading-none tabular-nums">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-2">{label}</div>
    </div>
  );
}

/** A colour-coded destination card: tinted icon, title, an optional live number. */
function GridTile({
  tone,
  icon,
  title,
  value,
  sub,
  onClick,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  title: string;
  value?: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[118px] flex-col justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-card transition-colors hover:border-secondary/50 active:scale-[0.99]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>{icon}</span>
        {value && <span className="font-display text-[18px] font-black leading-none tabular-nums">{value}</span>}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[15px] font-bold tracking-[-0.01em]">{title}</span>
        <span className="line-clamp-2 block text-[12px] leading-snug text-muted-2">{sub}</span>
      </span>
    </button>
  );
}

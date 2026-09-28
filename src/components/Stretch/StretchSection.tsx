import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import {
  STRETCH_TEMPLATES,
  buildSteps,
  stretchWeek,
  recommendedSession,
  sessionSeconds,
  type StretchSessionType,
} from '../../domain/stretchProgram';
import { AREA_LABEL } from '../../domain/stretches';
import { FLEX_METRICS, latestBenchmark, type FlexMetric } from '../../domain/stretchSession';
import { sessionDayLabel } from '../../domain/session';
import { ChevronLeft, ChevronRight, PlusIcon } from '../common/icons';
import { StretchPlayer } from './StretchPlayer';
import { FlexCheck } from './FlexCheck';

const mins = (s: number) => `${Math.round(s / 60)} min`;
const FLEX_LIST: FlexMetric[] = ['hamstring', 'hipflexor'];

/** The Stretching programmer: session launcher, guided player, flexibility tracking, history. */
export function StretchSection({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const st = state.stretch;
  const [view, setView] = useState<'home' | 'player'>('home');
  const [flexOpen, setFlexOpen] = useState(false);

  if (view === 'player') return <StretchPlayer onExit={() => setView('home')} />;

  const week = stretchWeek(st.programStart);
  const lastDeep = st.sessions.find((s) => s.type === 'deep')?.at;
  const recommended = recommendedSession(lastDeep);

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back home"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-secondary/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Stretching
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Week {week} · undoing desk tightness
          </div>
        </div>
      </header>

      {st.active && (
        <button
          type="button"
          onClick={() => setView('player')}
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-secondary/50 bg-secondary/10 p-4 text-left transition-transform active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block font-display text-[15px] font-bold text-secondary">Resume session</span>
            <span className="text-[12px] text-muted-2">
              {STRETCH_TEMPLATES[st.active.type].label} · hold {st.active.step + 1} of {st.active.total}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-secondary" />
        </button>
      )}

      {/* session launchers */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(Object.keys(STRETCH_TEMPLATES) as StretchSessionType[]).map((type) => (
          <SessionCard
            key={type}
            type={type}
            week={week}
            recommended={type === recommended && !st.active}
            onStart={() => setView('player')}
          />
        ))}
      </div>

      {/* flexibility tracking */}
      <div className="mb-2 mt-7 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">Flexibility</span>
        <button
          type="button"
          onClick={() => setFlexOpen(true)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-secondary hover:bg-secondary/10"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Log a check
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FLEX_LIST.map((m) => (
          <BenchmarkCard key={m} metric={m} />
        ))}
      </div>

      {/* history */}
      {st.sessions.length > 0 && (
        <>
          <div className="mb-2 mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Recent sessions
          </div>
          <div className="flex flex-col gap-2">
            {st.sessions.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card"
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-[14px] font-bold tracking-[-0.01em]">
                      {STRETCH_TEMPLATES[s.type].label}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                      {sessionDayLabel(s.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted-2">
                    {s.steps} holds · {Math.round(s.holdSec / 60)} min ·{' '}
                    {s.areas.slice(0, 3).map((a) => AREA_LABEL[a]).join(', ')}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {flexOpen && <FlexCheck onClose={() => setFlexOpen(false)} />}
    </div>
  );
}

function SessionCard({
  type,
  week,
  recommended,
  onStart,
}: {
  type: StretchSessionType;
  week: number;
  recommended: boolean;
  onStart: () => void;
}) {
  const { dispatch } = useStore();
  const tmpl = STRETCH_TEMPLATES[type];
  const steps = buildSteps(type, week);

  function start() {
    dispatch({
      type: 'startStretch',
      sessionType: type,
      at: new Date().toISOString(),
      week,
      total: steps.length,
    });
    onStart();
  }

  return (
    <button
      type="button"
      onClick={start}
      className={[
        'relative flex flex-col rounded-2xl border p-4 text-left shadow-card transition-transform active:scale-[0.99]',
        recommended ? 'border-secondary/60 bg-secondary/[0.07]' : 'border-line bg-surface',
      ].join(' ')}
    >
      {recommended && (
        <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-bg">
          Today
        </span>
      )}
      <span className="font-display text-[20px] font-black uppercase tracking-[-0.01em]">{tmpl.label}</span>
      <span className="mt-0.5 font-mono text-[11px] text-muted-2">
        {mins(sessionSeconds(type, week))} · {steps.length} holds
      </span>
      <span className="mt-2 text-[12.5px] leading-snug text-muted">{tmpl.blurb}</span>
      <span className="mt-3 inline-flex items-center gap-1 font-display text-[13px] font-bold text-secondary">
        Start <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function BenchmarkCard({ metric }: { metric: FlexMetric }) {
  const { state } = useStore();
  const meta = FLEX_METRICS[metric];
  const list = state.stretch.benchmarks.filter((b) => b.metric === metric).sort((a, b) => a.at.localeCompare(b.at));
  const latest = latestBenchmark(state.stretch.benchmarks, metric);
  const prev = list.length > 1 ? list[list.length - 2] : undefined;
  const delta = latest && prev ? latest.value - prev.value : null;
  const improved = delta === null ? null : meta.better === 'up' ? delta > 0 : delta < 0;

  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">{meta.label}</span>
      {latest ? (
        <>
          <span className="mt-1 block font-display text-[22px] font-black tabular-nums leading-none">
            {latest.value}
            <span className="ml-1 text-[12px] font-bold text-muted-2">{meta.unit}</span>
          </span>
          {delta !== null && delta !== 0 && (
            <span
              className={[
                'mt-1 inline-block font-mono text-[11px] font-bold',
                improved ? 'text-green' : 'text-accent',
              ].join(' ')}
            >
              {delta > 0 ? '+' : ''}
              {delta} {meta.unit} {improved ? '· looser' : '· tighter'}
            </span>
          )}
        </>
      ) : (
        <span className="mt-1 block text-[12px] text-muted-2">No check yet</span>
      )}
    </div>
  );
}

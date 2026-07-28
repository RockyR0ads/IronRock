import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../../state/StoreContext';
import { liftById } from '../../state/store';
import { exerciseSeries, type ProgressPoint } from '../../domain/progress';
import { sessionDayLabel } from '../../domain/session';
import {
  REST_OPTIONS,
  BAR_TYPES,
  barsFor,
  usesBar,
  fmtRest,
  autoRestOn,
  isBodyweightLoaded,
  WARMUP_RAMPS,
  type ExerciseConfig,
} from '../../domain/exerciseConfig';
import type { Increment, Lift } from '../../domain/types';
import { REST_DEFAULT } from '../../state/RestTimer';
import { LIBRARY_BY_ID } from '../../domain/library';
import { ChevronLeft } from '../common/icons';
import { ExerciseGuide } from '../common/ExerciseGuide';

type Tab = 'about' | 'history' | 'records' | 'settings';

/**
 * The per-exercise page: history of how it's been trained, its personal records,
 * and settings you tune once for the lift (rest, bar type).
 */
export function ExercisePage({ liftId, onBack }: { liftId: string; onBack: () => void }) {
  const { state } = useStore();
  const lift = liftById(state, liftId);
  const guide = lift.lib ? LIBRARY_BY_ID[lift.lib] : undefined;
  const cfg = state.exerciseConfig[liftId];
  // About holds the how-to guide and/or your own tempo & notes — show it if
  // either exists, so the settings that promise to appear here actually can.
  const hasNotes = !!(cfg?.tempo || cfg?.notes);
  const hasAbout = !!guide || hasNotes;
  const [tab, setTab] = useState<Tab>(hasAbout ? 'about' : 'history');
  // bodyweight-loaded lifts can fold bodyweight into the plotted load
  const addWeight =
    cfg?.includeBw && isBodyweightLoaded(lift.unit) ? parseFloat(state.bw) || 0 : 0;
  const series = useMemo(
    () => exerciseSeries(state.sessions, liftId, state.inc, { addWeight }),
    [state.sessions, liftId, state.inc, addWeight]
  );

  const tabs: [Tab, string][] = [
    ...(hasAbout ? ([['about', 'About']] as [Tab, string][]) : []),
    ['history', 'History'],
    ['records', 'Records'],
    ['settings', 'Settings'],
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to exercises"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-accent/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="truncate font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            {lift.name}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {lift.unit || 'exercise'}
          </div>
        </div>
      </header>

      <div className="mt-3 flex gap-6 border-b border-line">
        {tabs.map(([key, label]) => {
          const on = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                '-mb-px border-b-2 pb-2.5 font-display text-[14px] font-bold tracking-[-0.01em] transition-colors',
                on ? 'border-accent text-ink' : 'border-transparent text-muted-2 hover:text-muted',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'about' && (
        <div className="mt-4">
          {hasNotes && (
            <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
              {cfg?.tempo && (
                <div className="font-mono text-[12px] text-muted">
                  <span className="text-muted-2">Tempo</span>{' '}
                  <span className="font-bold text-ink">{cfg.tempo}</span>
                </div>
              )}
              {cfg?.notes && (
                <p className={`m-0 text-[13px] leading-relaxed text-muted ${cfg?.tempo ? 'mt-1.5' : ''}`}>
                  {cfg.notes}
                </p>
              )}
            </div>
          )}
          {guide && <ExerciseGuide ex={guide} />}
        </div>
      )}
      {tab === 'history' && <HistoryTab series={series} />}
      {tab === 'records' && <RecordsTab series={series} />}
      {tab === 'settings' && <SettingsTab lift={lift} />}
    </div>
  );
}

/* ------------------------------------------------------------------ History */

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
      <p className="m-0 font-display text-[16px] font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">{body}</p>
    </div>
  );
}

/** Every logged session for this lift, newest first — the raw numbers. */
function HistoryTab({ series }: { series: ProgressPoint[] }) {
  if (series.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Completed workouts with this lift show up here, newest first."
      />
    );
  }
  const rows = [...series].reverse();
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
        <span>Date</span>
        <span className="text-right">Top set</span>
        <span className="text-right">Est. 1RM</span>
        <span className="text-right">Volume</span>
      </div>
      {rows.map((p) => (
        <div
          key={p.at}
          className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-line/60 px-4 py-3 font-mono text-[13px] last:border-b-0"
        >
          <span className="text-muted">{sessionDayLabel(p.at)}</span>
          <span className="whitespace-nowrap text-right tabular-nums">
            {p.topWeight}
            <span className="text-[10px] text-muted-2">×{p.topReps}</span>
          </span>
          <span className="text-right tabular-nums text-accent">{p.e1rm}</span>
          <span className="text-right tabular-nums text-muted">
            {p.volume}
            <span className="text-[10px] text-muted-2">kg</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Records */

interface Record {
  label: string;
  value: string;
  unit?: string;
  when: string;
}

function computeRecords(series: ProgressPoint[]): Record[] {
  if (series.length === 0) return [];
  let best1rm = series[0];
  let heaviest = series[0];
  let bestVol = series[0];
  let bestReps = series[0];
  let totalVolume = 0;
  for (const p of series) {
    if (p.e1rm > best1rm.e1rm) best1rm = p;
    if (p.topWeight > heaviest.topWeight) heaviest = p;
    if (p.volume > bestVol.volume) bestVol = p;
    if (p.topReps > bestReps.topReps) bestReps = p;
    totalVolume += p.volume;
  }
  return [
    { label: 'Best est. 1RM', value: String(best1rm.e1rm), unit: 'kg', when: best1rm.label },
    {
      label: 'Heaviest set',
      value: `${heaviest.topWeight}×${heaviest.topReps}`,
      when: heaviest.label,
    },
    { label: 'Best session volume', value: String(bestVol.volume), unit: 'kg', when: bestVol.label },
    { label: 'Most reps in a top set', value: String(bestReps.topReps), when: bestReps.label },
    {
      label: 'Lifetime volume',
      value: totalVolume.toLocaleString(),
      unit: 'kg',
      when: `${series.length} session${series.length === 1 ? '' : 's'}`,
    },
  ];
}

function RecordsTab({ series }: { series: ProgressPoint[] }) {
  const records = computeRecords(series);
  if (records.length === 0) {
    return (
      <EmptyState
        title="No records yet"
        body="Log a few sessions with this lift and your personal bests land here."
      />
    );
  }
  return (
    <div className="mt-4 flex flex-col gap-2">
      {records.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card"
        >
          <div className="min-w-0">
            <div className="font-display text-[14px] font-bold tracking-[-0.01em]">{r.label}</div>
            <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
              {r.when}
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap font-display text-[22px] font-black tabular-nums text-accent">
            {r.value}
            {r.unit && <span className="ml-1 text-[12px] text-muted-2">{r.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Settings */

const INCREMENTS: Increment[] = [1, 2.5, 5];

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-1 font-display text-[15px] font-bold tracking-[-0.01em]">{title}</div>
      <p className="mb-3 text-[13px] text-muted-2">{hint}</p>
      {children}
    </section>
  );
}

/** A row of selectable chips. */
function ChipRow<T extends string | number>({
  options,
  value,
  onPick,
  label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onPick: (v: T) => void;
  label?: (o: { key: T; label: string }) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button
            key={String(o.key)}
            type="button"
            onClick={() => onPick(o.key)}
            className={[
              'rounded-xl border px-3.5 py-2 font-mono text-[13px] font-bold tabular-nums transition-colors',
              on ? 'border-accent bg-accent text-bg' : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
            ].join(' ')}
          >
            {label ? label(o) : o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A labelled on/off switch row. */
function ToggleRow({
  title,
  hint,
  on,
  onToggle,
}: {
  title: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block font-display text-[15px] font-bold tracking-[-0.01em]">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted-2">{hint}</span>
      </span>
      <span
        className={[
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-accent' : 'bg-line-2',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all',
            on ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

function SettingsTab({ lift }: { lift: Lift }) {
  const { state, dispatch } = useStore();
  const liftId = lift.id;
  const config: ExerciseConfig = state.exerciseConfig[liftId] ?? {};
  const set = (patch: Partial<ExerciseConfig>) =>
    dispatch({ type: 'setExerciseConfig', id: liftId, patch });

  const bars = barsFor(lift.cats);
  const barbell = usesBar(lift.unit) && bars.length > 1;
  const rampId = config.warmupRamp ?? '';

  return (
    <div className="mt-5 flex flex-col gap-7">
      <Section title="Rest between sets" hint="The countdown that starts when you check off a set of this lift.">
        <ChipRow
          options={REST_OPTIONS.map((s) => ({ key: s, label: fmtRest(s) }))}
          value={config.restSeconds ?? REST_DEFAULT}
          onPick={(restSeconds) => set({ restSeconds })}
        />
      </Section>

      <ToggleRow
        title="Auto-start rest"
        hint="Start the rest timer automatically when a set is checked off."
        on={autoRestOn(config)}
        onToggle={() => set({ autoRest: !autoRestOn(config) })}
      />

      <Section title="Loading increment" hint="Round this lift's target load to this step — smaller for upper-body, bigger for the main lifts.">
        <ChipRow
          options={INCREMENTS.map((i) => ({ key: i, label: `${i} kg` }))}
          value={config.inc ?? state.inc}
          onPick={(inc) => set({ inc })}
        />
      </Section>

      {barbell && (
        <Section title="Bar type" hint="The empty-bar weight used when the plate math shows your loaded bar.">
          <div className="flex flex-col gap-2">
            {bars.map((bar) => {
              const on = (config.barType ?? BAR_TYPES[0].id) === bar.id;
              return (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => set({ barType: bar.id })}
                  className={[
                    'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                    on ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:border-accent/50',
                  ].join(' ')}
                >
                  <span className="font-display text-[14px] font-bold tracking-[-0.01em]">{bar.label}</span>
                  <span
                    className={[
                      'font-mono text-[13px] font-bold tabular-nums',
                      on ? 'text-accent' : 'text-muted-2',
                    ].join(' ')}
                  >
                    {bar.weight} kg
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Warm-up ramp" hint="Fill your warm-up sets in one tap, ramping up to the working weight.">
        <ChipRow
          options={[{ key: '', label: 'Off' }, ...WARMUP_RAMPS.map((r) => ({ key: r.id, label: r.label }))]}
          value={rampId}
          onPick={(id) => set({ warmupRamp: id || undefined })}
        />
      </Section>

      {isBodyweightLoaded(lift.unit) && (
        <ToggleRow
          title="Count bodyweight"
          hint="Add your bodyweight to the load in charts and records (e.g. a +20 kg pull-up)."
          on={!!config.includeBw}
          onToggle={() => set({ includeBw: !config.includeBw })}
        />
      )}

      {lift.uni && (
        <ToggleRow
          title="Log per side by default"
          hint="Start new sets of this single-leg lift with separate left / right reps."
          on={!!config.perSideDefault}
          onToggle={() => set({ perSideDefault: !config.perSideDefault })}
        />
      )}

      <Section title="Tempo" hint="A lifting-speed cue, e.g. 3-1-1 or “paused”. Shown on the About tab.">
        <input
          type="text"
          value={config.tempo ?? ''}
          onChange={(e) => set({ tempo: e.target.value || undefined })}
          placeholder="e.g. 3-1-1"
          className="w-full rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2.5 font-mono text-[14px] text-ink placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
      </Section>

      <Section title="Notes & cues" hint="Your own reminders, shown under the stock instructions on the About tab.">
        <textarea
          value={config.notes ?? ''}
          onChange={(e) => set({ notes: e.target.value || undefined })}
          placeholder="e.g. tuck elbows, drive with legs, pause on chest"
          rows={3}
          className="w-full resize-y rounded-xl border border-line-2 bg-surface-2 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
      </Section>
    </div>
  );
}

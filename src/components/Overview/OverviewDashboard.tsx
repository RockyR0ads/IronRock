import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { buildOverview } from '../../domain/overview';
import type { MuscleGroup } from '../../domain/library';
import { ChevronLeft } from '../common/icons';
import { InteractiveBarChart, InteractiveLineChart } from '../ExerciseProgress/charts';
import { C } from '../ExerciseProgress/charts/chartUtils';
import { sessionDayLabel } from '../../domain/session';
import { fmtDuration } from '../../domain/workoutTiming';
import { RANGES, rangeFor } from '../ExerciseProgress/ranges';

const GROUP_COLOR: Record<MuscleGroup, string> = {
  Chest: C.accent,
  Back: C.blue,
  Legs: C.green,
  Shoulders: C.yellow,
  Arms: '#B78BF0',
  Core: '#4CC9D6',
  Other: C.muted2,
};

export function OverviewDashboard({ onBack }: { onBack: () => void }) {
  const { state } = useStore();
  const [rangeKey, setRangeKey] = useState('6m');
  const range = rangeFor(rangeKey);
  const ov = buildOverview(state.sessions, {
    days: range.days,
    customGroups: Object.fromEntries(
      Object.entries(state.customLifts).map(([id, c]) => [id, c.group])
    ),
    weighIns: state.weighIns,
  });

  const windowVolume = ov.buckets.reduce((a, b) => a + b.volume, 0);
  const maxGroup = Math.max(1, ...ov.byGroup.map((g) => g.sets));
  const totalGroupSets = ov.byGroup.reduce((a, g) => a + g.sets, 0) || 1;
  const periodWord = ov.granularity === 'week' ? 'week' : 'month';

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] px-4 pb-20 pt-safe sm:px-6">
      <header className="flex items-center gap-3 pb-2 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-colors hover:border-secondary/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-none">
          <div className="font-display text-[22px] font-black uppercase tracking-[-0.01em]">
            Overview
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {ov.totalWorkouts} workouts all-time
          </div>
        </div>
      </header>

      {ov.totalWorkouts === 0 ? (
        <EmptyCard
          title="Nothing to summarise yet"
          body="Log or import some workouts and your training trends build here."
        />
      ) : (
        <>
          {/* range toggle */}
          <div className="mt-3 flex gap-1.5">
            {RANGES.map((r) => {
              const on = r.key === rangeKey;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRangeKey(r.key)}
                  className={[
                    'flex-1 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-bold tracking-[0.04em] transition-colors',
                    on
                      ? 'border-secondary/60 bg-secondary/10 text-ink'
                      : 'border-line bg-surface text-muted-2 hover:text-muted',
                  ].join(' ')}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* frequency headline */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat value={String(ov.streakWeeks)} label="Week streak" tone={C.green} />
            <Stat value={ov.avgPerWeek.toFixed(1)} label="Per week" tone={C.ink} />
            <Stat value={String(ov.windowWorkouts)} label="In range" tone={C.muted} />
          </div>

          {/* volume per period */}
          <Card
            title={`Volume per ${periodWord}`}
            right={`${windowVolume.toLocaleString()}kg total`}
          >
            <InteractiveBarChart
              points={ov.buckets.map((b) => ({
                label: b.label,
                value: b.volume,
                sub: `${b.workouts} workout${b.workouts === 1 ? '' : 's'}`,
              }))}
              color={C.green}
              unit="kg"
              formatValue={(v) => v.toLocaleString()}
            />
          </Card>

          {/* workouts per period */}
          <Card title={`Workouts per ${periodWord}`}>
            <InteractiveBarChart
              points={ov.buckets.map((b) => ({
                label: b.label,
                value: b.workouts,
                sub: `${b.volume.toLocaleString()}kg`,
              }))}
              color={C.blue}
            />
          </Card>

          {/* session length */}
          {ov.avgDurationSec !== null && (
            <Card title={`Session length per ${periodWord}`} right={`${fmtDuration(ov.avgDurationSec)} avg`}>
              <InteractiveBarChart
                points={ov.buckets.map((b) => ({
                  label: b.label,
                  value: b.timedWorkouts > 0 ? Math.round(b.durationSec / b.timedWorkouts / 60) : 0,
                  sub: b.timedWorkouts > 0 ? `${b.timedWorkouts} timed` : 'no timed workouts',
                }))}
                color={C.yellow}
                unit="m"
              />
            </Card>
          )}

          {/* training pace (density) */}
          {ov.avgDurationSec !== null && (
            <Card title="Volume per minute">
              <InteractiveBarChart
                points={ov.buckets.map((b) => ({
                  label: b.label,
                  value: b.durationSec > 0 ? Math.round(b.timedVolume / (b.durationSec / 60)) : 0,
                  sub: b.timedWorkouts > 0 ? `${b.timedWorkouts} timed` : 'no timed workouts',
                }))}
                color={'#B78BF0'}
                unit="kg/min"
              />
            </Card>
          )}

          {/* sets per muscle group */}
          <Card title="Sets by muscle group">
            {ov.byGroup.length === 0 ? (
              <p className="m-0 py-4 text-center text-[13px] text-muted-2">No counted sets in range.</p>
            ) : (
              <div className="space-y-2.5 pt-1">
                {ov.byGroup
                  .slice()
                  .sort((a, b) => b.sets - a.sets)
                  .map((g) => (
                    <div key={g.group} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 font-display text-[12px] font-bold text-muted">
                        {g.group}
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(g.sets / maxGroup) * 100}%`,
                            backgroundColor: GROUP_COLOR[g.group],
                          }}
                        />
                      </div>
                      <span className="flex w-16 shrink-0 items-baseline justify-end gap-1 font-mono tabular-nums">
                        <span className="text-[12px] text-ink">{g.sets}</span>
                        <span className="text-[10px] text-muted-2">
                          {Math.round((g.sets / totalGroupSets) * 100)}%
                        </span>
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* bodyweight */}
          <Card title="Bodyweight">
            {ov.bodyweight.length >= 2 ? (
              <InteractiveLineChart
                points={ov.bodyweight.map((b) => ({
                  value: b.kg,
                  at: b.at,
                  label: sessionDayLabel(new Date(b.at).toISOString()),
                }))}
                color={C.yellow}
                unit="kg"
              />
            ) : (
              <p className="m-0 py-4 text-center text-[13px] text-muted-2">
                Log at least two weigh-ins in range to see your bodyweight trend.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">{title}</span>
        {right && <span className="font-display text-[12px] font-bold text-muted">{right}</span>}
      </div>
      {children}
    </section>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 px-2 py-3 text-center">
      <div
        className="font-display text-[20px] font-black tabular-nums leading-none"
        style={{ color: tone }}
      >
        {value}
      </div>
      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-2">
        {label}
      </div>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
      <p className="m-0 font-display text-[16px] font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">{body}</p>
    </div>
  );
}

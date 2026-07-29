import { useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { currentBodyweight } from '../../state/selectors';
import { weightProgress, fmtKg } from '../../domain/weightTracker';
import { calorieTarget, deficitForRate } from '../../domain/calories';
import { ChevronLeft, TrashIcon } from '../common/icons';
import { WeightChart } from './WeightChart';

const today = () => new Date().toISOString().slice(0, 10);

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** A goal-vs-actual body-weight tracker: log weigh-ins, set a target, see the line. */
export function WeightTracker({
  onBack,
  onOpenSettings,
}: {
  onBack: () => void;
  onOpenSettings: () => void;
}) {
  const { state, dispatch } = useStore();
  const { weighIns, weightGoal } = state;
  const p = weightProgress(weighIns, weightGoal);
  // required daily deficit → calorie target, once the goal + profile are set;
  // the weight used is the most recent of the Settings figure and the weigh-ins
  const cals = p
    ? calorieTarget(state.profile, currentBodyweight(state), deficitForRate(p.requiredRatePerWeek))
    : null;

  const todaysEntry = weighIns.find((w) => w.at === today());
  const [entry, setEntry] = useState(todaysEntry ? String(todaysEntry.kg) : '');

  const logToday = () => {
    const kg = parseFloat(entry);
    if (kg > 0) dispatch({ type: 'logWeight', at: today(), kg });
  };

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
            Weight
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Track your cut
          </div>
        </div>
      </header>

      {/* log today's weight */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
          Today's weight
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="–"
            aria-label="Today's weight in kg"
            className="h-12 flex-1 rounded-xl border border-line-2 bg-surface-2 text-center font-mono text-[18px] font-bold text-ink placeholder:font-normal placeholder:text-muted-2 focus:border-accent focus:outline-none"
          />
          <span className="font-mono text-[13px] text-muted-2">kg</span>
          <button
            type="button"
            onClick={logToday}
            disabled={!(parseFloat(entry) > 0)}
            className={[
              'rounded-xl px-4 py-3 font-display text-[14px] font-bold transition-transform active:scale-[0.98]',
              parseFloat(entry) > 0 ? 'bg-accent text-bg shadow-glow' : 'bg-surface-2 text-muted-2',
            ].join(' ')}
          >
            {todaysEntry ? 'Update' : 'Log'}
          </button>
        </div>
      </div>

      {/* goal */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="rounded-2xl border border-line bg-surface p-3 shadow-card">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            Target weight
          </span>
          <span className="flex items-baseline gap-1">
            <input
              type="number"
              inputMode="decimal"
              value={weightGoal.target ?? ''}
              onChange={(e) => dispatch({ type: 'setWeightGoal', patch: { target: e.target.value } })}
              placeholder="–"
              aria-label="Target weight in kg"
              className="w-full bg-transparent font-mono text-[18px] font-bold text-ink placeholder:text-muted-2 focus:outline-none"
            />
            <span className="font-mono text-[12px] text-muted-2">kg</span>
          </span>
        </label>
        <label className="rounded-2xl border border-line bg-surface p-3 shadow-card">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            Target date
          </span>
          <input
            type="date"
            value={weightGoal.date ?? ''}
            onChange={(e) => dispatch({ type: 'setWeightGoal', patch: { date: e.target.value } })}
            aria-label="Target date"
            className="w-full bg-transparent font-mono text-[15px] font-bold text-ink [color-scheme:dark] focus:outline-none"
          />
        </label>
      </div>

      {p ? (
        <>
          {/* headline stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Now" value={fmtKg(p.latest.kg)} unit="kg" />
            <Stat label="To go" value={fmtKg(Math.max(0, p.toGo))} unit="kg" tone="accent" />
            <Stat label="Days left" value={String(Math.max(0, p.daysLeft))} />
          </div>

          {/* on-track banner */}
          <div
            className={[
              'mt-3 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3',
              p.onTrack ? 'border-green/40 bg-green/10' : 'border-yellow/40 bg-yellow/10',
            ].join(' ')}
          >
            <div>
              <div
                className={`font-display text-[15px] font-black uppercase tracking-[-0.01em] ${p.onTrack ? 'text-green' : 'text-yellow'}`}
              >
                {p.onTrack ? 'On track' : 'Behind pace'}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-2">
                {p.projectedDate
                  ? `At ${fmtKg(p.actualRatePerWeek)} kg/wk you hit ${p.targetKg} by ${longDate(p.projectedDate)}`
                  : 'Log another weigh-in to project your pace'}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-[18px] font-black tabular-nums">
                {Math.round(p.pctComplete)}%
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-2">done</div>
            </div>
          </div>

          {/* chart */}
          <div className="mt-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
            <WeightChart
              weighIns={weighIns}
              targetKg={p.targetKg}
              targetDate={p.targetDate}
              onTrack={p.onTrack}
            />
            <div className="mt-1 flex items-center justify-center gap-4 font-mono text-[10px] text-muted-2">
              <Legend color="dashed" label="Plan" />
              <Legend color={p.onTrack ? 'green' : 'yellow'} label="You" />
              <Legend color="accent" label="Goal" />
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
            <span className="font-mono text-[12px] text-muted">
              Need <span className="font-bold text-ink">{fmtKg(p.requiredRatePerWeek)} kg/wk</span> from
              here · averaging{' '}
              <span className={`font-bold ${p.actualRatePerWeek >= p.requiredRatePerWeek ? 'text-green' : 'text-yellow'}`}>
                {fmtKg(p.actualRatePerWeek)} kg/wk
              </span>
            </span>
          </div>

          {/* calorie target */}
          {cals ? (
            <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                  Daily calories
                </span>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="font-mono text-[11px] text-muted-2 underline-offset-2 hover:text-ink hover:underline"
                >
                  Edit details
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Maintenance" value={String(cals.maintenance)} />
                <Stat label="Deficit" value={`−${cals.deficit}`} />
                <Stat label="Target" value={String(cals.target)} tone="accent" />
              </div>
              <p className="m-0 mt-3 text-[11px] leading-relaxed text-muted-2">
                Estimate via Mifflin–St Jeor. A steep deficit is hard to hold — adjust the target date
                if the number feels too low, and check with a professional.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-4 py-3 text-left transition-colors hover:border-accent/50"
            >
              <span>
                <span className="block font-display text-[14px] font-bold tracking-[-0.01em]">
                  Get a calorie target
                </span>
                <span className="text-[12px] text-muted-2">
                  Add your height, age, sex & activity in Settings
                </span>
              </span>
              <span className="font-mono text-[18px] text-muted-2">›</span>
            </button>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-8 text-center">
          <p className="m-0 font-display text-[15px] font-bold">Set your goal</p>
          <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">
            Log today's weight and set a target weight and date to see your trajectory.
          </p>
        </div>
      )}

      {/* weigh-in history */}
      {weighIns.length > 0 && (
        <>
          <div className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Weigh-ins
          </div>
          <div className="flex flex-col gap-1.5">
            {[...weighIns]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((w) => (
                <div
                  key={w.at}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5"
                >
                  <span className="font-mono text-[13px] text-muted">{longDate(w.at)}</span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[15px] font-bold tabular-nums">
                      {fmtKg(w.kg)} <span className="text-[11px] font-normal text-muted-2">kg</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'removeWeighIn', at: w.at })}
                      aria-label={`Delete weigh-in ${longDate(w.at)}`}
                      className="text-muted-2 transition-colors hover:text-red"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'accent';
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-2 py-3 text-center shadow-card">
      <div className={`font-display text-[20px] font-black tabular-nums ${tone === 'accent' ? 'text-accent' : 'text-ink'}`}>
        {value}
        {unit && <span className="ml-0.5 text-[11px] text-muted-2">{unit}</span>}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-2">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: 'dashed' | 'green' | 'yellow' | 'accent'; label: string }) {
  const cls =
    color === 'green' ? 'bg-green' : color === 'yellow' ? 'bg-yellow' : color === 'accent' ? 'bg-accent' : '';
  return (
    <span className="flex items-center gap-1.5">
      {color === 'dashed' ? (
        <span className="h-0 w-4 border-t-2 border-dashed border-muted-2" />
      ) : (
        <span className={`h-1.5 w-3 rounded-full ${cls}`} />
      )}
      {label}
    </span>
  );
}

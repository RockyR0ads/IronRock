import type { LiftRecords } from '../../domain/records';
import { REP_CAP } from '../../domain/records';
import { sessionDayLabel } from '../../domain/session';
import { C } from './charts/chartUtils';

/** The Records tab: all-time PRs plus a rep-max table for one lift. */
export function RecordsTab({ records, unit }: { records: LiftRecords; unit: string }) {
  const { bestE1rm, heaviest, bestVolume, repMaxes } = records;

  if (!bestE1rm) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-line-2 bg-surface/40 px-6 py-12 text-center">
        <p className="m-0 font-display text-[16px] font-bold">No records yet</p>
        <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-muted-2">
          Log a working set with this lift and your PRs start tracking here.
        </p>
      </div>
    );
  }

  const u = unit || '';
  const headline = [
    {
      label: 'Best est. 1RM',
      value: `${bestE1rm.value}${u}`,
      sub: `${bestE1rm.weight}${u} × ${bestE1rm.reps} · ${sessionDayLabel(bestE1rm.at)}`,
      tone: C.accent,
    },
    heaviest && {
      label: 'Heaviest set',
      value: `${heaviest.weight}${u}`,
      sub: `× ${heaviest.reps} · ${sessionDayLabel(heaviest.at)}`,
      tone: C.blue,
    },
    bestVolume && {
      label: 'Best session volume',
      value: `${bestVolume.volume}${u}`,
      sub: sessionDayLabel(bestVolume.at),
      tone: C.green,
    },
  ].filter(Boolean) as { label: string; value: string; sub: string; tone: string }[];

  // the strongest rep max by implied 1RM — the "best" row to highlight
  const peakRepMax = repMaxes.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), repMaxes[0]);

  return (
    <div className="mt-4 space-y-3">
      {headline.map((h) => (
        <div key={h.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            {h.label}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span
              className="font-display text-[26px] font-black tabular-nums leading-none"
              style={{ color: h.tone }}
            >
              {h.value}
            </span>
            <span className="font-mono text-[11px] text-muted-2">{h.sub}</span>
          </div>
        </div>
      ))}

      <div>
        <div className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
          Rep maxes
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
            <span>Reps</span>
            <span>Date</span>
            <span className="text-right">Weight</span>
            <span className="text-right">≈1RM</span>
          </div>
          {repMaxes.map((rm) => {
            const best = rm === peakRepMax;
            return (
              <div
                key={rm.reps}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 border-b border-line/60 px-4 py-3 font-mono text-[13px] last:border-b-0"
              >
                <span className="w-10 font-display text-[14px] font-bold text-ink">
                  {rm.reps}
                  {rm.reps === REP_CAP ? '+' : ''}
                </span>
                <span className="text-muted-2">{sessionDayLabel(rm.at)}</span>
                <span className="text-right tabular-nums text-ink">
                  {rm.weight}
                  <span className="text-[10px] text-muted-2">{u}</span>
                </span>
                <span
                  className="text-right tabular-nums"
                  style={{ color: best ? C.accent : C.muted }}
                >
                  {rm.e1rm}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-2">
          Heaviest weight you've logged for each rep count. The ≈1RM column estimates a one-rep max
          from each — the highlighted row is your strongest effort overall.
        </p>
      </div>
    </div>
  );
}

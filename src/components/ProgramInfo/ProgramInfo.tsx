import { useState, type ReactNode } from 'react';
import { DAYS } from '../../domain/program';
import { LIFTS } from '../../domain/lifts';
import { repLabel, feelLabel, rpeNum, isPerLeg, rpeHue } from '../../domain/format';
import {
  PROGRAM_PROFILE,
  RPE_TABLE,
  CORE_RULES,
  SPLIT_LOGIC,
  SCHEDULE,
  STARTING_LOADS,
  PROGRESSION,
  DELOAD,
  HOUR_TIPS,
  type InfoRule,
} from '../../domain/programInfo';
import { ChevronLeft } from '../common/icons';
import { ProgramTracker } from './ProgramTracker';

/** A mono uppercase section label with its content below. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        {label}
      </div>
      {children}
    </section>
  );
}

/** A titled rule card. */
function RuleCard({ rule, accent }: { rule: InfoRule; accent?: boolean }) {
  return (
    <div
      className={[
        'rounded-2xl border bg-surface p-4 shadow-card',
        accent ? 'border-accent/40' : 'border-line',
      ].join(' ')}
    >
      <div className="font-display text-[14px] font-bold tracking-[-0.01em]">{rule.title}</div>
      <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-muted">{rule.body}</p>
    </div>
  );
}

/**
 * The program reference: the philosophy, rules and protocols behind the plan,
 * plus the full day-by-day prescription rendered live from the program itself.
 */
type Tab = 'progress' | 'rules' | 'days' | 'protocols';

const TABS: [Tab, string][] = [
  ['progress', 'Progress'],
  ['rules', 'Rules'],
  ['days', 'Days'],
  ['protocols', 'Protocols'],
];

export function ProgramInfo({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('progress');

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
            The program
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            How it works & why
          </div>
        </div>
      </header>

      {/* tab bar */}
      <div className="mt-3 flex gap-6 border-b border-line">
        {TABS.map(([key, label]) => {
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

      {tab === 'progress' && (
        <>
          {/* profile */}
          <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="font-display text-[15px] font-bold tracking-[-0.01em]">
              {PROGRAM_PROFILE.tagline}
            </div>
            <ul className="m-0 mt-2.5 flex flex-col gap-1.5 p-0">
              {PROGRAM_PROFILE.points.map((p) => (
                <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <Section label="This block">
            <ProgramTracker />
          </Section>
        </>
      )}

      {tab === 'rules' && (
        <>
          <Section label="The two rules on a cut">
        <div className="flex flex-col gap-2">
          {CORE_RULES.map((r) => (
            <RuleCard key={r.title} rule={r} accent />
          ))}
        </div>
      </Section>

      <Section label="Legs vs arms">
        <div className="flex flex-col gap-2">
          {SPLIT_LOGIC.map((r) => (
            <RuleCard key={r.title} rule={r} />
          ))}
        </div>
      </Section>

      <Section label="RPE — reps left in the tank">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          {RPE_TABLE.map((row) => {
            const hue = rpeHue(parseFloat(row.rpe));
            return (
              <div
                key={row.rpe}
                className="flex items-center gap-3 border-b border-line/60 px-4 py-2.5 last:border-b-0"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-display text-[13px] font-black tabular-nums"
                  style={{
                    backgroundColor: `hsl(${hue} 65% 45% / 0.22)`,
                    borderColor: `hsl(${hue} 65% 55% / 0.55)`,
                    color: `hsl(${hue} 85% 75%)`,
                  }}
                >
                  {row.rpe}
                </span>
                <span className="text-[13px] text-muted">{row.meaning}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section label="Weekly schedule">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-2">6 days</div>
          <div className="mt-1 font-display text-[13px] font-bold tracking-[-0.01em]">
            {SCHEDULE.sixDay}
          </div>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-2">
            5 days
          </div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{SCHEDULE.fiveDay}</p>
          <p className="m-0 mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
            {SCHEDULE.leadNote}
          </p>
        </div>
      </Section>
        </>
      )}

      {tab === 'days' && (
      <Section label="The days">
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => (
            <div key={day.key} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[15px] font-black uppercase tracking-[-0.01em]">
                  {day.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {day.variant}
                </span>
              </div>
              <p className="m-0 mt-0.5 text-[12px] text-muted-2">{day.note}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {day.blocks.map((block, i) => {
                  const name = LIFTS[block.lift]?.name ?? block.lift;
                  const perLeg = isPerLeg(block, LIFTS[block.lift]?.uni);
                  const hue = rpeHue(rpeNum(block.rpe));
                  const lead = i === 0;
                  return (
                    <div
                      key={`${block.lift}-${i}`}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5"
                    >
                      <span
                        className={[
                          'truncate text-[13px]',
                          lead ? 'font-display font-bold tracking-[-0.01em] text-ink' : 'text-muted',
                        ].join(' ')}
                      >
                        {name}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[12px] tabular-nums text-muted-2">
                        {block.sets}×{repLabel(block.reps)}
                        {perLeg ? '/leg' : ''}
                      </span>
                      <span
                        className="w-[54px] shrink-0 rounded-md border py-0.5 text-center font-mono text-[10px] font-bold tabular-nums"
                        style={{
                          backgroundColor: `hsl(${hue} 65% 45% / 0.18)`,
                          borderColor: `hsl(${hue} 65% 55% / 0.5)`,
                          color: `hsl(${hue} 85% 78%)`,
                        }}
                      >
                        {feelLabel(block).replace('RPE ', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>
      )}

      {tab === 'protocols' && (
        <>
      <Section label="Picking starting loads">
        <div className="flex flex-col gap-2">
          {STARTING_LOADS.map((r) => (
            <RuleCard key={r.title} rule={r} />
          ))}
        </div>
      </Section>

      <Section label="Progression on a cut">
        <p className="mb-2 mt-0 text-[13px] leading-relaxed text-muted">
          Your job is mostly to <strong className="text-ink">hold the line</strong>, not add weight
          every week.
        </p>
        <div className="flex flex-col gap-2">
          {PROGRESSION.map((r) => (
            <RuleCard key={r.title} rule={r} />
          ))}
        </div>
      </Section>

      <Section label="Deload">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-2">When</div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{DELOAD.when}</p>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-2">How</div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{DELOAD.how}</p>
        </div>
      </Section>

      <Section label="Fitting it in an hour">
        <ul className="m-0 flex flex-col gap-2 p-0">
          {HOUR_TIPS.map((tip) => (
            <li
              key={tip}
              className="flex gap-2.5 rounded-2xl border border-line bg-surface p-3.5 text-[13px] leading-relaxed text-muted shadow-card"
            >
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </Section>
        </>
      )}
    </div>
  );
}

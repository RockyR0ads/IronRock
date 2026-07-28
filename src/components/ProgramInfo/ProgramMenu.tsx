import type { ReactNode } from 'react';
import { useStore } from '../../state/StoreContext';
import { PROGRAMS, type ProgramOrigin } from '../../domain/programs';
import { ChevronLeft, ChevronRight, CheckIcon } from '../common/icons';

/** A small neutral meta chip (level, days, block). */
function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-2">
      {children}
    </span>
  );
}

/** Distinguishes your own plan from a well-known published one. */
function OriginBadge({ origin }: { origin: ProgramOrigin }) {
  const custom = origin === 'custom';
  return (
    <span
      className={[
        'rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em]',
        custom
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-blue/40 bg-blue/10 text-blue',
      ].join(' ')}
    >
      {custom ? 'Custom' : 'Staple'}
    </span>
  );
}

/**
 * The program menu: browse available training programs, open one for its full
 * details, and set which is your active plan.
 */
export function ProgramMenu({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const { state, dispatch } = useStore();

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
            Programs
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Choose your plan
          </div>
        </div>
      </header>

      <p className="mb-5 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">
        Pick the program you're running. Your active plan drives the week, your targets and the
        progression tracker. Tap one to read how it works.
      </p>

      <div className="flex flex-col gap-3">
        {PROGRAMS.map((p) => {
          const active = state.activeProgram === p.id;
          const ready = !!p.ready;
          const Head = ready ? 'button' : 'div';
          return (
            <div
              key={p.id}
              className={[
                'overflow-hidden rounded-2xl border shadow-card transition-colors',
                active ? 'border-green/60 bg-green/10' : 'border-line bg-surface',
                ready ? '' : 'opacity-90',
              ].join(' ')}
            >
              <Head
                {...(ready
                  ? {
                      type: 'button' as const,
                      onClick: () => onOpen(p.id),
                      className:
                        'flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-surface-2/40',
                    }
                  : { className: 'flex w-full items-start justify-between gap-3 p-4 text-left' })}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display text-[16px] font-black uppercase tracking-[-0.01em]">
                      {p.name}
                    </span>
                    <OriginBadge origin={p.origin} />
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip>{p.level}</Chip>
                    <Chip>{p.days} days/wk</Chip>
                    {p.weeks && <Chip>{p.weeks}-wk block</Chip>}
                  </span>
                  <span className="mt-2 block text-[13px] font-medium text-ink">{p.tagline}</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-muted-2">
                    {p.focus}
                  </span>
                </span>
                {ready && <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted-2" />}
              </Head>

              <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
                {!ready ? (
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
                    Reference · not yet playable
                  </span>
                ) : active ? (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-green">
                    <CheckIcon className="h-3.5 w-3.5" /> Active program
                  </span>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
                    Not active
                  </span>
                )}
                {ready && (
                  <button
                    type="button"
                    disabled={active}
                    onClick={() => dispatch({ type: 'setActiveProgram', id: p.id })}
                    className={[
                      'rounded-lg px-3 py-1.5 font-display text-[12px] font-bold transition-colors',
                      active
                        ? 'cursor-default text-muted-2'
                        : 'bg-accent text-bg shadow-glow active:scale-[0.98]',
                    ].join(' ')}
                  >
                    {active ? 'Selected' : 'Set active'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

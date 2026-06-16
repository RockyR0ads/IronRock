import { useStore } from '../../state/StoreContext';
import { DAYS } from '../../domain/program';

/** Push / Pull / Legs → quick-scan dot color. */
function dotColor(label: string): string {
  if (label === 'Push') return 'bg-red';
  if (label === 'Pull') return 'bg-blue';
  return 'bg-green';
}

/**
 * Day switcher. A floating, thumb-reachable pill bar pinned to the bottom on
 * mobile; a normal inline card on wider screens.
 */
export function DayNav() {
  const { state, dispatch } = useStore();

  return (
    <nav aria-label="Training day">
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-line-2 bg-surface-2/95 p-1.5 shadow-pop backdrop-blur-md sm:grid-cols-6">
        {DAYS.map((day) => {
          const active = day.key === state.day;
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              onClick={() => dispatch({ type: 'setDay', key: day.key })}
              className={[
                'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors',
                active ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-3 hover:text-ink',
              ].join(' ')}
            >
              <span className="flex items-center gap-1.5">
                {!active && (
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor(day.label)}`} aria-hidden />
                )}
                <span className="font-display text-[13px] font-bold tracking-[-0.01em]">
                  {day.label}
                </span>
              </span>
              <span
                className={[
                  'font-mono text-[9px] uppercase tracking-[0.1em]',
                  active ? 'text-bg/55' : 'text-muted-2',
                ].join(' ')}
              >
                {day.variant.replace(' · ', ' ')}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

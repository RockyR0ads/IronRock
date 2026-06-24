import { useStore } from '../../state/StoreContext';
import { DAYS } from '../../domain/program';

/** Push / Pull / Legs → quick-scan dot color. */
function dotColor(label: string): string {
  if (label === 'Push') return 'bg-red';
  if (label === 'Pull') return 'bg-blue';
  return 'bg-green';
}

/**
 * Day switcher grid. Rendered inside the header's day-picker dropdown; calls
 * `onSelect` after a day is chosen so the dropdown can close.
 */
export function DayNav({ onSelect }: { onSelect?: () => void }) {
  const { state, dispatch } = useStore();

  return (
    <nav aria-label="Training day">
      <div className="grid grid-cols-3 gap-1.5">
        {DAYS.map((day) => {
          const active = day.key === state.day;
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                dispatch({ type: 'setDay', key: day.key });
                onSelect?.();
              }}
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

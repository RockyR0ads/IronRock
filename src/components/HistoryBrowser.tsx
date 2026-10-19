import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../state/StoreContext';
import { liftById } from '../state/store';
import { filterSessions, groupByMonth, dateLabel, type DateFilter } from '../domain/historyFilter';
import { sessionDayLabel } from '../domain/session';
import type { Session } from '../domain/types';
import { HistoryCalendar } from './HistoryCalendar';
import { ChevronRight } from './common/icons';

const PAGE = 40;

/**
 * The searchable history list: free text, an exercise filter and a calendar
 * (year → month → day) to jump across years, with results grouped by month and
 * paged so a decade of workouts never becomes one endless scroll.
 */
export function HistoryBrowser({
  onOpen,
  renderTotals,
}: {
  onOpen: (id: string) => void;
  /** The per-row totals line (shared with the session detail header). */
  renderTotals: (s: Session) => ReactNode;
}) {
  const { state } = useStore();
  const [text, setText] = useState('');
  const [liftId, setLiftId] = useState<string | null>(null);
  const [date, setDate] = useState<DateFilter>({ kind: 'all' });
  const [calOpen, setCalOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const nameOf = (id: string) => liftById(state, id).name;

  // exercises you've logged, for the filter — most-used first
  const lifts = useMemo(() => {
    const n = new Map<string, number>();
    for (const s of state.sessions) {
      for (const id of new Set(s.exercises.map((e) => e.liftId))) n.set(id, (n.get(id) ?? 0) + 1);
    }
    return [...n]
      .map(([id, count]) => ({ id, name: nameOf(id), count }))
      .sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessions, state.customLifts]);

  const results = useMemo(
    () => filterSessions(state.sessions, { text, liftId, date }, nameOf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.sessions, text, liftId, date, state.customLifts]
  );
  const groups = groupByMonth(results.slice(0, limit));
  const filtered = !!text || !!liftId || date.kind !== 'all';
  // any filter change starts paging from the top again
  const reset = (fn: () => void) => {
    fn();
    setLimit(PAGE);
  };
  const calSessions = liftId
    ? state.sessions.filter((s) => s.exercises.some((e) => e.liftId === liftId))
    : state.sessions;

  return (
    <div className="mt-4">
      <input
        type="search"
        value={text}
        onChange={(e) => reset(() => setText(e.target.value))}
        placeholder="Search workouts, exercises, notes…"
        aria-label="Search history"
        className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3.5 text-[15px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
      />

      <div className="mt-2 flex gap-2">
        <select
          value={liftId ?? ''}
          onChange={(e) => reset(() => setLiftId(e.target.value || null))}
          aria-label="Filter by exercise"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line-2 bg-surface-2 px-2.5 text-[13px] text-ink focus:border-secondary focus:outline-none"
        >
          <option value="">All exercises</option>
          {lifts.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.count})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCalOpen((o) => !o)}
          aria-expanded={calOpen}
          className={[
            'h-10 shrink-0 rounded-xl border px-3 font-display text-[13px] font-bold transition-colors',
            date.kind !== 'all' || calOpen
              ? 'border-secondary/60 bg-secondary/10 text-ink'
              : 'border-line-2 bg-surface-2 text-muted',
          ].join(' ')}
        >
          {dateLabel(date)}
        </button>
      </div>

      {calOpen && (
        <div className="mt-2">
          <HistoryCalendar sessions={calSessions} value={date} onChange={(f) => reset(() => setDate(f))} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted-2">
        <span>
          {results.length} workout{results.length === 1 ? '' : 's'}
          {filtered ? ' match' : ''}
        </span>
        {filtered && (
          <button
            type="button"
            onClick={() =>
              reset(() => {
                setText('');
                setLiftId(null);
                setDate({ kind: 'all' });
              })
            }
            className="font-medium text-secondary"
          >
            Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted-2">No workouts match.</p>
      ) : (
        <div className="mt-2">
          {groups.map((g) => (
            <section key={g.key} className="mb-3">
              <div className="sticky top-0 z-10 -mx-1 mb-1.5 bg-bg/90 px-1 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2 backdrop-blur">
                {g.label}
              </div>
              <div className="flex flex-col gap-2">
                {g.items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpen(s.id)}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-secondary/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate font-display text-[15px] font-bold tracking-[-0.01em]">
                          {s.title}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                          {sessionDayLabel(s.at)}
                        </span>
                      </span>
                      <span className="mt-1 block">{renderTotals(s)}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
                  </button>
                ))}
              </div>
            </section>
          ))}
          {results.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE)}
              className="mt-1 w-full rounded-xl border border-line-2 bg-surface-2 py-3 font-display text-[13px] font-bold text-ink transition-colors hover:border-secondary/50"
            >
              Show {Math.min(PAGE, results.length - limit)} more · {results.length - limit} left
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { LIFTS, TOP_LIFTS, canonicalLiftId } from '../../domain/lifts';
import { liftById } from '../../state/store';
import { searchLibrary } from '../../domain/library';
import { ChevronLeft, ChevronRight, TrendIcon } from '../common/icons';

interface Row {
  id: string;
  name: string;
  sessions: number;
}

/**
 * Shared exercise picker: the top 30 lifts, with the ones you've actually logged
 * surfaced first. Reused by the charts feature and the exercise hub — the header
 * copy is passed in so each entry point reads right.
 */
export function ExerciseSelector({
  onPick,
  onBack,
  title = 'Exercise charts',
  subtitle = 'Track a lift over time',
  blurb = "Pick an exercise to see how it's trending across your logged workouts — estimated 1RM, top set or volume, with a detailed breakdown a tap away.",
  onlyIds,
}: {
  onPick: (liftId: string) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  blurb?: string;
  /** Restrict the list to these lift ids (e.g. a single lift during rollout). */
  onlyIds?: string[];
}) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const query = q.trim();

  // sessions per lift with at least one counted working set, counted once
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of state.sessions) {
      const hit = new Set<string>();
      for (const ex of s.exercises) if (ex.sets.some((x) => x.done && !x.warmup)) hit.add(ex.liftId);
      for (const id of hit) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [state.sessions]);
  const sessionsOf = (id: string) => counts.get(id) ?? 0;

  const { tracked, rest } = useMemo(() => {
    if (onlyIds) {
      const rows = onlyIds.filter((id) => LIFTS[id]).map((id) => ({ id, name: LIFTS[id].name, sessions: sessionsOf(id) }));
      return { tracked: rows.filter((r) => r.sessions > 0), rest: rows.filter((r) => r.sessions === 0) };
    }
    // every lift you've actually logged (built-in, library or custom), plus the
    // whole built-in catalogue — top lifts first — for the rest
    const logged = new Set<string>();
    for (const s of state.sessions) for (const ex of s.exercises) logged.add(ex.liftId);
    const ordered = [...new Set([...TOP_LIFTS, ...Object.keys(LIFTS), ...logged])];
    const rows: Row[] = ordered.map((id) => ({ id, name: liftById(state, id).name, sessions: sessionsOf(id) }));
    return {
      tracked: rows.filter((r) => r.sessions > 0).sort((a, b) => b.sessions - a.sessions),
      rest: rows.filter((r) => r.sessions === 0 && LIFTS[r.id]),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessions, counts, onlyIds]);

  // Search spans custom lifts, curated lifts, and the whole 870+ library — so
  // any exercise is reachable, not just the curated top list. Ignored when a
  // single-lift rollout (`onlyIds`) constrains the page.
  const results = useMemo<Row[] | null>(() => {
    if (!query || onlyIds) return null;
    // word-by-word, plural-tolerant: "lateral raises" finds "Cable lateral raise"
    const norm = (t: string) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
    const terms = query.toLowerCase().split(/s+/).filter(Boolean).map(norm);
    const hit = (name: string) => {
      const words = name.toLowerCase().split(/[^a-z0-9]+/).map(norm);
      return terms.every((t) => words.some((w) => w.startsWith(t)));
    };
    const seen = new Set<string>();
    const rows: Row[] = [];
    const add = (rawId: string) => {
      const id = canonicalLiftId(rawId); // library twins fold onto the built-in lift
      if (seen.has(id)) return;
      seen.add(id);
      rows.push({ id, name: liftById(state, id).name, sessions: sessionsOf(id) });
    };
    for (const [id, c] of Object.entries(state.customLifts)) if (hit(c.name)) add(id);
    for (const id of Object.keys(LIFTS)) if (hit(LIFTS[id].name)) add(id);
    for (const s of state.sessions) for (const ex of s.exercises) if (hit(liftById(state, ex.liftId).name)) add(ex.liftId);
    for (const ex of searchLibrary(query)) add(ex.id);
    // logged lifts first (most used on top), then the rest in match order
    return rows.sort((a, b) => b.sessions - a.sessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, onlyIds, state.customLifts, state.sessions, counts]);

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
            {title}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            {subtitle}
          </div>
        </div>
      </header>

      <p className="mb-4 mt-3 max-w-[52ch] text-[14px] leading-relaxed text-muted">{blurb}</p>

      {!onlyIds && (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 870+ exercises…"
          aria-label="Search exercises"
          className="mb-5 h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3.5 text-[15px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
        />
      )}

      {results !== null ? (
        results.length > 0 ? (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <LiftRow key={r.id} row={r} onPick={onPick} />
            ))}
          </div>
        ) : (
          <p className="px-1 py-10 text-center text-[13px] text-muted-2">
            No exercises match “{query}”.
          </p>
        )
      ) : (
        <>
      {tracked.length > 0 && (
        <>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Your lifts
          </div>
          <div className="mb-6 flex flex-col gap-2">
            {tracked.map((r) => (
              <LiftRow key={r.id} row={r} onPick={onPick} />
            ))}
          </div>
        </>
      )}

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        {tracked.length > 0 ? 'All exercises' : 'Choose an exercise'}
      </div>
      <div className="flex flex-col gap-2">
        {rest.map((r) => (
          <LiftRow key={r.id} row={r} onPick={onPick} />
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function LiftRow({ row, onPick }: { row: Row; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(row.id)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-card transition-colors hover:border-secondary/50"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            row.sessions > 0 ? 'bg-secondary/15 text-secondary' : 'bg-surface-2 text-muted-2',
          ].join(' ')}
        >
          <TrendIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-bold tracking-[-0.01em]">
            {row.name}
          </span>
          <span className="text-[12px] text-muted-2">
            {row.sessions === 0
              ? 'No sessions yet'
              : `${row.sessions} session${row.sessions === 1 ? '' : 's'} logged`}
          </span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-2" />
    </button>
  );
}

import type { ReactNode } from 'react';

function Panel({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mb-2.5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-display text-[15px] font-bold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[18px] leading-none text-muted transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-4 pb-5 text-[14px] leading-relaxed text-muted [&_strong]:font-semibold [&_strong]:text-ink">
        {children}
      </div>
    </details>
  );
}

/** The two collapsible explainer panels from the reference. */
export function ReferencePanels() {
  return (
    <>
      <Panel summary="How the loads are calculated">
        <p className="mb-3">
          Everything runs on the reps-to-failure model:{' '}
          <strong>reps left in the tank = 10 − RPE</strong>, so 5 reps at RPE 8 is 7 reps from
          failure. That maps to a percentage of your 1RM (chart below), and the rest of the program
          loads back off that number.
        </p>
        <p className="mb-3">
          A <strong>reference set is taken to failure</strong>, so there's no RPE to judge — it's
          already RPE 10, and the reps you managed are the reps to failure. That's what makes it a
          clean input: what you did, not how it felt.
        </p>
        <p className="mb-3">
          For a rep range, the displayed load is computed at the middle of the range —{' '}
          <strong>load the bar to that, and let your reps float to hit the target RPE.</strong>{' '}
          Isolation lifts (RPE 9–10) are feel-based, so those are fields for you to fill and keep.
        </p>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr className="bg-surface-2">
                <th className="border-b border-line p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
                  Reps from failure
                </th>
                <th className="border-b border-line p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
                  % of 1RM
                </th>
                <th className="border-b border-l border-line p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
                  Reps from failure
                </th>
                <th className="border-b border-line p-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-2">
                  % of 1RM
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['0 (RPE 10)', '100%', '5', '86%'],
                ['1 (RPE 9)', '96%', '6', '84%'],
                ['2 (RPE 8)', '92%', '7', '81%'],
                ['3 (RPE 7)', '89%', '8', '79%'],
                ['4 (RPE 6)', '86%', '9', '76%'],
              ].map((row, i, arr) => (
                <tr key={row[0]} className={i < arr.length - 1 ? 'border-b border-line' : ''}>
                  <td className="p-2.5 text-ink">{row[0]}</td>
                  <td className="p-2.5 text-muted">{row[1]}</td>
                  <td className="border-l border-line p-2.5 text-ink">{row[2]}</td>
                  <td className="p-2.5 text-muted">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel summary="Running it on a cut">
        <p className="mb-3">
          <strong>Hold the line, don't chase PRs.</strong> Keep the same loads week to week. As you
          lean out, the same weight reads as a higher RPE — that's expected and is what maintaining
          looks like. Don't drop the weight to chase the number.
        </p>
        <p className="mb-3">
          <strong>Arms are the exception.</strong> Push the isolation work — double progression: hit
          the top of the rep range on all sets, then add a little and drop to the bottom. This is the
          one place you actively build.
        </p>
        <p className="mb-3">
          <strong>Legs stay crisp.</strong> Heavy at RPE 8, never grinding, never to failure —
          that's what makes them stronger without bigger.
        </p>
        <p className="mb-0">
          <strong>Deload every 5–6 weeks</strong> (or sooner if run down): same lifts, halve the
          sets, cap everything at RPE 6 for a week, then resume.
        </p>
      </Panel>
    </>
  );
}

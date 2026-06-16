import type { ReactNode } from 'react';

/** Section header: an accent step badge, a bold title, and an optional hint line. */
export function SectionHead({
  n,
  title,
  hint,
}: {
  n: string;
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-4 mt-12 first:mt-0">
      <div className="flex items-center gap-3">
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent/15 px-2 font-mono text-[11px] font-bold text-accent">
          {n}
        </span>
        <h2 className="m-0 font-display text-[21px] font-bold tracking-[-0.01em]">{title}</h2>
      </div>
      {hint && <p className="m-0 ml-9 mt-1 text-[13px] text-muted-2">{hint}</p>}
    </div>
  );
}

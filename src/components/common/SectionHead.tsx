import type { ReactNode } from 'react';

/** Section header: an accent step badge, a bold title, and an optional hint line. */
export function SectionHead({
  n,
  title,
  hint,
}: {
  /** Optional step badge. Omit for a plain (un-numbered) section header. */
  n?: string;
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-4 mt-12 first:mt-0">
      <div className="flex items-center gap-3">
        {n && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary/15 px-2 font-mono text-[11px] font-bold text-secondary">
            {n}
          </span>
        )}
        <h2 className="m-0 font-display text-[21px] font-bold tracking-[-0.01em]">{title}</h2>
      </div>
      {hint && <p className={`m-0 mt-1 text-[13px] text-muted-2 ${n ? 'ml-9' : ''}`}>{hint}</p>}
    </div>
  );
}

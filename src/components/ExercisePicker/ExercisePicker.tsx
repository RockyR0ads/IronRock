import { useEffect, useRef } from 'react';
import { LIFTS, CAT } from '../../domain/lifts';
import type { Category } from '../../domain/types';

export interface PickerGroup {
  cat: Category;
  liftIds: string[];
}

export interface PickerRequest {
  title: string;
  groups: PickerGroup[];
  /** Lift id currently in the slot (swap mode), marked as current. */
  currentId?: string;
}

function LiftButton({
  id,
  current,
  onPick,
}: {
  id: string;
  current: boolean;
  onPick: (id: string) => void;
}) {
  const lift = LIFTS[id];
  return (
    <button
      type="button"
      data-pick
      onClick={() => onPick(id)}
      aria-current={current || undefined}
      className={[
        'flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
        current
          ? 'border-accent bg-accent/10'
          : 'border-line-2 bg-surface-2 hover:border-line-2 hover:bg-surface-3',
      ].join(' ')}
    >
      <span className="min-w-0">
        <span className="block truncate font-display text-[14px] font-bold tracking-[-0.01em]">
          {lift.name}
        </span>
        <span className="text-[11px] text-muted-2">
          {lift.type === 'computed' ? 'Loaded' : 'Feel'} · {lift.unit}
        </span>
      </span>
      {current ? (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg">
          Current
        </span>
      ) : (
        <span className="shrink-0 text-[18px] leading-none text-muted-2">+</span>
      )}
    </button>
  );
}

export function ExercisePicker({
  request,
  onPick,
  onClose,
}: {
  request: PickerRequest | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // focus the first option for keyboard users
    sheetRef.current?.querySelector<HTMLButtonElement>('button[data-pick]')?.focus();
    // lock background scroll while the sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [request, onClose]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={request.title}
        className={[
          'flex w-full flex-col overflow-hidden border-line bg-surface animate-sheet-up',
          'max-h-[88vh] rounded-t-3xl border-t',
          'sm:max-h-[80vh] sm:max-w-[560px] sm:rounded-3xl sm:border',
        ].join(' ')}
      >
        {/* grab handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">
            {request.title}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[18px] leading-none text-muted transition-colors hover:bg-surface-3 hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto px-4 pb-6 pt-1 pb-safe">
          {request.groups.map((group) => (
            <div key={group.cat} className="mb-4">
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-2">
                {CAT[group.cat]}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.liftIds.map((id) => (
                  <LiftButton key={id} id={id} current={id === request.currentId} onPick={onPick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

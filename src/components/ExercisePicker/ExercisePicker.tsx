import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { liftById } from '../../state/store';
import { attachmentChoosable, attachmentFor } from '../../domain/attachments';
import { AttachmentChips } from '../AttachmentChips';
import {
  EQUIP_OPTIONS,
  GROUP_ORDER,
  libraryInGroup,
  searchLibrary,
  type EquipKey,
  type LibraryExercise,
  type MuscleGroup,
} from '../../domain/library';
import { PlusIcon } from '../common/icons';
import { LIFTS, canonicalLiftId } from '../../domain/lifts';
import { muscleGroupOf } from '../../domain/overview';
import { ExerciseDetail } from './ExerciseDetail';

export interface PickerRequest {
  title: string;
  /** Lift id currently in the slot (swap mode), marked as current. */
  currentId?: string;
}

interface Row {
  id: string;
  name: string;
  sub: string;
  hasDetail: boolean;
  /** Library id for the how-to detail view (differs from `id` for built-in twins). */
  libId?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function libRow(ex: LibraryExercise): Row {
  const sub = ex.equipment ? cap(ex.equipment) : ex.muscles[0] ? cap(ex.muscles[0]) : 'Exercise';
  // a library duplicate of a built-in lift picks the built-in, so the movement
  // keeps one history (and matches what the programs use)
  const canon = canonicalLiftId(ex.id);
  if (canon !== ex.id && LIFTS[canon]) {
    return { id: canon, name: LIFTS[canon].name, sub, hasDetail: true, libId: ex.id };
  }
  return { id: ex.id, name: ex.name, sub, hasDetail: true, libId: ex.id };
}

/** Built-in lifts as picker rows — matched by search words or by muscle group. */
const norm = (t: string) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t);
function builtInRows(match: { query?: string; group?: MuscleGroup }): Row[] {
  const terms = (match.query ?? '').toLowerCase().split(/s+/).filter(Boolean).map(norm);
  return Object.values(LIFTS)
    .filter((l) => {
      if (match.group) return muscleGroupOf(l.id, {}) === match.group;
      const words = l.name.toLowerCase().split(/[^a-z0-9]+/).map(norm);
      return terms.length > 0 && terms.every((t) => words.some((w) => w.startsWith(t)));
    })
    .map((l) => ({ id: l.id, name: l.name, sub: l.unit || 'Built-in', hasDetail: !!l.lib, libId: l.lib }));
}

/** Drop repeat rows (several library twins can fold onto one built-in). */
function uniqueRows(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/** Equipment presets for a custom exercise, mapped to a logging unit. */
const EQUIPMENT = [
  { label: 'Barbell', unit: 'kg on bar' },
  { label: 'Dumbbell', unit: 'kg / DB' },
  { label: 'Machine / Cable', unit: 'kg' },
  { label: 'Bodyweight', unit: 'bodyweight' },
  { label: 'Other', unit: 'kg' },
];

export function ExercisePicker({
  request,
  onPick,
  onClose,
}: {
  request: PickerRequest | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const sheetRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | 'My'>('Chest');
  const [equip, setEquip] = useState<EquipKey | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', group: 'Chest' as MuscleGroup, unit: 'kg on bar' });

  const open = !!request;

  // reset to a clean list each time the sheet opens
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setGroup('Chest');
    setEquip(null);
    setDetailId(null);
    setCreating(false);
    setAttachFor(null);
    setForm({ name: '', group: 'Chest', unit: 'kg on bar' });
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (attachFor) setAttachFor(null);
      else if (detailId) setDetailId(null);
      else if (creating) setCreating(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [request, detailId, creating, attachFor, onClose]);

  if (!request) return null;

  const customEntries = Object.entries(state.customLifts);
  const hasCustom = customEntries.length > 0;
  const q = query.trim().toLowerCase();

  let rows: Row[];
  if (q) {
    // Custom lifts carry no dataset equipment, so hide them when filtering by it.
    const custom = equip
      ? []
      : customEntries
          .filter(([, c]) => c.name.toLowerCase().includes(q))
          .map(([id, c]) => ({ id, name: c.name, sub: c.unit || 'Custom', hasDetail: false }));
    rows = uniqueRows([
      ...custom,
      ...(equip ? [] : builtInRows({ query })),
      ...searchLibrary(query, equip).map(libRow),
    ]);
  } else if (group === 'My') {
    rows = customEntries.map(([id, c]) => ({
      id,
      name: c.name,
      sub: c.unit || 'Custom',
      hasDetail: false,
    }));
  } else {
    rows = uniqueRows([
      ...(equip ? [] : builtInRows({ group })),
      ...libraryInGroup(group, equip).map(libRow),
    ]);
  }

  /** Cable lifts stop at the attachment step first; everything else picks straight away. */
  function pick(id: string) {
    if (attachmentChoosable(liftById(state, id))) setAttachFor(id);
    else onPick(id);
  }

  function startCreate(prefillName = '') {
    setForm({ name: prefillName, group: group === 'My' ? 'Chest' : group, unit: 'kg on bar' });
    setCreating(true);
  }

  function createCustom() {
    const name = form.name.trim();
    if (!name) return;
    const id = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: 'addCustomLift', id, name, unit: form.unit, group: form.group });
    onPick(id);
  }

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
          'h-[90vh] rounded-t-3xl border-t',
          'sm:h-[80vh] sm:max-w-[560px] sm:rounded-3xl sm:border',
        ].join(' ')}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line-2" />
        </div>

        {attachFor ? (
          <AttachmentStep
            name={liftById(state, attachFor).name}
            value={attachmentFor(liftById(state, attachFor), state.exerciseConfig[attachFor]?.attachment)}
            onBack={() => setAttachFor(null)}
            onPick={(attachment) => {
              dispatch({ type: 'setExerciseConfig', id: attachFor, patch: { attachment } });
              onPick(attachFor);
            }}
          />
        ) : detailId ? (
          <ExerciseDetail
            id={detailId}
            isCurrent={canonicalLiftId(detailId) === request.currentId}
            onBack={() => setDetailId(null)}
            onSelect={() => pick(canonicalLiftId(detailId))}
          />
        ) : creating ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-5 py-3.5">
              <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">
                New exercise
              </h3>
              <button
                type="button"
                aria-label="Cancel"
                onClick={() => setCreating(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[18px] leading-none text-muted hover:text-ink"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 pb-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">Name</span>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Landmine press"
                  className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3 text-[15px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">Muscle group</span>
                <select
                  value={form.group}
                  onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as MuscleGroup }))}
                  className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3 text-[15px] text-ink focus:border-secondary focus:outline-none"
                >
                  {GROUP_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-muted">Equipment</span>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3 text-[15px] text-ink focus:border-secondary focus:outline-none"
                >
                  {EQUIPMENT.map((eq) => (
                    <option key={eq.label} value={eq.unit}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="border-t border-line px-5 py-3 pb-safe">
              <button
                type="button"
                onClick={createCustom}
                disabled={!form.name.trim()}
                className="w-full rounded-xl bg-accent py-3 font-display text-[14px] font-bold text-bg shadow-glow transition-transform active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
              >
                Create & add
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3.5">
              <h3 className="m-0 font-display text-[18px] font-black tracking-[-0.01em]">
                {request.title}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-[18px] leading-none text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="px-4">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 870+ exercises…"
                aria-label="Search exercises"
                className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 px-3.5 text-[15px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
              />
            </div>

            {group !== 'My' && (
              <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
                <button
                  type="button"
                  onClick={() => setEquip(null)}
                  className={[
                    'shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                    equip === null ? 'bg-blue text-bg' : 'bg-surface-2 text-muted hover:text-ink',
                  ].join(' ')}
                >
                  All gear
                </button>
                {EQUIP_OPTIONS.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setEquip((cur) => (cur === eq ? null : eq))}
                    className={[
                      'shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                      equip === eq ? 'bg-blue text-bg' : 'bg-surface-2 text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            )}

            {!q && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
                <button
                  type="button"
                  onClick={() => startCreate()}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-accent/60 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-accent"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> New
                </button>
                {hasCustom && (
                  <button
                    type="button"
                    onClick={() => setGroup('My')}
                    className={[
                      'shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                      group === 'My'
                        ? 'bg-ink text-bg'
                        : 'bg-surface-2 text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    Mine
                  </button>
                )}
                {GROUP_ORDER.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroup(g)}
                    className={[
                      'shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
                      group === g ? 'bg-ink text-bg' : 'bg-surface-2 text-muted hover:text-ink',
                    ].join(' ')}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-auto px-4 pb-6 pb-safe pt-1">
              {q && (
                <button
                  type="button"
                  onClick={() => startCreate(query.trim())}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-accent/60 bg-accent/5 px-3.5 py-2.5 text-left transition-colors hover:bg-accent/10"
                >
                  <PlusIcon className="h-4 w-4 shrink-0 text-accent" />
                  <span className="min-w-0 truncate font-display text-[14px] font-bold tracking-[-0.01em] text-accent">
                    Create “{query.trim()}”
                  </span>
                </button>
              )}
              {rows.length === 0 && !q && (
                <p className="px-1 py-6 text-center text-[13px] text-muted-2">
                  Pick a group above, search, or create your own.
                </p>
              )}
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={[
                    'flex items-center gap-2 rounded-xl border',
                    row.id === request.currentId
                      ? 'border-accent bg-accent/10'
                      : 'border-line-2 bg-surface-2',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => pick(row.id)}
                    className="flex min-h-[52px] min-w-0 flex-1 flex-col justify-center px-3.5 py-2 text-left"
                  >
                    <span className="truncate font-display text-[14px] font-bold tracking-[-0.01em]">
                      {row.name}
                    </span>
                    <span className="truncate text-[11px] text-muted-2">{row.sub}</span>
                  </button>
                  {row.id === request.currentId && (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-bg">
                      Current
                    </span>
                  )}
                  {row.hasDetail && (
                    <button
                      type="button"
                      aria-label={`View ${row.name} instructions`}
                      onClick={() => setDetailId(row.libId ?? row.id)}
                      className="mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-[13px] font-bold text-muted transition-colors hover:text-ink"
                    >
                      i
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Second step for cable lifts: which handle is on the cable. */
function AttachmentStep({
  name,
  value,
  onBack,
  onPick,
}: {
  name: string;
  value: string | undefined;
  onBack: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6 pt-4">
      <button type="button" onClick={onBack} className="self-start text-[13px] font-semibold text-muted hover:text-ink">
        ← Back
      </button>
      <h2 className="mt-3 font-display text-[20px] font-bold tracking-[-0.01em]">{name}</h2>
      <p className="mt-1 text-[13px] text-muted">Which attachment is on the cable? You can change it on the workout card.</p>
      <div className="mt-5">
        <AttachmentChips value={value} onPick={onPick} />
      </div>
    </div>
  );
}

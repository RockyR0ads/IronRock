import { CUSTOM_EQUIPMENT } from '../domain/customEquipment';

/** Pick what a custom exercise is done on. Wraps; one choice. */
export function EquipmentChips({ value, onPick }: { value?: string; onPick: (equipment: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CUSTOM_EQUIPMENT.map((e) => {
        const on = value === e.label;
        return (
          <button
            key={e.label}
            type="button"
            onClick={() => onPick(e.label)}
            aria-pressed={on}
            className={[
              'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
              on ? 'border-secondary bg-secondary/15 text-secondary' : 'border-line-2 bg-surface-2 text-muted hover:text-ink',
            ].join(' ')}
          >
            {e.label}
          </button>
        );
      })}
    </div>
  );
}

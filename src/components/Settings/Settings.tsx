import { useStore } from '../../state/StoreContext';
import { ACTIVITY_LEVELS, type Sex, type Profile } from '../../domain/calories';
import {
  PRIMARY,
  SECONDARY,
  type PrimaryKey,
  type SecondaryKey,
  type Swatch,
} from '../../domain/theme';
import { ChevronLeft } from '../common/icons';
import { GlobalControls } from '../GlobalControls';

/** App settings: personal details for calorie targets, plus training preferences. */
export function Settings({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const setProfile = (patch: Partial<Profile>) => dispatch({ type: 'setProfile', patch });

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
            Settings
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
            Your details & preferences
          </div>
        </div>
      </header>

      {/* profile — powers the calorie targets on the Weight page */}
      <div className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        Your details
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <p className="m-0 mb-3 text-[12px] leading-relaxed text-muted-2">
          Used to estimate your maintenance calories for the weight goal.
        </p>

        {/* sex */}
        <div className="mb-3">
          <span className="mb-1.5 block text-[12px] font-medium text-muted">Sex</span>
          <div className="flex gap-1 rounded-xl border border-line-2 bg-surface-2 p-1">
            {(['male', 'female'] as Sex[]).map((s) => {
              const on = p.sex === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setProfile({ sex: s })}
                  className={[
                    'flex-1 rounded-lg py-2 font-display text-[13px] font-bold capitalize transition-colors',
                    on ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
                  ].join(' ')}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* height + age */}
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Height"
            unit="cm"
            value={p.heightCm ?? ''}
            onChange={(v) => setProfile({ heightCm: v })}
          />
          <Field
            label="Age"
            unit="yrs"
            value={p.age ?? ''}
            onChange={(v) => setProfile({ age: v })}
          />
        </div>

        {/* activity */}
        <div className="mt-3">
          <span className="mb-1.5 block text-[12px] font-medium text-muted">Activity level</span>
          <div className="flex flex-col gap-1.5">
            {ACTIVITY_LEVELS.map((a) => {
              const on = p.activity === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setProfile({ activity: a.id })}
                  className={[
                    'flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                    on ? 'border-accent bg-accent/10' : 'border-line-2 bg-surface-2 hover:border-accent/40',
                  ].join(' ')}
                >
                  <span>
                    <span className="block font-display text-[13px] font-bold tracking-[-0.01em]">
                      {a.label}
                    </span>
                    <span className="text-[11px] text-muted-2">{a.note}</span>
                  </span>
                  <span
                    className={`font-mono text-[12px] font-bold tabular-nums ${on ? 'text-accent' : 'text-muted-2'}`}
                  >
                    ×{a.mult}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* appearance — themeable brand colours */}
      <div className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        Appearance
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
        <SwatchRow
          label="Primary colour"
          hint="Buttons, logging & key actions"
          options={PRIMARY}
          selected={state.theme.primary}
          onPick={(k) => dispatch({ type: 'setTheme', patch: { primary: k as PrimaryKey } })}
        />
        <div className="my-4 border-t border-line" />
        <SwatchRow
          label="Secondary colour"
          hint="Navigation, structure & accents"
          options={SECONDARY}
          selected={state.theme.secondary}
          onPick={(k) => dispatch({ type: 'setTheme', patch: { secondary: k as SecondaryKey } })}
        />
      </div>

      {/* training preferences (moved out of the week view) */}
      <div className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
        Training & data
      </div>
      <GlobalControls />
    </div>
  );
}

function SwatchRow({
  label,
  hint,
  options,
  selected,
  onPick,
}: {
  label: string;
  hint: string;
  options: Record<string, Swatch>;
  selected: string;
  onPick: (key: string) => void;
}) {
  return (
    <div>
      <span className="block font-display text-[14px] font-bold tracking-[-0.01em]">{label}</span>
      <span className="mt-0.5 block text-[12px] text-muted-2">{hint}</span>
      <div className="mt-3 flex gap-2">
        {Object.entries(options).map(([key, sw]) => {
          const on = selected === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(key)}
              className={[
                'flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors',
                on ? 'border-line-2 bg-surface-2' : 'border-line bg-surface hover:border-line-2',
              ].join(' ')}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full ring-2 ring-inset ring-white/10"
                style={{ backgroundColor: sw.hex }}
              />
              <span className="min-w-0 flex-1 truncate font-display text-[13px] font-bold tracking-[-0.01em]">
                {sw.label}
              </span>
              {on && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${sw.hex}22`, color: sw.hex }}
                >
                  On
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder="–"
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-line-2 bg-surface-2 pl-3 pr-10 font-mono text-[15px] text-ink placeholder:text-muted-2 focus:border-secondary focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-2">
          {unit}
        </span>
      </div>
    </label>
  );
}

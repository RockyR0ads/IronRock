import { platesPerSide } from '../../domain/plates';

/** Plate denomination → fill color (matches the IPF-ish palette). */
const PLATE_COLOR: Record<number, string> = {
  25: '#FF5247',
  20: '#4C8DF0',
  15: '#F0BE4B',
  10: '#41C277',
  5: '#E4E2DC',
  2.5: '#9AA0A8',
  1.25: '#646A73',
};

/** Plate denomination → rendered height (px), heavier = taller. */
const PLATE_H: Record<number, number> = {
  25: 24,
  20: 22,
  15: 20,
  10: 18,
  5: 13,
  2.5: 11,
  1.25: 9,
};

function Plate({ kg }: { kg: number }) {
  return (
    <span
      className="w-[5px] shrink-0 rounded-[1.5px] ring-1 ring-black/20"
      style={{ height: PLATE_H[kg] ?? 10, backgroundColor: PLATE_COLOR[kg] ?? '#9AA0A8' }}
    />
  );
}

/**
 * A loaded-barbell glyph for a given total weight (kg on a standard bar). Fills
 * the available width: plates are loaded at each end (heaviest by the collar)
 * with the bar spanning the gap. A sub-bar weight shows a bare bar.
 */
export function PlateBar({ weight }: { weight: number }) {
  const perSide = platesPerSide(weight);
  const left = [...perSide].reverse(); // outer → inner: lightest ... heaviest

  return (
    <span
      className="relative flex h-7 w-full items-center"
      role="img"
      aria-label={`${weight} kg on the bar`}
    >
      {/* the bar */}
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-muted-2/70" />
      {/* left collar of plates */}
      <span className="relative z-10 flex items-center gap-[1.5px]">
        {left.map((p, i) => (
          <Plate key={`l${i}`} kg={p} />
        ))}
      </span>
      {/* bare bar between the collars stretches to fill */}
      <span className="flex-1" />
      {/* right collar of plates */}
      <span className="relative z-10 flex items-center gap-[1.5px]">
        {perSide.map((p, i) => (
          <Plate key={`r${i}`} kg={p} />
        ))}
      </span>
    </span>
  );
}

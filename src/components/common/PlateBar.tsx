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
 * A compact loaded-barbell glyph for a given total weight (kg on a standard bar).
 * Plates are heaviest-nearest-the-collar on each side; a sub-bar weight shows a
 * bare bar.
 */
export function PlateBar({ weight }: { weight: number }) {
  const perSide = platesPerSide(weight);
  const left = [...perSide].reverse(); // lightest outward → heaviest by the collar

  return (
    <span
      className="relative inline-flex h-7 items-center"
      role="img"
      aria-label={`${weight} kg on the bar`}
    >
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-muted-2/70" />
      <span className="relative z-10 flex items-center gap-[1.5px]">
        {left.map((p, i) => (
          <Plate key={`l${i}`} kg={p} />
        ))}
        <span className="mx-[3px] h-3 w-4 rounded-sm bg-line-2" />
        {perSide.map((p, i) => (
          <Plate key={`r${i}`} kg={p} />
        ))}
      </span>
    </span>
  );
}

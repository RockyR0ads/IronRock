import { useId } from 'react';

/**
 * The IronRock plate mark: a front-on weight plate in iron red with a steel hub.
 * Text-free (the cast name is unreadable at UI sizes), so it stays crisp as a
 * small header/nav mark. Brand-constant red — it does NOT follow the themeable
 * accent, so the logo reads the same whatever palette the user picks.
 */
export function PlateMark({
  size = 44,
  className,
  remaining,
}: {
  size?: number;
  className?: string;
  /** 0–1: run the plate down like a clock — the spent part, from 12 o'clock clockwise, goes dark. */
  remaining?: number;
}) {
  const id = useId().replace(/:/g, '');
  const spent = remaining === undefined ? 0 : 1 - Math.max(0, Math.min(1, remaining));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}r`} cx="38%" cy="30%" r="82%">
          <stop offset="0%" stopColor="#FF7A6E" />
          <stop offset="46%" stopColor="#FF5247" />
          <stop offset="100%" stopColor="#A83E33" />
        </radialGradient>
        <radialGradient id={`${id}h`} cx="40%" cy="33%" r="74%">
          <stop offset="0%" stopColor="#D7DCE3" />
          <stop offset="100%" stopColor="#7B828C" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="57" fill={`url(#${id}r)`} stroke="#8A342B" strokeWidth="1.5" />
      <ellipse cx="49" cy="41" rx="29" ry="15" fill="#ffffff" fillOpacity="0.22" />
      <circle cx="64" cy="64" r="50" fill="none" stroke="#3C120E" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="64" cy="64" r="33" fill="none" stroke="#280A08" strokeOpacity="0.28" strokeWidth="1" />
      {spent > 0 && <path d={wedge(spent)} fill="#1A1C20" fillOpacity="0.82" />}
      <circle cx="64" cy="64" r="21" fill={`url(#${id}h)`} stroke="#8A342B" strokeWidth="1" />
      <circle cx="64" cy="64" r="8.5" fill="#141619" />
      <circle cx="64" cy="64" r="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" />
    </svg>
  );
}

/** Pie slice of the plate face from 12 o'clock clockwise, covering `frac` of it. */
function wedge(frac: number): string {
  if (frac >= 0.9999) return 'M64 7.5a56.5 56.5 0 1 1 0 113a56.5 56.5 0 1 1 0-113Z';
  const a = frac * 2 * Math.PI;
  const x = 64 + 56.5 * Math.sin(a);
  const y = 64 - 56.5 * Math.cos(a);
  return `M64 64L64 7.5A56.5 56.5 0 ${frac > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
}

/**
 * The IronRock wordmark: IRON in ink, ROCK in brand red, with an optional
 * red-to-orange gradient tagline. Fixed brand colours (not the themeable accent).
 */
export function Wordmark({
  size = 26,
  tagline = false,
  className,
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="font-display font-black uppercase leading-none tracking-[-0.01em]"
        style={{ fontSize: size }}
      >
        <span className="text-ink">Iron</span>
        <span className="brand-rock">Rock</span>
      </div>
      {tagline && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="h-0.5 w-5 shrink-0 bg-red" />
          <span className="brand-subgrad font-display text-[9px] font-bold uppercase tracking-[0.2em]">
            Lift Life &middot; Est 2026
          </span>
        </div>
      )}
    </div>
  );
}

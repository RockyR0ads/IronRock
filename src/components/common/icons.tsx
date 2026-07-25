import type { SVGProps } from 'react';

/** Compact dumbbell mark for the app header. */
export function Dumbbell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Swap / replace glyph. */
export function SwapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 8h13l-3-3M20 16H7l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Left chevron for back navigation. */
export function ChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Right chevron for forward navigation. */
export function ChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Down chevron for dropdown triggers. */
export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Plus glyph for add actions. */
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Check glyph for completed state. */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small trash glyph for remove actions. */
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A loaded barbell: a shaft carrying graduated weight plates on each end —
 * tallest plate inside, shorter ones outboard — with the bar bowing slightly
 * under the load. Solid fill, so it works as a bold single-colour cutout.
 */
export function BendingBarbell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 120" fill="currentColor" aria-hidden="true" {...props}>
      {/* shaft — bows up in the middle under load, sleeves poke past the plates */}
      <path
        d="M16 60 Q128 46 240 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* collars, just inside the inner plates */}
      <rect x="84" y="47" width="7" height="26" rx="2.5" />
      <rect x="165" y="47" width="7" height="26" rx="2.5" />
      {/* left plate stack: inner tallest → outer shortest */}
      <rect x="66" y="26" width="15" height="68" rx="5" />
      <rect x="47" y="34" width="13" height="52" rx="4.5" />
      <rect x="31" y="41" width="11" height="38" rx="4" />
      {/* right plate stack (mirror) */}
      <rect x="175" y="26" width="15" height="68" rx="5" />
      <rect x="196" y="34" width="13" height="52" rx="4.5" />
      <rect x="214" y="41" width="11" height="38" rx="4" />
    </svg>
  );
}

/** Open book — the program reference. */
export function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 6.5C10.5 5.2 8.5 4.8 4 5v13c4.5-.2 6.5.2 8 1.5M12 6.5c1.5-1.3 3.5-1.7 8-1.5v13c-4.5-.2-6.5.2-8 1.5M12 6.5v13"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Rising trend line with an arrow head — exercise charts. */
export function TrendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 15l4.5-4.5 3 3L20 6M20 6h-4.5M20 6v4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Clock with a counter-clockwise arrow — archived workouts. */
export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V9h4.5M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Shared geometry + palette for the hand-rolled SVG progress charts. The charts
// are pure/dumb: they take an array of numbers and a colour, and draw. All of
// them work in a fixed 340×200 user-space viewBox and scale to width via CSS.

/** Theme colours, mirrored from tailwind.config.ts for use in raw SVG. */
export const C = {
  accent: '#FF5247',
  accentDeep: '#CA463B',
  blue: '#4C8DF0',
  green: '#41C277',
  yellow: '#F0BE4B',
  ink: '#F2F1EC',
  muted: '#9AA0A8',
  muted2: '#646A73',
  line: '#2A2E35',
  line2: '#363B43',
  surface2: '#1E2127',
} as const;

export const VIEW = { w: 340, h: 200 } as const;
export const PAD = { t: 26, r: 16, b: 28, l: 16 } as const;

export const innerW = VIEW.w - PAD.l - PAD.r;
export const innerH = VIEW.h - PAD.t - PAD.b;

export interface Pt {
  x: number;
  y: number;
  /** The plotted value. */
  v: number;
  /** Index in the series. */
  i: number;
}

export interface Plot {
  pts: Pt[];
  lo: number;
  hi: number;
}

/**
 * Map values to points in the chart's user space. A padded value range keeps
 * the line off the top and bottom edges; a flat series is centred.
 */
export function plot(values: number[]): Plot {
  const { lo, hi } = bounds(values);
  const range = hi - lo || 1;
  const n = values.length;

  const pts = values.map((v, i) => {
    const x = PAD.l + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = PAD.t + innerH * (1 - (v - lo) / range);
    return { x, y, v, i };
  });

  return { pts, lo, hi };
}

/** Catmull-Rom → cubic-bezier smooth path through the points. */
export function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Evenly spaced gridline values across [lo, hi], for light horizontal rules. */
export function gridLines(lo: number, hi: number, count = 3): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(lo + ((hi - lo) * i) / (count - 1));
  return out;
}

/** Padded [lo, hi] value range for a series — keeps the line off the edges. */
export function bounds(values: number[]): { lo: number; hi: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = span === 0 ? Math.max(1, Math.abs(max) * 0.1) : span * 0.18;
  return { lo: min - pad, hi: max + pad };
}

/** Trim trailing zeros from a fixed-1 number: 102.5 → "102.5", 100.0 → "100". */
export function fmt(v: number): string {
  return (Math.round(v * 10) / 10).toString();
}

/** First and last value of a series (both default to the single value when n=1). */
export function seriesEnds(values: number[]): { first: number; latest: number } {
  return { first: values[0], latest: values[values.length - 1] };
}

/** Props shared by every chart style. */
export interface ChartProps {
  /** The metric values, oldest → newest. */
  values: number[];
  /** Short date labels aligned to `values`. */
  labels: string[];
  /** Line/fill colour (hex). */
  color: string;
  /** Unit suffix for value labels, e.g. "kg". */
  unit: string;
}

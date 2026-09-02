/**
 * User-selectable brand colours. The app's `accent` (primary) and `secondary`
 * are driven by CSS variables (see index.css / tailwind.config.ts), so switching
 * a palette is just rewriting those variables — every `bg-accent`, `text-secondary`
 * etc. follows automatically.
 *
 * Values are "R G B" triples so Tailwind's `rgb(var(--x) / <alpha>)` opacity
 * modifiers keep working.
 */

export interface Swatch {
  label: string;
  /** Base colour as "R G B". */
  base: string;
  /** Darker variant for pressed/hover, as "R G B". */
  deep: string;
  /** A hex for rendering the picker chip. */
  hex: string;
  /** Far end of this colour's gradient sweep (hex), used by the gradient style. */
  gradEnd?: string;
  /** Render the picker chip as the gradient (for the gradient-first themes). */
  chip?: 'gradient';
  /** Secondary colour a gradient-first theme pairs itself with when picked. */
  partnerSecondary?: string;
}

export const PRIMARY: Record<string, Swatch> = {
  red: { label: 'Iron red', base: '255 82 71', deep: '202 70 59', hex: '#FF5247', gradEnd: '#FF9A3E' },
  orange: { label: 'Orange', base: '249 115 22', deep: '234 88 12', hex: '#F97316', gradEnd: '#FFC24B' },
  // playful gradient-first themes, each with a matching secondary
  sky: { label: 'Citrus sky', base: '56 189 248', deep: '14 165 233', hex: '#38BDF8', gradEnd: '#FDE047', chip: 'gradient', partnerSecondary: 'lemon' },
  miami: { label: 'Miami', base: '255 95 162', deep: '225 78 140', hex: '#FF5FA2', gradEnd: '#22D3EE', chip: 'gradient', partnerSecondary: 'cyan' },
};

/** How the primary colour fills surfaces: a flat colour or a gradient sweep. */
export type AccentStyle = 'solid' | 'gradient';

export const SECONDARY: Record<string, Swatch> = {
  teal: { label: 'Teal', base: '45 212 191', deep: '20 184 166', hex: '#2DD4BF' },
  blue: { label: 'Blue', base: '76 141 240', deep: '47 111 214', hex: '#4C8DF0' },
  lemon: { label: 'Lemon', base: '250 224 122', deep: '240 208 90', hex: '#FAE07A' },
  cyan: { label: 'Cyan', base: '34 211 238', deep: '6 182 212', hex: '#22D3EE' },
};

export type PrimaryKey = keyof typeof PRIMARY;
export type SecondaryKey = keyof typeof SECONDARY;

export interface ThemeChoice {
  primary: PrimaryKey;
  secondary: SecondaryKey;
  /** Flat colour (default) or a gradient sweep for primary fills. */
  accentStyle?: AccentStyle;
}

export const DEFAULT_THEME: ThemeChoice = { primary: 'red', secondary: 'teal', accentStyle: 'solid' };

/** The CSS gradient for a primary swatch (its hex → its warm far end). */
export function accentGradient(p: Swatch): string {
  return `linear-gradient(120deg, ${p.hex} 0%, ${p.gradEnd ?? p.hex} 100%)`;
}

/** Write the chosen palette onto the document root so the whole app re-tints. */
export function applyTheme(theme: ThemeChoice): void {
  if (typeof document === 'undefined') return;
  const p = PRIMARY[theme.primary] ?? PRIMARY.red;
  const s = SECONDARY[theme.secondary] ?? SECONDARY.teal;
  const el = document.documentElement;
  const root = el.style;
  root.setProperty('--accent', p.base);
  root.setProperty('--accent-deep', p.deep);
  root.setProperty('--secondary', s.base);
  root.setProperty('--secondary-deep', s.deep);
  // The gradient is painted over `bg-accent` fills only when the style is on
  // (see index.css). --accent itself stays solid so text/borders/rings match.
  root.setProperty('--accent-gradient', accentGradient(p));
  el.dataset.accentStyle = theme.accentStyle ?? 'solid';
}

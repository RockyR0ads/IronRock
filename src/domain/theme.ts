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
}

export const PRIMARY: Record<string, Swatch> = {
  red: { label: 'Iron red', base: '255 82 71', deep: '202 70 59', hex: '#FF5247' },
  orange: { label: 'Orange', base: '249 115 22', deep: '234 88 12', hex: '#F97316' },
};

export const SECONDARY: Record<string, Swatch> = {
  teal: { label: 'Teal', base: '45 212 191', deep: '20 184 166', hex: '#2DD4BF' },
  blue: { label: 'Blue', base: '76 141 240', deep: '47 111 214', hex: '#4C8DF0' },
};

export type PrimaryKey = keyof typeof PRIMARY;
export type SecondaryKey = keyof typeof SECONDARY;

export interface ThemeChoice {
  primary: PrimaryKey;
  secondary: SecondaryKey;
}

export const DEFAULT_THEME: ThemeChoice = { primary: 'red', secondary: 'teal' };

/** Write the chosen palette onto the document root so the whole app re-tints. */
export function applyTheme(theme: ThemeChoice): void {
  if (typeof document === 'undefined') return;
  const p = PRIMARY[theme.primary] ?? PRIMARY.red;
  const s = SECONDARY[theme.secondary] ?? SECONDARY.teal;
  const root = document.documentElement.style;
  root.setProperty('--accent', p.base);
  root.setProperty('--accent-deep', p.deep);
  root.setProperty('--secondary', s.base);
  root.setProperty('--secondary-deep', s.deep);
}

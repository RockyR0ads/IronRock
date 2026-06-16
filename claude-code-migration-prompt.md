# Claude Code prompt — migrate the RPE Load Sheet to Vite + React + TypeScript (PWA)

> **Before running:** create the repo folder and, if you have it, copy the existing `program.html` into the repo root so Claude Code can read it as the reference implementation. Then paste everything below into Claude Code.

---

You are migrating an existing single-file vanilla-JS web app into a modern **Vite + React + TypeScript** project, built **mobile-first** and installable as a **PWA**. If a file named `program.html` exists in the working directory, treat it as the authoritative reference for behavior, data, and visual design — match it exactly unless these instructions say otherwise. The spec below restates everything you need in case that file is absent.

## What the app is

A training-program load calculator for a Push/Pull/Legs lifting program run during a cut. The user enters one reference set per main lift (weight × reps × the RPE it felt like); the app estimates each lift's 1RM and prints the working load in kg for every set across a 6-day week. Isolation lifts are feel-based and just store a user-entered weight. The user can swap, add, and remove exercises per day. Everything persists locally and updates live.

## Tech stack & setup

- The app is called **IronRock**. Use this name everywhere user- or developer-facing: the `<title>`, the PWA manifest (`name: "IronRock"`, `short_name: "IronRock"`), the README header, the `package.json` `name` (use `ironrock` for the package field), and the in-app header (it can keep the "RPE Load Sheet" eyebrow/subtitle as a descriptor beneath the IronRock wordmark).
- Scaffold with Vite (`react-ts` template). Node LTS.
- **TypeScript in `strict` mode.** No `any` except at unavoidable library boundaries.
- React 18+ with function components and hooks.
- PWA via `vite-plugin-pwa` (Workbox): web manifest (`name`/`short_name` both **IronRock**, a `theme_color` of `#15171A` to match the dark UI, and placeholder app icons), service worker, offline support, installable to home screen.
- Vitest + React Testing Library for tests.
- ESLint + Prettier configured.
- Keep dependencies minimal — no UI component library, no state-management library. Use React state/context + a thin typed localStorage wrapper.
- **Tailwind CSS** for styling. Install and configure it the current recommended way for Vite + React. Put the project's palette, fonts, and any accent tokens in the Tailwind theme (`tailwind.config` `theme.extend`) and style components with utility classes — avoid one-off inline `style` props and avoid a parallel hand-written stylesheet except for genuinely global concerns (font imports, base resets, safe-area helpers, `prefers-reduced-motion`). Prefer composing repeated patterns with small components or `@apply` in the base layer rather than copy-pasting long class strings.
- Initialize git, add a sensible `.gitignore` (node_modules, dist, etc.) and a short `README.md` titled **IronRock** with a one-line description and run/build/test instructions.

## Project structure (aim for this shape)

```
src/
  domain/            # pure, framework-agnostic logic — no React imports
    rpe.ts           # %1RM table + interpolation
    calc.ts          # estimate1Rm, targetLoad, rounding
    lifts.ts         # LIFTS catalogue + category metadata
    program.ts       # DAYS template + block types
    types.ts         # shared types
    *.test.ts        # Vitest unit tests for the above
  state/
    store.ts         # state shape, reducer/actions, localStorage sync
  components/
    ReferenceLifts/
    DayView/
    ExercisePicker/  # the swap/add bottom sheet
    common/
  index.css          # Tailwind directives + minimal base layer (fonts, resets, safe-area helpers)
  App.tsx
  main.tsx
tailwind.config.ts   # palette, fonts, accent tokens in theme.extend
```

Keep `domain/` UI-agnostic so it can be reused (e.g. if a React Native head is added later). All math lives there and is unit-tested independently of any component.

## Domain logic (port exactly)

**%1RM table**, keyed by *reps-to-failure* (rtf):

```
0:1.000, 1:0.955, 2:0.922, 3:0.892, 4:0.892, 5:0.863, 6:0.837,
7:0.811, 8:0.786, 9:0.762, 10:0.739, 11:0.717, 12:0.694,
13:0.673, 14:0.653, 15:0.634
```

`pctFor(rtf)`: clamp `rtf <= 0` to 1.0; clamp `rtf >= 15` to 0.634; otherwise **linear-interpolate** between the two nearest integer entries.

Core formulas:
- `repsToFailure = reps + (10 - rpe)`
- `estimate1Rm(weight, reps, rpe) = weight / pctFor(reps + (10 - rpe))` — return `null` if any input is missing or ≤ 0.
- `midReps(reps)` = the value itself for a fixed number, or the midpoint for a `[lo, hi]` range.
- `targetLoad(e1rm, midReps, rpe, increment) = round(e1rm * pctFor(midReps + (10 - rpe)) / increment) * increment`
- Rounding increment is user-selectable: **1.0 / 2.5 / 5.0 kg** (default 2.5).

## Data model

**Lift** — `{ id, name, type: 'computed' | 'manual', unit: string, cats: Category[], uni?: boolean }`.
- `computed` lifts need a reference set and get a calculated load.
- `manual` lifts (isolation, RPE 9–10) just store a user-entered weight.
- `uni` = unilateral (per-leg).
- `cats` are movement roles, used to filter the swap picker.

**Categories:** `hpress, vpress, hpull, vpull, squat, hinge, uni, latdelt, reardelt, biceps, triceps, calf` — with display names (Horizontal press, Vertical press, Horizontal pull, Vertical pull, Squat, Hinge, Single-leg, Lateral delt, Rear delt, Biceps, Triceps, Calves).

**Block** (one exercise slot in a day) — `{ lift: liftId, sets: number, reps: number | [number, number], rpe: number | string, cls: 'r-hi' | 'r-mid' | 'r-iso', cat: Category, perLeg?: boolean, drift?: boolean }`.
- `rpe` may be a string like `"9–10"` for feel-based ranges; numeric rpe drives the math, string rpe is display-only (those slots are always `manual` lifts).
- `drift: true` renders the RPE as `"7→8"`.
- `cls` sets the left-border accent color (heavy / volume / isolation).

**Day** — `{ key, label, variant, note, blocks: Block[] }`.

> Reproduce the full LIFTS catalogue and all six DAYS exactly as they appear in `program.html`. If that file is unavailable, ask me to paste the `LIFTS` and `DAYS` objects rather than inventing exercises. The six days are: Push A (heavy), Pull A (heavy), Legs A (strength), Push B (volume), Pull B (volume), Legs B (strength).

## Features (must reach parity)

1. **Reference lifts section** — one card per *computed lift that is currently used in the program*. Each card has weight / reps / RPE inputs and shows live estimated 1RM. Cards are derived from lifts-in-use (first-use order across all days), so swapping in a new computed lift makes a new card appear, and removing the last use of one makes it disappear. Reference values themselves persist regardless.
2. **Day switcher** — six days. On mobile this is a **bottom-anchored, thumb-reachable nav**, not top tabs.
3. **Day view** — each block shows lift name, scheme (`sets × reps @ RPE`, with `/leg` for unilateral and the `7→8` / `9–10` display rules), and either the computed load (large tabular-numeral kg + unit) or, for manual lifts, a numeric input. If a computed lift has no reference yet, show an "enter ref" prompt instead of a number.
4. **Exercise picker** — each block has **swap** and **remove**; each day has **+ Add exercise**.
   - *Swap* opens a picker filtered to that block's category (same movement role); current lift is marked. Swapping preserves the slot's sets/reps/RPE and updates `perLeg` from the new lift.
   - *Add* opens a picker grouped by all categories; adds a block with a sensible default scheme (computed → 3×8–10 @ RPE 8 `r-hi`; manual → 3×12 @ RPE 9 `r-iso`).
   - On mobile the picker is a **full-height bottom sheet**, not a centered modal. Closeable by backdrop tap, a close button, and Escape.
   - Editing a day creates a per-day override; show a **"restore default"** affordance that reverts that day.
5. **Global controls** — bodyweight field, rounding selector (1/2.5/5), and **Clear all** (resets reference values, manual weights, and day overrides after a confirm).
6. **Persistence** — all state (reference sets, manual weights, per-day overrides, bodyweight, rounding, active day) saved to `localStorage` under a versioned key, restored on load, wrapped in try/catch so failure degrades to in-memory.
7. **Reference panels** — keep the two collapsible explainer sections ("How the loads are calculated" incl. the RPE/%1RM table, and "Running it on a cut").

## Mobile-first requirements

- Design and lay out for a ~380px phone viewport first; enhance upward.
- Touch targets ≥ 44px. No hover-only affordances.
- Numeric inputs use `inputmode="decimal"` / `"numeric"` so the number keypad opens; avoid spinner clutter.
- Respect safe-area insets (`env(safe-area-inset-*)`) for the bottom nav and sheet.
- Bottom-sheet picker; bottom day nav; large, glanceable load numbers.
- Honor `prefers-reduced-motion`. Visible keyboard focus states throughout.

## Design system (match the existing look)

Dark, industrial, weight-plate-inspired. Define the palette, fonts, and accents in the Tailwind theme and consume them as utility classes (`bg-bg`, `text-ink`, `border-line`, `text-red`, etc.) rather than raw hex or CSS variables in components.

```ts
// tailwind.config.ts — theme.extend
colors: {
  bg:'#15171A', surface:'#1E2126', 'surface-2':'#262A30', line:'#33383F',
  ink:'#EAE8E3', muted:'#8C9098', 'muted-2':'#5E636B',
  red:'#CA463B',   // 25kg plate
  blue:'#2F6DB5',  // 20kg plate
  yellow:'#E0B23C',// 15kg plate
  green:'#3C9457', // 10kg plate
},
fontFamily: {
  display: ['Archivo', 'sans-serif'],   // 700/900, uppercase, condensed feel — the hero
  body:    ['Inter', 'system-ui', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'], // data / numerals, tabular
},
```

Block left-border accent encodes intensity — map the `cls` value to a Tailwind border color: `r-hi` → `border-l-red` (heavy compound), `r-mid` → `border-l-blue` (volume lead, RPE 7), `r-iso` → `border-l-yellow` (isolation, RPE 9–10). Implement this as a lookup from `cls` to a class name, not inline styles.

The kg loads are the visual hero — large `font-mono` tabular numerals with `tabular-nums`. Keep the small barbell SVG motif in the header. Load the three fonts via the base layer / index.html.

## Acceptance criteria

- `npm install && npm run dev` runs the app; `npm run build` succeeds with **no type errors** under strict mode.
- `npm run test` passes, including unit tests that verify `pctFor` interpolation/clamping, `estimate1Rm`, and `targetLoad` against hand-checked values (e.g. 100kg × 5 @ RPE 8 → e1RM ≈ 123kg; the Push A bench 4×5 @ RPE 8 target ≈ 100kg).
- The built app is an installable PWA (valid manifest + service worker) and works offline after first load.
- Full feature parity with the spec above on a phone-sized viewport.

## Working style

Work in vertical slices and keep the app runnable at each step: scaffold + config first, then `domain/` with its tests, then state, then components (Reference lifts → Day view → Picker), then PWA + polish. After each slice, run the build and tests. Don't pull in extra dependencies without flagging why. If anything in the spec is ambiguous or the reference file is missing data, ask before inventing it.

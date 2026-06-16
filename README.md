# IronRock

**RPE Load Sheet** — a mobile-first, installable PWA that turns one honest reference set per main lift into working loads (in kg) for every set across a 6-day Push/Pull/Legs week. Built for running a cut: hold the line, don't chase PRs.

Built with Vite + React + TypeScript + Tailwind CSS. All data persists locally in the browser; no account, no internet needed once loaded.

## Run

```bash
npm install
npm run dev      # start the dev server
```

## Build

```bash
npm run build    # type-check (strict) + production build
npm run preview  # preview the production build (installable PWA)
```

## Test

```bash
npm run test         # run unit tests once
npm run test:watch   # watch mode
```

## How it works

Each reference set (weight × reps × the RPE it felt like) is converted to an estimated 1RM using a reps-to-failure → %1RM model (`reps left = 10 − RPE`). Every programmed set's load is then computed back off that estimate, rounded to your chosen increment (1 / 2.5 / 5 kg). Isolation lifts are feel-based and just store a weight you enter. Swap, add, and remove exercises per day; per-day edits can be reverted to the default program.

The pure calculation logic lives in `src/domain/` with no React dependencies, unit-tested independently in case a native head is added later.

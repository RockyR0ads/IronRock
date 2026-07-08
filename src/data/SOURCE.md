# Exercise data

`exercises.json` is a slimmed copy of the **free-exercise-db**
(https://github.com/yuhonas/free-exercise-db), released into the public domain
under the Unlicense. Each record keeps `id`, `name`, `equipment`, `muscles`
(primary), `images` (start/finish photo paths), and step-by-step `instructions`.

Photos are loaded at runtime from the jsDelivr mirror of that repo; only the
metadata above is bundled, so search and descriptions work offline.

Regenerate with the one-liner in the repo history (fetches `dist/exercises.json`
and drops unused fields).

## Hand-drawn illustrations (optional)

`sketches.json` maps exercise id → number of illustration frames available at
`public/sketches/<id>/<frame>.webp`; the exercise detail auto-flips those in
place of the photos (photo fallback otherwise). Generate them with:

```
GEMINI_API_KEY=... node scripts/gen-sketches.mjs          # common-lift subset
GEMINI_API_KEY=... node scripts/gen-sketches.mjs --all    # whole library
```

Output is resized + WebP-compressed automatically. If you hand-drop PNGs
instead, run `node scripts/compress-sketches.mjs` to convert them to WebP.
The generator is resumable (skips frames already present). Commit
`public/sketches/` and `sketches.json` to ship the results.

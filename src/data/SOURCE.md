# Exercise data

`exercises.json` is a slimmed copy of the **free-exercise-db**
(https://github.com/yuhonas/free-exercise-db), released into the public domain
under the Unlicense. Each record keeps `id`, `name`, `equipment`, `muscles`
(primary), `images` (start/finish photo paths), and step-by-step `instructions`.

Photos are loaded at runtime from the jsDelivr mirror of that repo; only the
metadata above is bundled, so search and descriptions work offline.

Regenerate with the one-liner in the repo history (fetches `dist/exercises.json`
and drops unused fields).

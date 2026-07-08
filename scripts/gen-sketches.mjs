// Batch-generate hand-drawn ink illustrations for exercises using Google's
// Gemini image model, from the free-exercise-db source photos.
//
// Usage:
//   GEMINI_API_KEY=xxxxx node scripts/gen-sketches.mjs
//   GEMINI_API_KEY=xxxxx node scripts/gen-sketches.mjs --all      # whole library
//   GEMINI_API_KEY=xxxxx node scripts/gen-sketches.mjs --limit=20
//
// - Skips exercises that already have a sketch (safe to re-run / resume).
// - Writes PNGs to public/sketches/<id>.png and updates src/data/sketches.json.
//
// Model note: uses `gemini-2.5-flash-image` ("Nano Banana"). If that id isn't
// available on your key, change MODEL below (e.g. a -preview/-latest variant).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'sketches');
const MANIFEST = join(ROOT, 'src', 'data', 'sketches.json');
const EXERCISES = join(ROOT, 'src', 'data', 'exercises.json');

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CDN = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
const THROTTLE_MS = 1500;

const PROMPT = [
  'Redraw this exact photo as a detailed black-and-white pen-and-ink illustration',
  'in a vintage engraving / anatomy-sketchbook style: confident clean ink outlines',
  'with fine cross-hatching for shading, on off-white cream paper, monochrome (no colour),',
  'plain light background. Keep the pose, body proportions, gym equipment, barbell and',
  'weight plates faithful to the photo. No text, no watermark.',
].join(' ');

// Common compound / accessory lifts to seed the subset (matched by name).
const KEYWORDS = [
  'bench press', 'incline bench', 'squat', 'front squat', 'deadlift', 'romanian deadlift',
  'overhead press', 'military press', 'push press', 'barbell row', 'pendlay', 'bent over row',
  'pull-up', 'chin-up', 'lat pulldown', 'dip', 'lunge', 'bulgarian', 'leg press', 'leg curl',
  'leg extension', 'calf raise', 'bicep curl', 'hammer curl', 'preacher curl', 'triceps',
  'skullcrusher', 'lateral raise', 'rear delt', 'face pull', 'shrug', 'hip thrust', 'good morning',
  'plank', 'pushups', 'push-up',
];

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('Set GEMINI_API_KEY in your environment.');
  process.exit(1);
}

const library = JSON.parse(readFileSync(EXERCISES, 'utf8'));
const byId = new Map(library.map((e) => [e.id, e]));

function pickSubset() {
  if (ALL) return library.map((e) => e.id);
  const ids = new Set();
  for (const kw of KEYWORDS) {
    const hit = library.find((e) => e.name.toLowerCase().includes(kw) && e.images?.length);
    if (hit) ids.add(hit.id);
  }
  return [...ids];
}

async function toBase64(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} → ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString('base64');
}

async function generateFrame(imagePath) {
  const srcB64 = await toBase64(CDN + imagePath);
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: srcB64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const r = await fetch(`${ENDPOINT}?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const data = await r.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData || p.inline_data);
  const b64 = (img?.inlineData || img?.inline_data)?.data;
  if (!b64) throw new Error('no image in response');
  return Buffer.from(b64, 'base64');
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const subset = pickSubset().slice(0, LIMIT);
  console.log(`Subset: ${subset.length} exercises`);

  let made = 0;
  for (const id of subset) {
    const ex = byId.get(id);
    if (!ex?.images?.length) continue;
    const dir = join(OUT_DIR, id);
    mkdirSync(dir, { recursive: true });
    // one illustration per source photo (start / finish), up to 2 frames
    const frames = ex.images.slice(0, 2);
    let count = 0;
    for (let i = 0; i < frames.length; i++) {
      const out = join(dir, `${i}.webp`);
      if (existsSync(out)) {
        count = i + 1;
        continue;
      }
      try {
        process.stdout.write(`• ${id} [${i}] … `);
        const png = await generateFrame(frames[i]);
        await sharp(png).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
        count = i + 1;
        made++;
        console.log('ok');
      } catch (e) {
        console.log('FAILED', e.message);
      }
      await sleep(THROTTLE_MS);
    }
    if (count > 0) {
      manifest[id] = count;
      writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    }
  }
  console.log(`\nGenerated ${made} new frames. Manifest: ${Object.keys(manifest).length} exercises.`);
  console.log('Commit public/sketches/ and src/data/sketches.json to ship them.');
}

main();

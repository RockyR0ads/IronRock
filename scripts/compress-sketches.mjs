// Convert any PNG illustrations under public/sketches/ to resized WebP, which is
// far smaller for detailed drawings. Deletes the original PNG.
//
//   node scripts/compress-sketches.mjs

import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sketches');
const MAX_WIDTH = 900;
const QUALITY = 80;

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (name.endsWith('.png')) out.push(p);
  }
  return out;
}

const pngs = collect(DIR);
if (pngs.length === 0) {
  console.log('No PNGs to compress.');
  process.exit(0);
}

let saved = 0;
for (const p of pngs) {
  const out = p.replace(/\.png$/, '.webp');
  const before = statSync(p).size;
  await sharp(p).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
  unlinkSync(p);
  const after = statSync(out).size;
  saved += before - after;
  console.log(`${p.replace(DIR, '')}  ${(before / 1024) | 0}KB → ${(after / 1024) | 0}KB`);
}
console.log(`\nDone. Saved ${(saved / 1024 / 1024).toFixed(1)} MB across ${pngs.length} images.`);

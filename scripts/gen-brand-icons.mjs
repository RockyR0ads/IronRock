// Generates every IronRock brand raster asset from the plate mark:
// Android adaptive/legacy launcher icons, PWA icons, apple-touch, favicon, splash.
//
// The plate carries curved cast text ("IRONROCK" + tagline), which librsvg (what
// sharp uses) does NOT render. So the text plate is pre-rasterised in a real
// browser to scripts/plate-master.png (512, transparent) — see the /design work.
// This script just composites/sizes that master. Regenerate the master if the
// plate art changes. Run: node scripts/gen-brand-icons.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const RES = 'android/app/src/main/res';
const MASTER = 'scripts/plate-master.png'; // 512×512 transparent plate WITH text
const GRAPHITE = '#17191E';
const SPLASH_BG = '#0E0F12';

if (!existsSync(MASTER)) {
  console.error(`missing ${MASTER} — rasterise the text plate in a browser first.`);
  process.exit(1);
}

/** A clean, text-free vector plate (for the tiny favicon, where text can't read). */
function cleanPlateSvg(size) {
  const k = (size * 0.82) / 128;
  const off = (size - size * 0.82) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${GRAPHITE}"/>
    <g transform="translate(${off} ${off}) scale(${k})">
      <defs>
        <radialGradient id="r" cx="38%" cy="30%" r="82%"><stop offset="0%" stop-color="#FF7A6E"/><stop offset="46%" stop-color="#FF5247"/><stop offset="100%" stop-color="#A83E33"/></radialGradient>
        <radialGradient id="h" cx="40%" cy="33%" r="74%"><stop offset="0%" stop-color="#D7DCE3"/><stop offset="100%" stop-color="#7B828C"/></radialGradient>
      </defs>
      <circle cx="64" cy="64" r="57" fill="url(#r)" stroke="#8A342B" stroke-width="1.5"/>
      <ellipse cx="49" cy="41" rx="29" ry="15" fill="#ffffff" fill-opacity="0.22"/>
      <circle cx="64" cy="64" r="50" fill="none" stroke="#3C120E" stroke-opacity="0.30" stroke-width="2"/>
      <circle cx="64" cy="64" r="33" fill="none" stroke="#280A08" stroke-opacity="0.28" stroke-width="1"/>
      <circle cx="64" cy="64" r="21" fill="url(#h)" stroke="#8A342B" stroke-width="1"/>
      <circle cx="64" cy="64" r="8.5" fill="#141619"/>
    </g>
  </svg>`;
}

/** A background layer of `size`, filled per shape (or transparent when bg is null). */
function bgLayer(size, bg, shape) {
  if (!bg) return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  if (shape === 'circle')
    return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bg}"/></svg>`));
  if (shape === 'rounded')
    return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/></svg>`));
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } });
}

/** Composite the plate master (scaled) centred on a background → PNG file. */
async function icon(size, out, { bg = null, shape = 'square', scale = 0.82 } = {}) {
  const d = Math.round(size * scale);
  const plate = await sharp(MASTER).resize(d, d).png().toBuffer();
  await bgLayer(size, bg, shape).composite([{ input: plate, gravity: 'center' }]).png().toFile(out);
}

async function run() {
  // --- Android launcher -----------------------------------------------------
  await writeFile(
    `${RES}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${GRAPHITE}</color>\n</resources>\n`,
  );
  const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const foreground = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
  for (const [d, s] of Object.entries(legacy)) {
    const dir = `${RES}/mipmap-${d}`;
    await icon(s, `${dir}/ic_launcher.png`, { bg: GRAPHITE, shape: 'square', scale: 0.82 });
    await icon(s, `${dir}/ic_launcher_round.png`, { bg: GRAPHITE, shape: 'circle', scale: 0.82 });
    await icon(foreground[d], `${dir}/ic_launcher_foreground.png`, { scale: 0.6 }); // transparent, safe zone
  }

  // --- PWA / web ------------------------------------------------------------
  await icon(192, 'public/pwa-192x192.png', { bg: GRAPHITE, shape: 'square', scale: 0.82 });
  await icon(512, 'public/pwa-512x512.png', { bg: GRAPHITE, shape: 'square', scale: 0.82 });
  await icon(180, 'public/apple-touch-icon.png', { bg: GRAPHITE, shape: 'rounded', scale: 0.82 });
  await writeFile('public/favicon.svg', cleanPlateSvg(64) + '\n');

  // --- Splash ---------------------------------------------------------------
  const splashDirs = ['drawable', 'drawable-land-hdpi', 'drawable-land-mdpi', 'drawable-land-xhdpi',
    'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-hdpi', 'drawable-port-mdpi',
    'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi'];
  for (const d of splashDirs) {
    const f = `${RES}/${d}/splash.png`;
    if (!existsSync(f)) continue;
    const { width: w, height: h } = await sharp(f).metadata();
    const plateSize = Math.round(Math.min(w, h) * 0.34);
    const plate = await sharp(MASTER).resize(plateSize, plateSize).png().toBuffer();
    await sharp({ create: { width: w, height: h, channels: 4, background: SPLASH_BG } })
      .composite([{ input: plate, gravity: 'center' }])
      .png()
      .toFile(f);
  }

  console.log('brand icons generated (text plate).');
}

run().catch((e) => { console.error(e); process.exit(1); });

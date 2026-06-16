// Generates placeholder PWA PNG icons with no external dependencies.
// Draws the IronRock barbell motif: dark plate with a red/blue loaded bar.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

const COLORS = {
  bg: [0x15, 0x17, 0x1a],
  bar: [0x33, 0x38, 0x3f],
  red: [0xca, 0x46, 0x3b],
  blue: [0x2f, 0x6d, 0xb5],
};

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const px = (x, y) => {
    const cx = size / 2;
    const cy = size / 2;
    const barH = size * 0.09;
    const within = Math.abs(y - cy) < barH / 2;
    // bar runs horizontally across the middle
    if (within && x > size * 0.12 && x < size * 0.88) return COLORS.bar;
    // plates
    const plateH = size * 0.32;
    const plateWithin = Math.abs(y - cy) < plateH / 2;
    if (plateWithin) {
      if ((x > size * 0.2 && x < size * 0.27) || (x > size * 0.73 && x < size * 0.8))
        return COLORS.red;
      if ((x > size * 0.3 && x < size * 0.36) || (x > size * 0.64 && x < size * 0.7))
        return COLORS.blue;
    }
    return COLORS.bg;
  };

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x, y);
      const o = y * stride + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = 0xff;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(OUT, name), png(size));
  console.log('wrote', name);
}

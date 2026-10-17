#!/usr/bin/env node
/**
 * Raster favicons from app/icon.svg (the single source of the icon).
 *
 *   node scripts/generate-icons.mjs        # or: npm run icons
 *
 * Writes, for Next.js's metadata file conventions:
 *   app/favicon.ico     16, 32 and 48 px (BMP entries, readable by every crawler and browser)
 *   app/icon1.png       96 x 96, a multiple of 48 px as Google asks for search results
 *   app/apple-icon.png  180 x 180, full-bleed square (iOS rounds the corners itself and
 *                       would fill transparent corners with black)
 *
 * Search engines differ: Google shows the SVG, Bing only picked up raster icons.
 * Re-run after changing app/icon.svg; lib/seo/icons.test.ts checks the outputs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVG = readFileSync(path.join(ROOT, 'app/icon.svg'), 'utf8');
const VIEWBOX = 32;

/** Rasterise at twice the target resolution, then downsample for clean anti-aliasing. */
function render(svg, size) {
  const density = Math.ceil((72 * size * 2) / VIEWBOX);
  return sharp(Buffer.from(svg), { density }).resize(size, size, { kernel: 'lanczos3' });
}

/** One ICO image entry as a 32-bit BMP (DIB): BITMAPINFOHEADER, bottom-up BGRA rows, AND mask. */
async function bmpEntry(size) {
  const { data } = await render(SVG, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const maskRow = Math.ceil(size / 32) * 4;
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight: colour + mask
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount
  header.writeUInt32LE(0, 16); // BI_RGB
  header.writeUInt32LE(size * size * 4 + maskRow * size, 20); // biSizeImage
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const src = (y * size + x) * 4;
      const dst = ((size - 1 - y) * size + x) * 4; // bottom-up
      pixels[dst] = data[src + 2];
      pixels[dst + 1] = data[src + 1];
      pixels[dst + 2] = data[src];
      pixels[dst + 3] = data[src + 3];
    }
  }
  const mask = Buffer.alloc(maskRow * size); // all zero: alpha channel carries transparency
  return Buffer.concat([header, pixels, mask]);
}

async function ico(sizes) {
  const images = await Promise.all(sizes.map(bmpEntry));
  const dir = Buffer.alloc(6 + 16 * sizes.length);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(sizes.length, 4);
  let offset = dir.length;
  sizes.forEach((size, i) => {
    const e = 6 + 16 * i;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt8(0, e + 2); // palette colours
    dir.writeUInt8(0, e + 3);
    dir.writeUInt16LE(1, e + 4); // planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(images[i].length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  return Buffer.concat([dir, ...images]);
}

const fullBleed = SVG.replace(/\srx="[^"]*"/, '');

const outputs = [
  ['app/favicon.ico', await ico([16, 32, 48])],
  ['app/icon1.png', await render(SVG, 96).png({ compressionLevel: 9 }).toBuffer()],
  ['app/apple-icon.png', await render(fullBleed, 180).flatten({ background: '#2563EB' }).png({ compressionLevel: 9 }).toBuffer()],
];
for (const [file, buffer] of outputs) {
  writeFileSync(path.join(ROOT, file), buffer);
  console.log(`${file.padEnd(20)} ${buffer.length} bytes`);
}

import { readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const app = (file: string) => path.resolve(__dirname, '../../app', file);
const BRAND_BLUE = { r: 0x25, g: 0x63, b: 0xeb };

/** Share of opaque pixels close to the brand blue: proves the raster is the real icon, not a blank. */
async function blueShare(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let blue = 0;
  let opaque = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3]! < 128) continue;
    opaque += 1;
    if (Math.abs(data[i]! - BRAND_BLUE.r) < 30 && Math.abs(data[i + 1]! - BRAND_BLUE.g) < 30 && Math.abs(data[i + 2]! - BRAND_BLUE.b) < 30) blue += 1;
  }
  return opaque ? blue / opaque : 0;
}

describe('raster favicons generated from app/icon.svg', () => {
  it('favicon.ico holds 16, 32 and 48 px 32-bit images', () => {
    const ico = readFileSync(app('favicon.ico'));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + 16 * i));
    expect(sizes).toEqual([16, 32, 48]);
    for (let i = 0; i < count; i += 1) {
      const entry = 6 + 16 * i;
      expect(ico.readUInt16LE(entry + 6)).toBe(32);
      const offset = ico.readUInt32LE(entry + 12);
      const length = ico.readUInt32LE(entry + 8);
      expect(offset + length).toBeLessThanOrEqual(ico.length);
      expect(ico.readUInt32LE(offset)).toBe(40); // BITMAPINFOHEADER
      expect(ico.readInt32LE(offset + 4)).toBe(sizes[i]);
    }
  });

  it('icon1.png is 96 px and apple-icon.png is a full-bleed 180 px square, both in the brand blue', async () => {
    const png96 = readFileSync(app('icon1.png'));
    const apple = readFileSync(app('apple-icon.png'));
    expect(await sharp(png96).metadata()).toMatchObject({ format: 'png', width: 96, height: 96 });
    expect(await sharp(apple).metadata()).toMatchObject({ format: 'png', width: 180, height: 180 });
    expect(await blueShare(png96)).toBeGreaterThan(0.6);
    expect(await blueShare(apple)).toBeGreaterThan(0.6);
    // No transparent corners on the Apple icon (iOS would fill them with black).
    const { data } = await sharp(apple).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(255);
  });
});

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CITY_IMAGES } from '@/data/city-images.generated';
import { CITIES, CITY_IMAGE_SIZES, POPULAR_CITY_SLUGS } from '@/data/cities';

const PUBLIC = path.resolve(__dirname, '../../public');
const FREE_LICENCE = /^(CC0|Public domain|CC BY(-SA)? \d(\.\d)?)/i;
const entries = Object.entries(CITY_IMAGES);

describe('curated city images', () => {
  it('only reference dataset cities, and every entry is complete', () => {
    const slugs = new Set(CITIES.map((c) => c.slug));
    expect(entries.length).toBeGreaterThan(0);
    for (const [slug, image] of entries) {
      expect(slugs.has(slug), `${slug} is not a dataset city`).toBe(true);
      expect(image.src).toBe(`/cities/${slug}.webp`);
      expect(image.cardSrc).toBe(`/cities/${slug}-card.webp`);
      expect(image.alt.length, `${slug} alt`).toBeGreaterThan(3);
      expect(image.author.length, `${slug} author`).toBeGreaterThan(0);
      expect(image.sourceUrl, `${slug} source`).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File/);
    }
  });

  it('uses only free licences that allow reuse with attribution', () => {
    for (const [slug, image] of entries) {
      expect(image.license, `${slug}: ${image.license}`).toMatch(FREE_LICENCE);
      if (!/^(CC0|Public domain)/i.test(image.license)) expect(image.licenseUrl, `${slug} licence URL`).toMatch(/^https?:\/\//);
    }
  });

  it('ships both crops at the declared sizes', async () => {
    for (const [slug, image] of entries) {
      for (const [file, size] of [
        [image.src, CITY_IMAGE_SIZES.hero],
        [image.cardSrc, CITY_IMAGE_SIZES.card],
      ] as const) {
        const abs = path.join(PUBLIC, file);
        expect(existsSync(abs), `${slug}: ${file} missing`).toBe(true);
        const meta = await sharp(readFileSync(abs)).metadata();
        expect({ format: meta.format, width: meta.width, height: meta.height }, `${slug}: ${file}`).toEqual({ format: 'webp', ...size });
        expect(readFileSync(abs).byteLength, `${slug}: ${file} too large`).toBeLessThan(260 * 1024);
      }
    }
  });

  it('attaches images to city records and covers every homepage city', () => {
    for (const [slug, image] of entries) expect(CITIES.find((c) => c.slug === slug)?.image).toEqual(image);
    for (const slug of POPULAR_CITY_SLUGS) expect(CITY_IMAGES[slug], `${slug} has no photo`).toBeDefined();
    expect(CITIES.filter((c) => c.image).length).toBe(entries.length);
  });
});

#!/usr/bin/env node
/**
 * Curated city photos from Wikimedia Commons (Sprint 6 follow-up).
 *
 * Reads data/sources/city-images.json (which cities, optional per-city file
 * override, alt text and crop position), resolves each city's main image on Wikidata
 * (GeoNames id → P1566 → P18), reads the file's licence and author from the
 * Commons API, keeps only free licences (CC0, public domain, CC BY, CC BY-SA),
 * downloads the file and writes two crops:
 *
 *   public/cities/<slug>.webp        1600×400  city page hero
 *   public/cities/<slug>-card.webp    640×256  city cards
 *
 * and the manifest data/city-images.generated.ts (src, alt, author, licence,
 * source page). Nothing is fetched at runtime; the site serves these files.
 *
 *   node scripts/fetch-city-images.mjs                 # all cities in the source list
 *   node scripts/fetch-city-images.mjs --only london   # one city (comma-separated slugs)
 *   node scripts/fetch-city-images.mjs --contact out.jpg  # also write a review sheet
 *   node scripts/fetch-city-images.mjs --refresh       # re-download files that already exist
 *
 * Needs network access and the `sharp` package (installed with Next.js).
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'data/sources/city-images.json');
const CITIES_FILE = path.join(ROOT, 'data/cities.generated.ts');
const OUT_DIR = path.join(ROOT, 'public/cities');
const MANIFEST = path.join(ROOT, 'data/city-images.generated.ts');
const USER_AGENT = 'TimeNow/1.0 (https://github.com/AnkitAgCreates/timenow; city image fetch script)';

export const HERO = { width: 1600, height: 400 };
export const CARD = { width: 640, height: 256 };

/** Commons licence codes we accept (extmetadata.License). */
const FREE_LICENCE = /^(cc0|pd|cc-by(-sa)?(-\d(\.\d)?)?)(-|$)/i;

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const only = flag('--only')?.split(',').map((s) => s.trim()).filter(Boolean);
const contactSheet = flag('--contact');
/** Re-download and re-crop files that already exist (default: reuse them, refresh only the manifest). */
const refresh = args.includes('--refresh');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  await sleep(400); // stay well under the Commons API rate limit
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Download with retries; a truncated transfer fails later in sharp, so verify the length when known. */
async function getBytes(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const expected = Number(res.headers.get('content-length') ?? bytes.length);
      if (bytes.length !== expected) throw new Error(`truncated download (${bytes.length} of ${expected} bytes) for ${url}`);
      return bytes;
    } catch (error) {
      lastError = error;
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

/** Minimal parse of the generated city list (one object literal per line). */
async function loadCities() {
  const text = await readFile(CITIES_FILE, 'utf8');
  const cities = new Map();
  for (const line of text.split('\n')) {
    const slug = line.match(/\bslug: "([^"]+)"/)?.[1];
    if (!slug) continue;
    cities.set(slug, {
      slug,
      name: line.match(/\bname: "([^"]+)"/)?.[1] ?? slug,
      country: line.match(/\bcountry: "([^"]+)"/)?.[1] ?? '',
      geonameId: line.match(/\bgeonameId: (\d+)/)?.[1],
    });
  }
  return cities;
}

/** GeoNames id → Commons file title via Wikidata (P1566 → P18). */
async function wikidataImages(geonameIds) {
  const out = new Map();
  for (let i = 0; i < geonameIds.length; i += 50) {
    const chunk = geonameIds.slice(i, i + 50);
    const query = `SELECT ?geo ?image WHERE { VALUES ?geo { ${chunk.map((id) => `"${id}"`).join(' ')} } ?item wdt:P1566 ?geo . ?item wdt:P18 ?image }`;
    const json = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`);
    for (const row of json.results.bindings) {
      const file = decodeURIComponent(row.image.value.replace(/^.*\/Special:FilePath\//, '')).replace(/_/g, ' ');
      if (!out.has(row.geo.value)) out.set(row.geo.value, `File:${file}`);
    }
  }
  return out;
}

const stripHtml = (html) => (html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Licence, author and a download URL for one Commons file. */
async function commonsInfo(title) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=2000&titles=${encodeURIComponent(title)}`;
  const json = await getJson(url);
  const page = Object.values(json.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`No imageinfo for ${title}`);
  const meta = info.extmetadata ?? {};
  const licenceCode = meta.License?.value ?? '';
  return {
    title: page.title,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
    downloadUrl: info.thumburl ?? info.url,
    width: info.width,
    height: info.height,
    mime: info.mime,
    licenceCode,
    licence: stripHtml(meta.LicenseShortName?.value) || licenceCode,
    licenceUrl: meta.LicenseUrl?.value ?? '',
    author: stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || 'Wikimedia Commons contributor',
    description: stripHtml(meta.ImageDescription?.value),
  };
}

async function main() {
  const source = JSON.parse(await readFile(SOURCE, 'utf8'));
  const cities = await loadCities();
  const wanted = source.cities.filter((entry) => !only || only.includes(entry.slug));
  const missing = wanted.filter((entry) => !cities.has(entry.slug)).map((entry) => entry.slug);
  if (missing.length) throw new Error(`Unknown city slugs in ${path.relative(ROOT, SOURCE)}: ${missing.join(', ')}`);

  const needLookup = wanted.filter((entry) => !entry.file).map((entry) => cities.get(entry.slug).geonameId).filter(Boolean);
  const fromWikidata = needLookup.length ? await wikidataImages(needLookup) : new Map();

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = [];
  const skipped = [];
  const thumbs = [];

  for (const entry of wanted) {
    const city = cities.get(entry.slug);
    const title = entry.file ?? fromWikidata.get(city.geonameId);
    if (!title) {
      skipped.push(`${city.slug}: no image on Wikidata (add "file" in the source list)`);
      continue;
    }
    let info;
    try {
      info = await commonsInfo(title);
    } catch (error) {
      skipped.push(`${city.slug}: ${error.message}`);
      continue;
    }
    if (!FREE_LICENCE.test(info.licenceCode)) {
      skipped.push(`${city.slug}: licence "${info.licenceCode || 'unknown'}" not in the allowlist (${info.pageUrl})`);
      continue;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime)) {
      skipped.push(`${city.slug}: unsupported type ${info.mime} (${info.pageUrl})`);
      continue;
    }

    const heroFile = `${city.slug}.webp`;
    const cardFile = `${city.slug}-card.webp`;
    const heroPath = path.join(OUT_DIR, heroFile);
    const cardPath = path.join(OUT_DIR, cardFile);
    let heroBuffer;
    let cardBuffer;
    let reused = false;
    if (!refresh && existsSync(heroPath) && existsSync(cardPath)) {
      heroBuffer = await readFile(heroPath);
      cardBuffer = await readFile(cardPath);
      reused = true;
    } else {
      let bytes;
      try {
        bytes = await getBytes(info.downloadUrl);
        // Default: sharp's "attention" strategy keeps the busiest region (usually the skyline); a city can pin "centre", "top", "bottom" etc. in the source list.
        const position = entry.position ?? sharp.strategy.attention;
        heroBuffer = await sharp(bytes).rotate().resize(HERO.width, HERO.height, { fit: 'cover', position }).webp({ quality: 72, effort: 5 }).toBuffer();
        cardBuffer = await sharp(bytes).rotate().resize(CARD.width, CARD.height, { fit: 'cover', position }).webp({ quality: 72, effort: 5 }).toBuffer();
      } catch (error) {
        skipped.push(`${city.slug}: ${error.message} (${info.pageUrl})`);
        continue;
      }
      await writeFile(heroPath, heroBuffer);
      await writeFile(cardPath, cardBuffer);
    }
    thumbs.push({ slug: city.slug, buffer: cardBuffer });

    manifest.push({
      slug: city.slug,
      src: `/cities/${heroFile}`,
      cardSrc: `/cities/${cardFile}`,
      alt: entry.alt ?? `View of ${city.name}, ${city.country}`,
      author: info.author,
      license: info.licence,
      licenseUrl: info.licenceUrl,
      sourceUrl: info.pageUrl,
    });
    console.log(`${city.slug.padEnd(20)} ${info.licence.padEnd(14)} ${(heroBuffer.length / 1024).toFixed(0).padStart(4)} KB hero  ${(cardBuffer.length / 1024).toFixed(0).padStart(3)} KB card  ${reused ? '(kept) ' : ''}${info.title}`);
  }

  if (!only) {
    manifest.sort((a, b) => a.slug.localeCompare(b.slug));
    const lines = [
      '// Generated by scripts/fetch-city-images.mjs from Wikimedia Commons. Do not edit by hand.',
      `// ${manifest.length} cities; hero ${HERO.width}×${HERO.height}, card ${CARD.width}×${CARD.height}; licences and authors as recorded on Commons.`,
      "import type { CityImage } from '@/types/data';",
      '',
      'export const CITY_IMAGES: Record<string, CityImage> = {',
      ...manifest.map(({ slug, ...image }) => `  ${JSON.stringify(slug)}: ${JSON.stringify(image)},`),
      '};',
      '',
    ];
    await writeFile(MANIFEST, lines.join('\n'));
    console.log(`\nWrote ${path.relative(ROOT, MANIFEST)} (${manifest.length} cities)`);
  } else {
    console.log('\n--only: files written, manifest not regenerated (run without --only to update it)');
  }

  if (contactSheet && thumbs.length) {
    const cols = 5;
    const w = 320;
    const h = 128;
    const rows = Math.ceil(thumbs.length / cols);
    const composite = await Promise.all(
      thumbs.map(async (t, i) => ({
        input: await sharp(t.buffer)
          .resize(w, h)
          .composite([{ input: Buffer.from(`<svg width="${w}" height="${h}"><rect x="0" y="${h - 22}" width="${w}" height="22" fill="rgba(0,0,0,0.6)"/><text x="6" y="${h - 7}" font-family="sans-serif" font-size="14" fill="white">${t.slug}</text></svg>`) }])
          .toBuffer(),
        left: (i % cols) * w,
        top: Math.floor(i / cols) * h,
      })),
    );
    await sharp({ create: { width: cols * w, height: rows * h, channels: 3, background: '#fff' } }).composite(composite).jpeg({ quality: 80 }).toFile(contactSheet);
    console.log(`Contact sheet: ${contactSheet}`);
  }

  if (skipped.length) {
    console.log('\nSkipped:');
    for (const line of skipped) console.log(`  - ${line}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

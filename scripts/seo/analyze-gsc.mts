/**
 * Search Console opportunity analysis.
 *
 *   node scripts/seo/analyze-gsc.mts --queries <Queries.csv> [--pages <Pages.csv>] [--query-page <combined.csv>]
 *        [--inventory seo/reports/site-inventory.json] [--site-url https://…] [--min-impressions 100] [--out seo/reports]
 *
 * Inputs are Search Console exports (Performance → Export → CSV, or an API
 * export with query and page columns). Output: gsc-opportunities.md. Nothing
 * is published or changed automatically. Runs on Node 24 directly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findCannibalisation,
  findMissingPages,
  findPageOpportunities,
  parseGscCsv,
  renderOpportunitiesMarkdown,
  suggestInternalLinks,
  suggestMetadata,
  type GscRow,
  type Inventory,
} from '../../lib/seo/gsc-analysis.ts';

const args = process.argv.slice(2);
const opt = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const siteUrl = opt('site-url', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://timenow.example')!;
const inventoryPath = opt('inventory', 'seo/reports/site-inventory.json')!;
const outDir = opt('out', 'seo/reports')!;
const minImpressions = Number(opt('min-impressions', '100'));

if (!existsSync(inventoryPath)) {
  console.error(`Inventory not found at ${inventoryPath}. Run "npm run seo:audit" first.`);
  process.exit(2);
}
const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as Inventory & { indexable?: string[] };
const read = (name: string): GscRow[] => {
  const file = opt(name);
  if (!file) return [];
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(2);
  }
  return parseGscCsv(readFileSync(file, 'utf8'), siteUrl);
};

const queries = read('queries');
const pages = read('pages');
const queryPage = read('query-page');
if (queries.length + pages.length + queryPage.length === 0) {
  console.error('Provide at least one of --queries, --pages, --query-page.');
  process.exit(2);
}

const notes: string[] = [];
const pageRows = pages.length ? pages : queryPage.length ? aggregateByPage(queryPage) : [];
if (!pages.length && queryPage.length) notes.push('Page metrics were aggregated from the query+page export.');
if (!queryPage.length) notes.push('No query+page export given: cannibalisation and metadata suggestions are skipped.');

const { lowCtr, strikingDistance } = findPageOpportunities(pageRows, { minImpressions });
const missing = findMissingPages(queries.length ? queries : queryPage, inventory);
const cannibalisation = queryPage.length ? findCannibalisation(queryPage) : [];
const links = suggestInternalLinks(strikingDistance.slice(0, 20).map((p) => p.page), inventory);
const metadata = queryPage.length ? suggestMetadata(queryPage, inventory) : [];

mkdirSync(outDir, { recursive: true });
const report = renderOpportunitiesMarkdown({ generatedAt: new Date().toISOString(), lowCtr, strikingDistance, missing, cannibalisation, links, metadata, notes });
writeFileSync(join(outDir, 'gsc-opportunities.md'), report);
console.log(`Low CTR: ${lowCtr.length} · striking distance: ${strikingDistance.length} · missing pages: ${missing.length} · cannibalisation: ${cannibalisation.length} · link suggestions: ${links.length} · metadata: ${metadata.length} → ${outDir}/gsc-opportunities.md`);

function aggregateByPage(rows: GscRow[]): GscRow[] {
  const by = new Map<string, { clicks: number; impressions: number; posWeighted: number }>();
  for (const r of rows) {
    if (!r.page) continue;
    const cur = by.get(r.page) ?? { clicks: 0, impressions: 0, posWeighted: 0 };
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.posWeighted += r.position * r.impressions;
    by.set(r.page, cur);
  }
  return [...by.entries()].map(([page, v]) => ({ page, clicks: v.clicks, impressions: v.impressions, ctr: v.impressions ? v.clicks / v.impressions : 0, position: v.impressions ? v.posWeighted / v.impressions : 0 }));
}

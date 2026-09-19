/**
 * Static SEO audit of a production build.
 *
 *   node scripts/seo/audit-site.mts [--dist .next] [--site-url https://timenow.example] [--out seo/reports]
 *
 * Reads the prerendered HTML and sitemap bodies under <dist>/server/app,
 * applies lib/seo/audit-rules.ts, and writes site-audit.md, site-audit.json
 * and site-inventory.json (paths, titles, link graph) for the Search Console
 * analysis. Exits 1 when there are errors (warnings never fail the run).
 * Runs on Node 24 directly (type stripping); no path aliases here.
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { auditSite, renderAuditMarkdown, type PageRecord } from '../../lib/seo/audit-rules.ts';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const dist = opt('dist', '.next');
const siteUrl = opt('site-url', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://timenow.example');
const outDir = opt('out', 'seo/reports');
const appDir = join(dist, 'server', 'app');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (s: string) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (html: string, re: RegExp) => re.exec(html)?.[1] ?? null;

function normaliseLink(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  let path = href.split('#')[0]!.split('?')[0]!;
  if (path.startsWith('/api/') || path.startsWith('/_next/') || /\.[a-z0-9]+$/i.test(path)) return null;
  if (!path.endsWith('/')) path += '/';
  return path;
}

function pathOf(file: string): string {
  const rel = relative(appDir, file).split(sep).join('/').replace(/\.html$/, '');
  if (rel === 'index') return '/';
  return `/${rel}/`;
}

function extract(file: string, sitemapPaths: Set<string>): PageRecord | null {
  const html = readFileSync(file, 'utf8');
  const path = pathOf(file);
  if (path.startsWith('/_')) return null; // _not-found, _global-error
  const head = html.slice(0, html.indexOf('</head>') + 7);
  const title = attr(head, /<title>([^<]*)<\/title>/);
  const description = attr(head, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(head, /<link rel="canonical" href="([^"]+)"/);
  const robots = attr(head, /<meta name="robots" content="([^"]+)"/);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1]!));
  const links = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => normaliseLink(decode(m[1]!))).filter((p): p is string => p !== null);
  const jsonLdTypes: string[] = [];
  let jsonLdErrors = 0;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const parsed = JSON.parse(m[1]!) as Record<string, unknown> | Record<string, unknown>[];
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) if (typeof item['@type'] === 'string') jsonLdTypes.push(item['@type'] as string);
    } catch {
      jsonLdErrors++;
    }
  }
  const main = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? '';
  const text = strip(main.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<noscript[\s\S]*?<\/noscript>/g, ' '));
  const wordCount = text ? text.split(' ').filter((w) => /[a-z0-9]/i.test(w)).length : 0;
  return { path, title: title ? decode(title) : null, description: description ? decode(description) : null, canonical, robots, h1s, links, jsonLdTypes, jsonLdErrors, wordCount, inSitemap: sitemapPaths.has(path) };
}

function readSitemapPaths(): string[] {
  const dir = join(appDir, 'sitemaps');
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.xml.body'));
  } catch {
    return [];
  }
  return files.flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(/^https?:\/\/[^/]+/, '')));
}

const sitemapPaths = readSitemapPaths();
const sitemapSet = new Set(sitemapPaths);
const pages = walk(appDir).map((f) => extract(f, sitemapSet)).filter((p): p is PageRecord => p !== null);
// Redirect sources that pages may legitimately link to (aliases are generated from data; keep in sync with next.config.ts).
const redirectSources = ['/timezones/utc/', '/timezones/gmt/'];
const audit = auditSite(pages, sitemapPaths, siteUrl, redirectSources);
const generatedAt = new Date().toISOString();

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'site-audit.md'), renderAuditMarkdown(audit, generatedAt));
writeFileSync(join(outDir, 'site-audit.json'), JSON.stringify({ generatedAt, siteUrl, dist, summary: audit.summary, findings: audit.findings }, null, 2));
const inventory = {
  generatedAt,
  paths: pages.map((p) => p.path),
  titles: Object.fromEntries(pages.map((p) => [p.path, p.title ?? ''])),
  links: Object.fromEntries(pages.map((p) => [p.path, [...new Set(p.links)]])),
  indexable: pages.filter((p) => /^index/.test(p.robots ?? '')).map((p) => p.path),
};
writeFileSync(join(outDir, 'site-inventory.json'), JSON.stringify(inventory));

const { summary } = audit;
console.log(`Audited ${summary.pages} pages (${summary.indexable} indexable): ${summary.errors} errors, ${summary.warnings} warnings → ${outDir}/site-audit.md`);
const counts = new Map<string, number>();
for (const f of audit.findings) counts.set(`${f.severity}:${f.rule}`, (counts.get(`${f.severity}:${f.rule}`) ?? 0) + 1);
for (const [key, n] of [...counts.entries()].sort()) console.log(`  ${key}: ${n}`);
if (summary.errors > 0 && !args.includes('--no-fail')) process.exit(1);

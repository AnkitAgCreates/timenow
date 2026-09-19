/**
 * Page-quality rules for the static SEO audit (Sprint 6). Pure: takes page
 * records extracted from the production build and returns findings. Kept
 * free of path aliases so Node can run the audit script directly.
 */

export type PageRecord = {
  /** Canonical-style path: "/time/london/". */
  path: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1s: string[];
  /** Internal link targets found in the HTML, normalised to trailing-slash paths without query/hash. */
  links: string[];
  /** JSON-LD blocks that failed to parse (count) and the @types that did. */
  jsonLdTypes: string[];
  jsonLdErrors: number;
  /** Words of visible text inside <main>. */
  wordCount: number;
  inSitemap: boolean;
};

export type Severity = 'error' | 'warning';

export type Finding = { severity: Severity; rule: string; path: string; detail: string };

export const LIMITS = {
  titleMin: 15,
  titleMax: 70,
  descriptionMin: 50,
  descriptionMax: 170,
  thinWords: 200,
  orphanInbound: 1,
} as const;

const isIndexable = (page: PageRecord) => /^index/.test(page.robots ?? '');

/** Per-page checks. `siteUrl` is the origin canonicals must use. */
export function auditPage(page: PageRecord, siteUrl: string): Finding[] {
  const out: Finding[] = [];
  const add = (severity: Severity, rule: string, detail: string) => out.push({ severity, rule, path: page.path, detail });
  const indexable = isIndexable(page);

  if (!page.title) add('error', 'title-missing', 'No <title>.');
  else if (page.title.length < LIMITS.titleMin || page.title.length > LIMITS.titleMax) add('warning', 'title-length', `${page.title.length} characters: "${page.title}"`);

  if (!page.description) add(indexable ? 'error' : 'warning', 'description-missing', 'No meta description.');
  else if (page.description.length < LIMITS.descriptionMin || page.description.length > LIMITS.descriptionMax) add('warning', 'description-length', `${page.description.length} characters.`);

  if (page.h1s.length !== 1) add('error', 'h1-count', `${page.h1s.length} H1 elements${page.h1s.length ? `: ${page.h1s.map((h) => `"${h}"`).join(', ')}` : ''}.`);

  if (!page.canonical) add('error', 'canonical-missing', 'No canonical link.');
  else if (page.canonical !== `${siteUrl}${page.path}`) add('error', 'canonical-mismatch', `Canonical is ${page.canonical}, expected ${siteUrl}${page.path}.`);

  if (!page.robots) add('error', 'robots-missing', 'No robots meta.');
  if (indexable && !page.inSitemap) add('error', 'sitemap-missing', 'Indexable page is not in any sitemap.');
  if (!indexable && page.inSitemap) add('error', 'sitemap-noindex', 'Noindex page is listed in a sitemap.');

  if (page.jsonLdErrors > 0) add('error', 'jsonld-invalid', `${page.jsonLdErrors} JSON-LD block(s) failed to parse.`);
  if (indexable && page.path !== '/' && !page.jsonLdTypes.includes('BreadcrumbList')) add('warning', 'jsonld-breadcrumbs', 'No BreadcrumbList.');
  if (indexable && !page.jsonLdTypes.some((t) => t === 'WebPage' || t === 'WebApplication' || t === 'WebSite')) add('warning', 'jsonld-page', 'No WebPage/WebApplication schema.');

  if (indexable && page.wordCount < LIMITS.thinWords) add('warning', 'thin-content', `${page.wordCount} words in <main>.`);

  return out;
}

export type SiteAudit = {
  findings: Finding[];
  /** Inbound link counts per path (from other pages only). */
  inbound: Record<string, number>;
  summary: { pages: number; indexable: number; errors: number; warnings: number };
};

/** Site-level checks: duplicates, broken links, orphans, sitemap coverage. */
export function auditSite(pages: PageRecord[], sitemapPaths: string[], siteUrl: string, redirectSources: string[] = []): SiteAudit {
  const findings: Finding[] = [];
  const byPath = new Map(pages.map((p) => [p.path, p]));
  const known = new Set([...byPath.keys(), ...redirectSources]);
  const inbound: Record<string, number> = {};
  for (const p of pages) inbound[p.path] = 0;

  for (const page of pages) {
    findings.push(...auditPage(page, siteUrl));
    for (const target of new Set(page.links)) {
      if (target === page.path) continue;
      if (!known.has(target)) findings.push({ severity: 'error', rule: 'broken-link', path: page.path, detail: `Links to ${target}, which is not a page.` });
      else if (byPath.has(target)) inbound[target] = (inbound[target] ?? 0) + 1;
    }
  }

  const indexable = pages.filter(isIndexable);
  const dupes = (key: 'title' | 'description') => {
    const seen = new Map<string, string[]>();
    for (const p of indexable) {
      const value = p[key];
      if (!value) continue;
      seen.set(value, [...(seen.get(value) ?? []), p.path]);
    }
    for (const [value, paths] of seen) {
      if (paths.length > 1) findings.push({ severity: 'warning', rule: `${key}-duplicate`, path: paths[0]!, detail: `"${value.slice(0, 60)}…" is shared by ${paths.length} pages: ${paths.slice(0, 5).join(', ')}${paths.length > 5 ? ', …' : ''}` });
    }
  };
  dupes('title');
  dupes('description');

  for (const page of indexable) {
    if ((inbound[page.path] ?? 0) < LIMITS.orphanInbound) findings.push({ severity: 'warning', rule: 'orphan', path: page.path, detail: 'No inbound internal links from other pages.' });
  }

  for (const path of sitemapPaths) {
    if (!byPath.has(path)) findings.push({ severity: 'error', rule: 'sitemap-orphan', path, detail: 'Sitemap lists a URL with no built page.' });
  }

  return {
    findings,
    inbound,
    summary: {
      pages: pages.length,
      indexable: indexable.length,
      errors: findings.filter((f) => f.severity === 'error').length,
      warnings: findings.filter((f) => f.severity === 'warning').length,
    },
  };
}

/** Markdown report grouped by rule, errors first. */
export function renderAuditMarkdown(audit: SiteAudit, generatedAt: string): string {
  const lines: string[] = [];
  lines.push(`# Site audit`, '', `Generated ${generatedAt}. ${audit.summary.pages} pages (${audit.summary.indexable} indexable): **${audit.summary.errors} errors**, ${audit.summary.warnings} warnings.`, '');
  const byRule = new Map<string, Finding[]>();
  for (const f of audit.findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
  const rules = [...byRule.entries()].sort((a, b) => Number(b[1][0]!.severity === 'error') - Number(a[1][0]!.severity === 'error') || b[1].length - a[1].length);
  for (const [rule, list] of rules) {
    lines.push(`## ${list[0]!.severity === 'error' ? '🔴' : '🟡'} ${rule} (${list.length})`, '');
    for (const f of list.slice(0, 40)) lines.push(`- \`${f.path}\` — ${f.detail}`);
    if (list.length > 40) lines.push(`- … ${list.length - 40} more`);
    lines.push('');
  }
  if (rules.length === 0) lines.push('No findings.', '');
  return lines.join('\n');
}

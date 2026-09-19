/**
 * Search Console analysis (Sprint 6). Pure: parses Search Console exports
 * (CSV) and, with the site inventory from the audit, finds opportunities.
 * No alias imports so Node can run the CLI directly.
 */

export type GscRow = { query?: string; page?: string; clicks: number; impressions: number; ctr: number; position: number };

/** Parse RFC-4180-ish CSV (quotes, escaped quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

const num = (value: string): number => {
  const cleaned = value.replace(/[%,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Accepts the Search Console UI exports ("Top queries"/"Top pages" with
 * Clicks, Impressions, CTR, Position) and combined query+page exports.
 * CTR is normalised to a fraction (12.5% → 0.125).
 */
export function parseGscCsv(text: string, siteUrl?: string): GscRow[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const col = (...needles: string[]) => header.findIndex((h) => needles.some((n) => h.includes(n)));
  const qi = col('quer');
  const pi = col('page', 'url', 'landing');
  const ci = col('click');
  const ii = col('impression');
  const ti = col('ctr');
  const oi = col('position');
  return rows.slice(1).map((r) => {
    const ctrRaw = ti >= 0 ? r[ti] ?? '' : '';
    let ctr = num(ctrRaw);
    if (ctrRaw.includes('%') || ctr > 1) ctr /= 100;
    let page = pi >= 0 ? r[pi]?.trim() : undefined;
    if (page && siteUrl && page.startsWith(siteUrl)) page = page.slice(siteUrl.length);
    if (page && /^https?:\/\//.test(page)) page = page.replace(/^https?:\/\/[^/]+/, '');
    return {
      query: qi >= 0 ? r[qi]?.trim().toLowerCase() : undefined,
      page,
      clicks: ci >= 0 ? num(r[ci] ?? '') : 0,
      impressions: ii >= 0 ? num(r[ii] ?? '') : 0,
      ctr,
      position: oi >= 0 ? num(r[oi] ?? '') : 0,
    };
  });
}

export type Inventory = {
  /** Every built page path. */
  paths: string[];
  /** Internal link graph: path → outbound paths. */
  links: Record<string, string[]>;
  /** Titles by path (for name matching). */
  titles: Record<string, string>;
};

const norm = (s: string) => s.toLowerCase().replace(/[’'.]/g, '').replace(/[^a-z0-9+-]+/g, ' ').trim();
const slugify = (s: string) => norm(s).replace(/\s+/g, '-');

/** Known names per page family, derived from the inventory paths and titles. */
export function knownNames(inv: Inventory) {
  const cities = new Map<string, string>(); // name → path
  const countries = new Map<string, string>();
  const zones = new Set<string>();
  const timers = new Set<string>();
  const converters = new Set<string>();
  for (const path of inv.paths) {
    let m: RegExpExecArray | null;
    if ((m = /^\/time\/([^/]+)\/$/.exec(path))) {
      cities.set(m[1]!, path);
      const title = inv.titles[path] ?? '';
      const name = /Current Time in ([^,–]+)/.exec(title)?.[1]?.trim();
      if (name) cities.set(slugify(name), path);
    } else if ((m = /^\/countries\/([^/]+)\/$/.exec(path))) countries.set(m[1]!, path);
    else if ((m = /^\/timezones\/([^/]+)\/$/.exec(path))) zones.add(m[1]!);
    else if (path === '/utc/' || path === '/gmt/') zones.add(path.slice(1, -1));
    else if ((m = /^\/timer\/([^/]+)\/$/.exec(path))) timers.add(m[1]!);
    else if ((m = /^\/convert\/([^/]+)\/$/.exec(path))) converters.add(m[1]!);
  }
  return { cities, countries, zones, timers, converters };
}

export type MissingPage = { kind: 'city-or-country' | 'timezone' | 'timer' | 'converter'; suggestion: string; queries: string[]; impressions: number };

const ZONE_WORD = /^[a-z]{2,5}$/;

/**
 * Queries whose intent matches a page family but whose subject has no page.
 * Returns candidates sorted by impressions; each is a human decision, never
 * an automatic page.
 */
export function findMissingPages(rows: GscRow[], inv: Inventory): MissingPage[] {
  const names = knownNames(inv);
  const out = new Map<string, MissingPage>();
  const push = (kind: MissingPage['kind'], suggestion: string, row: GscRow) => {
    const key = `${kind}:${suggestion}`;
    const entry = out.get(key) ?? { kind, suggestion, queries: [], impressions: 0 };
    if (row.query && !entry.queries.includes(row.query)) entry.queries.push(row.query);
    entry.impressions += row.impressions;
    out.set(key, entry);
  };
  for (const row of rows) {
    const q = row.query ? norm(row.query) : '';
    if (!q) continue;
    let m: RegExpExecArray | null;
    if ((m = /^(?:what time is it in|what time is in|current time in|time in|time now in) (.+?)(?: now| right now)?$/.exec(q)) || (m = /^(.+?) (?:time now|local time|current time)$/.exec(q))) {
      const subject = slugify(m[1]!);
      if (ZONE_WORD.test(subject) && (names.zones.has(subject) || /^(utc|gmt)[+-]/.test(subject))) continue;
      if (!names.cities.has(subject) && !names.countries.has(subject) && !names.zones.has(subject)) push('city-or-country', `/time/${subject}/ or /countries/${subject}/`, row);
      continue;
    }
    if ((m = /^(\d{1,3}) ?(second|minute|hour)s? timer$/.exec(q)) || (m = /^timer (?:for )?(\d{1,3}) ?(second|minute|hour)s?$/.exec(q))) {
      const n = Number(m[1]);
      const unit = m[2]!;
      const slug = `${n}-${unit}${n === 1 ? '' : 's'}`;
      const canonical = unit === 'minute' && n % 60 === 0 ? `${n / 60}-hour${n / 60 === 1 ? '' : 's'}` : slug;
      if (!names.timers.has(canonical)) push('timer', `/timer/${canonical}/`, row);
      continue;
    }
    if ((m = /^(.+?) (?:to|vs|and) (.+?)(?: time| time zone| converter| conversion)?$/.exec(q))) {
      const a = slugify(m[1]!);
      const b = slugify(m[2]!);
      const isZone = (s: string) => names.zones.has(s);
      const isCity = (s: string) => names.cities.has(s);
      if ((isZone(a) && isZone(b)) || (isCity(a) && isCity(b))) {
        const path = (x: string) => (isCity(x) ? names.cities.get(x)!.replace(/^\/time\/|\/$/g, '') : x);
        const slug = `${path(a)}-to-${path(b)}`;
        if (!names.converters.has(slug)) push('converter', `/convert/${slug}/`, row);
      }
      continue;
    }
    if ((m = /^([a-z]{2,5}) (?:time|time zone|timezone)(?: now)?$/.exec(q)) && !names.zones.has(m[1]!)) {
      push('timezone', `/timezones/${m[1]}/`, row);
    }
  }
  return [...out.values()].sort((a, b) => b.impressions - a.impressions);
}

export type PageOpportunity = { page: string; clicks: number; impressions: number; ctr: number; position: number; reason: string };

/** High impressions but weak CTR for the position, and positions 5–20 ("striking distance"). */
export function findPageOpportunities(pages: GscRow[], options: { minImpressions?: number } = {}): { lowCtr: PageOpportunity[]; strikingDistance: PageOpportunity[] } {
  const minImpressions = options.minImpressions ?? 100;
  const eligible = pages.filter((r) => r.page && r.impressions >= minImpressions);
  // Expected CTR by position band (rough industry curve); flag pages well below it.
  const expected = (pos: number) => (pos <= 1 ? 0.28 : pos <= 3 ? 0.12 : pos <= 5 ? 0.06 : pos <= 10 ? 0.03 : 0.01);
  const lowCtr = eligible
    .filter((r) => r.ctr < expected(r.position) * 0.5)
    .map((r) => ({ page: r.page!, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position, reason: `CTR ${(r.ctr * 100).toFixed(1)}% vs ~${(expected(r.position) * 100).toFixed(0)}% typical at position ${r.position.toFixed(1)}` }))
    .sort((a, b) => b.impressions - a.impressions);
  const strikingDistance = eligible
    .filter((r) => r.position >= 5 && r.position <= 20)
    .map((r) => ({ page: r.page!, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position, reason: `Position ${r.position.toFixed(1)}: a small gain moves it onto page one or into the top 5` }))
    .sort((a, b) => b.impressions - a.impressions);
  return { lowCtr, strikingDistance };
}

export type Cannibalisation = { query: string; pages: Array<{ page: string; impressions: number; clicks: number; position: number }> };

/** Queries for which two or more of our pages receive impressions (needs a query+page export). */
export function findCannibalisation(rows: GscRow[], minImpressions = 20): Cannibalisation[] {
  const byQuery = new Map<string, Map<string, { impressions: number; clicks: number; position: number }>>();
  for (const r of rows) {
    if (!r.query || !r.page) continue;
    const pages = byQuery.get(r.query) ?? new Map();
    const current = pages.get(r.page) ?? { impressions: 0, clicks: 0, position: r.position };
    current.impressions += r.impressions;
    current.clicks += r.clicks;
    pages.set(r.page, current);
    byQuery.set(r.query, pages);
  }
  const out: Cannibalisation[] = [];
  for (const [query, pages] of byQuery) {
    const list = [...pages.entries()].map(([page, v]) => ({ page, ...v })).filter((p) => p.impressions >= minImpressions);
    if (list.length >= 2) out.push({ query, pages: list.sort((a, b) => b.impressions - a.impressions) });
  }
  return out.sort((a, b) => b.pages[0]!.impressions - a.pages[0]!.impressions);
}

export type LinkSuggestion = { target: string; from: string; reason: string };

/**
 * For pages in striking distance, list related pages (same family or sharing
 * a slug segment) that do not link to them yet.
 */
export function suggestInternalLinks(targets: string[], inv: Inventory, limitPerTarget = 5): LinkSuggestion[] {
  const out: LinkSuggestion[] = [];
  const family = (p: string) => p.split('/')[1] ?? '';
  const segments = (p: string) => new Set(p.split('/').filter(Boolean).flatMap((s) => s.split('-')).filter((s) => s.length > 2 && !['time', 'to', 'the', 'and', 'convert', 'countries', 'timezones', 'timer', 'utc'].includes(s)));
  for (const target of targets) {
    if (!inv.links[target]) continue;
    const targetSegments = segments(target);
    const candidates = inv.paths
      .filter((p) => p !== target && !(inv.links[p] ?? []).includes(target))
      .map((p) => {
        const shared = [...segments(p)].filter((s) => targetSegments.has(s)).length;
        const sameFamily = family(p) === family(target) ? 1 : 0;
        return { p, score: shared * 2 + sameFamily };
      })
      .filter((c) => c.score >= 1)
      .sort((a, b) => b.score - a.score || a.p.localeCompare(b.p))
      .slice(0, limitPerTarget);
    for (const c of candidates) out.push({ target, from: c.p, reason: c.score >= 3 ? 'shares a subject and page family' : c.score >= 2 ? 'shares a subject' : 'same page family' });
  }
  return out;
}

export type MetadataSuggestion = { page: string; query: string; impressions: number; reason: string };

/** Pages whose title does not contain the wording of their top query (from a query+page export). */
export function suggestMetadata(rows: GscRow[], inv: Inventory, minImpressions = 50): MetadataSuggestion[] {
  const topByPage = new Map<string, GscRow>();
  for (const r of rows) {
    if (!r.query || !r.page || r.impressions < minImpressions) continue;
    const current = topByPage.get(r.page);
    if (!current || r.impressions > current.impressions) topByPage.set(r.page, r);
  }
  const out: MetadataSuggestion[] = [];
  for (const [page, row] of topByPage) {
    const title = norm(inv.titles[page] ?? '');
    if (!title) continue;
    const missing = norm(row.query!).split(' ').filter((w) => w.length > 2 && !['the', 'what', 'is', 'now', 'time', 'in', 'to'].includes(w) && !title.includes(w));
    if (missing.length > 0) out.push({ page, query: row.query!, impressions: row.impressions, reason: `Title lacks "${missing.join(' ')}" from the top query "${row.query}"` });
  }
  return out.sort((a, b) => b.impressions - a.impressions);
}

export function renderOpportunitiesMarkdown(input: {
  generatedAt: string;
  lowCtr: PageOpportunity[];
  strikingDistance: PageOpportunity[];
  missing: MissingPage[];
  cannibalisation: Cannibalisation[];
  links: LinkSuggestion[];
  metadata: MetadataSuggestion[];
  notes: string[];
}): string {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const L: string[] = [`# Search Console opportunities`, '', `Generated ${input.generatedAt}. Nothing here is applied automatically; each item is a suggestion to review.`, ''];
  for (const n of input.notes) L.push(`> ${n}`);
  if (input.notes.length) L.push('');
  const table = (rows: PageOpportunity[]) => {
    L.push('| Page | Impressions | Clicks | CTR | Position | Why |', '| --- | ---: | ---: | ---: | ---: | --- |');
    for (const r of rows.slice(0, 30)) L.push(`| \`${r.page}\` | ${r.impressions} | ${r.clicks} | ${pct(r.ctr)} | ${r.position.toFixed(1)} | ${r.reason} |`);
    L.push('');
  };
  L.push(`## High impressions, low CTR (${input.lowCtr.length})`, '');
  if (input.lowCtr.length) table(input.lowCtr);
  else L.push('None.', '');
  L.push(`## Striking distance: positions 5–20 (${input.strikingDistance.length})`, '');
  if (input.strikingDistance.length) table(input.strikingDistance);
  else L.push('None.', '');
  L.push(`## Missing pages suggested by queries (${input.missing.length})`, '');
  if (input.missing.length) {
    L.push('| Candidate | Kind | Impressions | Queries |', '| --- | --- | ---: | --- |');
    for (const m of input.missing.slice(0, 40)) L.push(`| \`${m.suggestion}\` | ${m.kind} | ${m.impressions} | ${m.queries.slice(0, 3).join('; ')} |`);
    L.push('', 'Add a candidate only if it passes the same curation rules as existing pages (real place, real corridor, real timer length).', '');
  } else L.push('None.', '');
  L.push(`## Possible cannibalisation (${input.cannibalisation.length})`, '');
  if (input.cannibalisation.length) {
    for (const c of input.cannibalisation.slice(0, 20)) L.push(`- **${c.query}** → ${c.pages.map((p) => `\`${p.page}\` (${p.impressions} imp., pos ${p.position.toFixed(1)})`).join(', ')}`);
    L.push('');
  } else L.push('None (needs a query+page export).', '');
  L.push(`## Internal link suggestions (${input.links.length})`, '');
  if (input.links.length) {
    for (const l of input.links.slice(0, 40)) L.push(`- Link to \`${l.target}\` from \`${l.from}\` — ${l.reason}`);
    L.push('');
  } else L.push('None.', '');
  L.push(`## Metadata suggestions (${input.metadata.length})`, '');
  if (input.metadata.length) {
    for (const m of input.metadata.slice(0, 30)) L.push(`- \`${m.page}\` (${m.impressions} imp.) — ${m.reason}`);
    L.push('');
  } else L.push('None (needs a query+page export).', '');
  return L.join('\n');
}

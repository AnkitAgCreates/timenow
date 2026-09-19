import { describe, expect, it } from 'vitest';
import { DESCRIPTION_BUDGET, fitDescription, fitTitle, TITLE_BUDGET } from './title';
import { auditPage, auditSite, renderAuditMarkdown, type PageRecord } from './audit-rules';
import {
  findCannibalisation,
  findMissingPages,
  findPageOpportunities,
  knownNames,
  parseCsv,
  parseGscCsv,
  renderOpportunitiesMarkdown,
  suggestInternalLinks,
  suggestMetadata,
  type Inventory,
} from './gsc-analysis';

const SITE = 'https://timenow.example';

const page = (over: Partial<PageRecord>): PageRecord => ({
  path: '/time/london/',
  title: 'Current Time in London, United Kingdom – Time Zone & DST | TimeNow',
  description: 'What time is it in London? Live local time, time zone and DST, sunrise and sunset, and differences with major cities.',
  canonical: `${SITE}/time/london/`,
  robots: 'index, follow',
  h1s: ['Current Time in London, United Kingdom'],
  links: ['/', '/countries/united-kingdom/'],
  jsonLdTypes: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  jsonLdErrors: 0,
  wordCount: 600,
  inSitemap: true,
  ...over,
});

describe('metadata budgets', () => {
  it('keeps the fuller title or description only while it fits the budget', () => {
    expect(fitTitle('Short title', 'Compact')).toBe('Short title');
    expect(fitTitle('x'.repeat(TITLE_BUDGET + 1), 'Compact')).toBe('Compact');
    expect(fitDescription('y'.repeat(DESCRIPTION_BUDGET), 'Compact')).toHaveLength(DESCRIPTION_BUDGET);
    expect(fitDescription('y'.repeat(DESCRIPTION_BUDGET + 1), 'Compact')).toBe('Compact');
  });
});

describe('site audit rules', () => {
  it('passes a well-formed indexable page', () => {
    expect(auditPage(page({}), SITE)).toEqual([]);
  });

  it('flags missing or mismatched metadata, H1 count, JSON-LD and thin content', () => {
    const findings = auditPage(
      page({ title: 'Short', description: null, canonical: `${SITE}/time/london`, h1s: ['A', 'B'], jsonLdTypes: [], jsonLdErrors: 1, wordCount: 40, inSitemap: false }),
      SITE,
    );
    const rules = findings.map((f) => `${f.severity}:${f.rule}`);
    expect(rules).toEqual(
      expect.arrayContaining(['warning:title-length', 'error:description-missing', 'error:h1-count', 'error:canonical-mismatch', 'error:sitemap-missing', 'error:jsonld-invalid', 'warning:jsonld-breadcrumbs', 'warning:jsonld-page', 'warning:thin-content']),
    );
  });

  it('treats noindex pages leniently but keeps them out of sitemaps', () => {
    const findings = auditPage(page({ robots: 'noindex, follow', description: null, wordCount: 30, inSitemap: true }), SITE);
    expect(findings.map((f) => `${f.severity}:${f.rule}`)).toEqual(['warning:description-missing', 'error:sitemap-noindex']);
  });

  it('finds broken links, duplicates, orphans and sitemap URLs without pages across the site', () => {
    const a = page({ path: '/a/', canonical: `${SITE}/a/`, links: ['/b/', '/missing/', '/timezones/utc/'] });
    const b = page({ path: '/b/', canonical: `${SITE}/b/`, links: ['/a/'] });
    const c = page({ path: '/c/', canonical: `${SITE}/c/`, links: ['/a/'], title: a.title });
    const audit = auditSite([a, b, c], ['/a/', '/b/', '/c/', '/ghost/'], SITE, ['/timezones/utc/']);
    const rules = audit.findings.map((f) => `${f.rule}@${f.path}`);
    expect(rules).toContain('broken-link@/a/');
    expect(rules).not.toContain('broken-link@/timezones/utc/');
    expect(rules).toContain('title-duplicate@/a/');
    expect(rules).not.toContain('orphan@/b/'); // /a/ links to it
    expect(rules).toContain('orphan@/c/'); // nobody links to it
    expect(rules).not.toContain('orphan@/a/'); // b and c link to it
    expect(rules).toContain('sitemap-orphan@/ghost/');
    expect(audit.inbound['/a/']).toBe(2);
    expect(audit.summary.errors).toBeGreaterThan(0);
    const md = renderAuditMarkdown(audit, '2026-09-19T00:00:00Z');
    expect(md).toContain('# Site audit');
    expect(md).toContain('broken-link');
  });
});

const inventory: Inventory = {
  paths: ['/', '/time/london/', '/time/new-york/', '/countries/india/', '/timezones/est/', '/timezones/cst/', '/utc/', '/timer/25-minutes/', '/timer/1-hour/', '/convert/est-to-ist/', '/convert/london-to-new-york/', '/timezones/'],
  titles: {
    '/time/london/': 'Current Time in London, United Kingdom – Time Zone & DST | TimeNow',
    '/time/new-york/': 'Current Time in New York, New York – Time Zone & DST | TimeNow',
    '/timezones/est/': 'Eastern Standard Time (EST) – Current Time, UTC-5 & DST | TimeNow',
    '/timer/25-minutes/': '25 Minute Timer – Free Online Countdown with Alarm | TimeNow',
  },
  links: {
    '/': ['/time/london/', '/timezones/est/', '/timer/1-hour/'],
    '/time/london/': ['/', '/convert/london-to-new-york/'],
    '/time/new-york/': ['/'],
    '/timezones/est/': ['/convert/est-to-ist/'],
    '/timezones/cst/': ['/'],
    '/timezones/': ['/timezones/est/'],
    '/convert/est-to-ist/': ['/timezones/est/'],
    '/timer/25-minutes/': ['/timer/1-hour/'],
    '/timer/1-hour/': ['/timer/25-minutes/'],
  },
};

describe('Search Console analysis', () => {
  it('parses CSV with quotes, percentages and thousands separators, both UI and combined exports', () => {
    expect(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\n')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
    const ui = parseGscCsv('Top queries,Clicks,Impressions,CTR,Position\n"time in london","1,234","20,000",6.17%,3.2\n');
    expect(ui[0]).toEqual({ query: 'time in london', page: undefined, clicks: 1234, impressions: 20000, ctr: 0.0617, position: 3.2 });
    const combined = parseGscCsv('Query,Page,Clicks,Impressions,CTR,Position\nest to ist,https://timenow.example/convert/est-to-ist/,10,500,0.02,12.4\n', 'https://timenow.example');
    expect(combined[0]!.page).toBe('/convert/est-to-ist/');
    expect(combined[0]!.ctr).toBe(0.02);
  });

  it('derives known names from the inventory', () => {
    const names = knownNames(inventory);
    expect(names.cities.has('london')).toBe(true);
    expect(names.cities.get('new-york')).toBe('/time/new-york/');
    expect(names.zones.has('est')).toBe(true);
    expect(names.zones.has('utc')).toBe(true);
    expect(names.timers.has('25-minutes')).toBe(true);
    expect(names.converters.has('est-to-ist')).toBe(true);
  });

  it('suggests missing pages only for subjects that have no page, by intent', () => {
    const rows = parseGscCsv(
      [
        'Top queries,Clicks,Impressions,CTR,Position',
        'time in london,10,1000,1%,3', // exists
        'what time is it in lisbon,2,400,0.5%,15', // missing city
        'lisbon time now,1,300,0.3%,18', // same subject, merged
        '7 minute timer,5,900,0.5%,9', // missing timer
        '60 minute timer,5,900,0.5%,9', // canonical 1-hour exists
        'pst to ist,3,700,0.4%,11', // missing zone corridor
        'est to ist converter,3,700,0.4%,11', // exists
        'new york to london time,3,650,0.4%,11', // reverse direction missing
        'cet time,3,600,0.4%,11', // missing abbreviation
        'est time now,3,600,0.4%,11', // exists
        'utc+2 time now,1,100,1%,2', // offset query, ignored
      ].join('\n'),
    );
    const missing = findMissingPages(rows, inventory);
    const bySuggestion = Object.fromEntries(missing.map((m) => [m.suggestion, m]));
    expect(bySuggestion['/time/lisbon/ or /countries/lisbon/']?.impressions).toBe(700);
    expect(bySuggestion['/time/lisbon/ or /countries/lisbon/']?.queries).toEqual(['what time is it in lisbon', 'lisbon time now']);
    expect(bySuggestion['/timer/7-minutes/']?.kind).toBe('timer');
    expect(bySuggestion['/timer/1-hour/']).toBeUndefined();
    expect(bySuggestion['/convert/pst-to-ist/']).toBeUndefined(); // pst has no abbreviation page, so no corridor is suggested
    expect(bySuggestion['/convert/new-york-to-london/']?.kind).toBe('converter');
    expect(bySuggestion['/timezones/cet/']?.kind).toBe('timezone');
    expect(missing.some((m) => m.suggestion.includes('london/ or'))).toBe(false);
    expect(missing[0]!.suggestion).toBe('/timer/7-minutes/'); // sorted by impressions (900)
  });

  it('finds low-CTR and striking-distance pages', () => {
    const pages = parseGscCsv(
      ['Top pages,Clicks,Impressions,CTR,Position', 'https://timenow.example/time/london/,50,10000,0.5%,2.1', 'https://timenow.example/timezones/est/,30,3000,1%,8.4', 'https://timenow.example/timer/1-hour/,2,40,5%,6'].join('\n'),
      'https://timenow.example',
    );
    const { lowCtr, strikingDistance } = findPageOpportunities(pages, { minImpressions: 100 });
    expect(lowCtr.map((p) => p.page)).toEqual(['/time/london/', '/timezones/est/']);
    expect(strikingDistance.map((p) => p.page)).toEqual(['/timezones/est/']);
    expect(lowCtr[0]!.reason).toContain('CTR 0.5%');
  });

  it('detects cannibalisation, suggests links and metadata from a query+page export', () => {
    const rows = parseGscCsv(
      [
        'Query,Page,Clicks,Impressions,CTR,Position',
        'est time,/timezones/est/,20,800,2.5%,4',
        'est time,/convert/est-to-ist/,2,300,0.6%,9',
        'london time,/time/london/,40,2000,2%,3',
        'pomodoro timer,/timer/25-minutes/,5,900,0.5%,8',
      ].join('\n'),
    );
    const cannibal = findCannibalisation(rows);
    expect(cannibal.map((c) => c.query)).toEqual(['est time']);
    expect(cannibal[0]!.pages[0]!.page).toBe('/timezones/est/');

    const links = suggestInternalLinks(['/timezones/est/'], inventory);
    // /convert/est-to-ist/ already links to it; the CST page shares a family; the London city page shares nothing.
    expect(links.map((l) => l.from)).toContain('/timezones/cst/');
    expect(links.map((l) => l.from)).not.toContain('/convert/est-to-ist/');
    expect(links.map((l) => l.from)).not.toContain('/time/london/');

    const meta = suggestMetadata(rows, inventory);
    expect(meta.map((m) => m.page)).toEqual(['/timer/25-minutes/']); // title lacks "pomodoro"; others already contain their query words
    expect(meta[0]!.reason).toContain('pomodoro');

    const md = renderOpportunitiesMarkdown({ generatedAt: 'now', lowCtr: [], strikingDistance: [], missing: [], cannibalisation: cannibal, links, metadata: meta, notes: ['test'] });
    expect(md).toContain('est time');
    expect(md).toContain('/timezones/cst/');
    expect(md).toContain('pomodoro');
  });
});

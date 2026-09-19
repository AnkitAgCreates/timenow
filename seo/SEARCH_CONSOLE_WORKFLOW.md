# Search Console workflow (Sprint 6)

Two scripts, no automation of publishing: the audit checks what we built, the analysis turns Search Console exports into a reviewable list of opportunities. Both run on Node 24 with no extra dependencies.

## 1. Page-quality audit — `npm run seo:audit`

```bash
NEXT_PUBLIC_SITE_URL=https://timenow.example NEXT_PUBLIC_ALLOW_INDEXING=true npm run build
npm run seo:audit -- --site-url https://timenow.example
```

Reads every prerendered page and sitemap in `.next/` (or `--dist <dir>`) and writes to `seo/reports/`:

- `site-audit.md` / `site-audit.json` — findings by rule. **Errors** (fail the run and CI): missing or mismatched canonical, missing title/description on an indexable page, not exactly one H1, invalid JSON-LD, indexable page missing from the sitemaps, noindex page in a sitemap, sitemap URL with no page, internal link to a URL that is not a page. **Warnings**: title 15–70 / description 50–170 characters, duplicate titles or descriptions, thin `<main>` (< 200 words), orphans (< 2 inbound internal links), missing BreadcrumbList / WebPage schema.
- `site-inventory.json` — paths, titles and the internal link graph, consumed by the analysis.

CI runs the audit on every push (job "SEO audit"); the report is uploaded as an artifact.

## 2. Search Console analysis — `npm run seo:gsc`

Export from Search Console → Performance → Export → **CSV** (the zip contains `Queries.csv` and `Pages.csv`), or pull `query` + `page` rows from the Search Analytics API into one CSV with columns `Query, Page, Clicks, Impressions, CTR, Position`.

```bash
npm run seo:gsc -- --queries Queries.csv --pages Pages.csv
npm run seo:gsc -- --query-page export.csv          # enables cannibalisation and metadata checks
npm run seo:gsc -- --queries seo/samples/sample-queries.csv --query-page seo/samples/sample-query-page.csv   # synthetic demo data
```

Writes `seo/reports/gsc-opportunities.md` with:

| Section | What it lists | What to do |
| --- | --- | --- |
| High impressions, low CTR | pages whose CTR is under half the typical CTR for their position (≥ `--min-impressions`, default 100) | rewrite the title/description to match the query intent; check the SERP for rich results we lack |
| Striking distance (positions 5–20) | pages a small gain would move to page one / top 5 | add internal links (next section), deepen content, check the query matches the H1 |
| Missing pages suggested by queries | "time in X", "N minute timer", "A to B", "XYZ time" queries whose subject has no page | add only if it passes the existing curation rules (`data/*.ts`, generator overrides, corridors); the report names the candidate path |
| Possible cannibalisation | queries where two or more of our pages get impressions | decide the intended page, link the other one to it, adjust its title, or canonicalise |
| Internal link suggestions | for striking-distance pages, related pages (same family or shared subject) that do not link to them yet | add the link in the relevant data-driven section, not as prose |
| Metadata suggestions | pages whose title lacks the wording of their top query | adjust the title pattern in the content module for that template |

Nothing in the report changes the site. Every change still goes through the normal path: data or template edit → tests → build → CI.

## Cadence

Monthly after launch, or after each sprint that adds pages. Keep the exports outside git (`seo/reports/` and `seo/exports/` are ignored); the synthetic samples in `seo/samples/` are for trying the tooling only.

## Bing and IndexNow

Bing Webmaster Tools imports the property and sitemap from Search Console (done 2026-09-19). For changed or new URLs, run `npm run seo:indexnow -- --urls /path/,/other/` (or the manual "IndexNow submit" GitHub workflow) so Bing, Yandex and the other IndexNow engines fetch them within minutes; with no `--urls` every sitemap URL is resubmitted. Google ignores IndexNow and follows the sitemaps.

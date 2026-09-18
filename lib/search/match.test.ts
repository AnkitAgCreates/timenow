import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from './build-index';
import { flattenResults, normalizeSearch, searchItems } from './match';

const index = buildSearchIndex();
const labels = (query: string) => flattenResults(searchItems(index, query)).map((item) => item.label);

describe('search', () => {
  it('normalises accents, case and punctuation', () => {
    expect(normalizeSearch('  Ciudad de México! ')).toBe('ciudad de mexico');
    expect(normalizeSearch('UTC-6')).toBe('utc-6');
  });

  it('finds cities by prefix, alias and country', () => {
    expect(labels('san d')[0]).toBe('San Diego');
    expect(labels('bombay')).toContain('Mumbai');
    expect(labels('nyc')[0]).toBe('New York');
    const india = searchItems(index, 'india');
    expect(india.country.map((c) => c.label)).toEqual(['India']);
    expect(india.city.length).toBeGreaterThanOrEqual(4);
    expect(india.city.every((c) => c.detail.endsWith('India'))).toBe(true);
    expect(india.city.map((c) => c.label)).toEqual(expect.arrayContaining(['Mumbai', 'New Delhi']));
  });

  it('groups cities and time zones', () => {
    const results = searchItems(index, 'cst');
    expect(results.timezone[0]?.label).toBe('CST');
    expect(results.city).toHaveLength(0);
    expect(searchItems(index, 'central').timezone.map((t) => t.label)).toEqual(expect.arrayContaining(['CST', 'CDT']));
  });

  it('matches offsets, offering the offset page first and the abbreviation next', () => {
    const results = searchItems(index, 'utc+5:30').timezone.map((t) => t.label);
    expect(results[0]).toBe('UTC+5:30');
    expect(results).toContain('IST');
    expect(searchItems(index, 'gmt-5').timezone.map((t) => t.label)).toContain('UTC-5');
  });

  it('returns nothing for empty or unmatched queries', () => {
    expect(labels('')).toEqual([]);
    expect(labels('zzzz')).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { parseConsent, track } from './analytics';

describe('analytics helpers', () => {
  it('accepts only the two consent values', () => {
    expect(parseConsent('granted')).toBe('granted');
    expect(parseConsent('denied')).toBe('denied');
    expect(parseConsent('yes')).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent({ granted: true })).toBeNull();
  });

  it('never throws when the tag is not configured or not loaded', () => {
    // NEXT_PUBLIC_GA_MEASUREMENT_ID is unset in unit tests, so track() must be a no-op.
    expect(() => track('search_used', { query_length: 3 })).not.toThrow();
    expect(() => track('timer_completed')).not.toThrow();
  });
});

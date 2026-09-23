import { describe, expect, it } from 'vitest';
import { CONSENT_COUNTRIES, consentRegion, requiresConsent } from './analytics-region';
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

describe('consent regions', () => {
  it('asks in the EU, the EEA, the UK and Switzerland', () => {
    for (const code of ['DE', 'FR', 'IE', 'NL', 'IS', 'NO', 'LI', 'GB', 'CH']) expect(consentRegion(code), code).toBe('eu');
    expect(CONSENT_COUNTRIES.size).toBe(32); // 27 + 3 + GB + CH
  });

  it('does not ask elsewhere', () => {
    for (const code of ['IN', 'US', 'CA', 'AU', 'BR', 'JP', 'SG', 'AE']) expect(consentRegion(code), code).toBe('other');
    expect(consentRegion(' in ')).toBe('other'); // host header casing/whitespace
  });

  it('treats a missing or malformed country as unknown, which still asks', () => {
    expect(consentRegion(null)).toBe('unknown');
    expect(consentRegion('')).toBe('unknown');
    expect(consentRegion('XX1')).toBe('unknown');
    expect(requiresConsent('unknown')).toBe(true);
    expect(requiresConsent('eu')).toBe(true);
    expect(requiresConsent('other')).toBe(false);
  });
});

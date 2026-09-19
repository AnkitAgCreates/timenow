import { describe, expect, it } from 'vitest';
import { canonicalRedirect } from './canonical-host';

const live = { siteUrl: 'https://whattimein.world', indexing: true };

describe('canonical host redirect', () => {
  it('serves requests on the canonical host as-is, whatever the letter case', () => {
    expect(canonicalRedirect('whattimein.world', '/time/london/', '', live)).toBeNull();
    expect(canonicalRedirect('WhatTimeIn.World', '/', '', live)).toBeNull();
  });

  it('sends other hosts to the same path on the canonical origin, keeping the query string', () => {
    expect(canonicalRedirect('whattimein-abc123-team.vercel.app', '/time/london/', '', live)).toBe('https://whattimein.world/time/london/');
    expect(canonicalRedirect('www.whattimein.world', '/meeting-planner/', '?z=Europe%2FLondon', live)).toBe('https://whattimein.world/meeting-planner/?z=Europe%2FLondon');
    expect(canonicalRedirect('whattimein.vercel.app', '/', '', { ...live, siteUrl: 'https://whattimein.world/' })).toBe('https://whattimein.world/');
  });

  it('never redirects local servers, previews with indexing off, or a missing host', () => {
    expect(canonicalRedirect('127.0.0.1:3310', '/time/london/', '', live)).toBeNull();
    expect(canonicalRedirect('localhost:3000', '/', '', live)).toBeNull();
    expect(canonicalRedirect('[::1]:3000', '/', '', live)).toBeNull();
    expect(canonicalRedirect('whattimein-abc123-team.vercel.app', '/', '', { siteUrl: 'https://preview.whattimein.world', indexing: false })).toBeNull();
    expect(canonicalRedirect(null, '/', '', live)).toBeNull();
  });

  it('stays inert when the site URL is unset, local or invalid', () => {
    expect(canonicalRedirect('example.com', '/', '', { siteUrl: 'http://localhost:3000', indexing: true })).toBeNull();
    expect(canonicalRedirect('example.com', '/', '', { siteUrl: 'not a url', indexing: true })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { parseHash, routeToHash } from '../../src/app/router';

describe('TS-00.1 — router map (unit)', () => {
  it('routes editor hashes to the right type + id', () => {
    expect(parseHash('#/sheets/abc')).toEqual({ name: 'editor', type: 'sheets', id: 'abc' });
    expect(parseHash('#/writer/x1')).toEqual({ name: 'editor', type: 'writer', id: 'x1' });
    expect(parseHash('#/slides/9')).toEqual({ name: 'editor', type: 'slides', id: '9' });
  });

  it('falls back to home for empty / unknown / id-less hashes', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/home')).toEqual({ name: 'home' });
    expect(parseHash('#/bogus/x')).toEqual({ name: 'home' });
    expect(parseHash('#/sheets')).toEqual({ name: 'home' }); // no id
  });

  it('routeToHash round-trips', () => {
    expect(routeToHash({ name: 'home' })).toBe('#/home');
    expect(routeToHash({ name: 'editor', type: 'sheets', id: 'abc' })).toBe('#/sheets/abc');
  });
});

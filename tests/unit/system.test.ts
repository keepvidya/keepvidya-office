import { describe, expect, it } from 'vitest';
import { createIdGen, createSystemClock } from '../../src/adapters/system/system';

describe('TS-00.1 — system adapters (unit)', () => {
  it('clock returns a current epoch millisecond', () => {
    const before = Date.now();
    const t = createSystemClock().now();
    expect(typeof t).toBe('number');
    expect(t).toBeGreaterThanOrEqual(before);
  });

  it('id generator returns unique, prefixed ids', () => {
    const gen = createIdGen();
    const a = gen.next();
    const b = gen.next();
    expect(a).toMatch(/^f_/);
    expect(a).not.toBe(b);
  });
});

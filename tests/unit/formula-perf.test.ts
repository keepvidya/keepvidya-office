import { describe, expect, it } from 'vitest';
import { type CellMap, recalc } from '../../src/domain/formula';

// TC-01.6.1 — a 1,000-cell dependency chain must recalc within budget.
// Memoisation guarantees each cell is computed once, so this stays linear.
describe('TS-01.6 — performance', () => {
  it('TC-01.6.1 — 1,000-cell chain recalcs under 100ms', () => {
    const cells: CellMap = { A1: '1' };
    for (let i = 2; i <= 1000; i++) cells['A' + i] = '=A' + (i - 1) + '+1';

    const t0 = performance.now();
    const r = recalc(cells);
    const dt = performance.now() - t0;

    expect(r['A1000'].display).toBe('1000');
    expect(dt).toBeLessThan(100);
  });
});

import { describe, expect, it } from 'vitest';
import { type SheetData, compute, setCell } from '../../src/domain/sheet/sheet';

// Integration: build a sheet through successive setCell edits and verify recompute.
describe('TS-02.2 — setCell → compute (integration)', () => {
  it('TC-02.2.1 — building a total, then a dependent update', () => {
    let d: SheetData = { cells: {}, cols: 26, rows: 100 };
    const amounts: Record<string, string> = {
      B2: '4500', B3: '800', B4: '-1500', B5: '-600', B6: '-220', B7: '-500',
    };
    for (const [ref, val] of Object.entries(amounts)) d = setCell(d, ref, val);
    d = setCell(d, 'B8', '=SUM(B2:B7)');
    expect(compute(d)['B8'].display).toBe('2480');

    d = setCell(d, 'B2', '9000'); // dependency changes
    expect(compute(d)['B8'].display).toBe('6980');
  });
});

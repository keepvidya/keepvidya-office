import { describe, expect, it } from 'vitest';
import {
  type SheetData,
  aggregate,
  cellsInRange,
  compute,
  normalizeSheet,
  setCellFormat,
  setCells,
} from '../../src/domain/sheet/sheet';

const base: SheetData = { cells: {}, cols: 26, rows: 100, fmt: {} };

describe('TS-P1.1 — sheet parity domain', () => {
  it('TC-P1.1.1 — cellsInRange + setCells (batch, immutable)', () => {
    expect(cellsInRange(1, 1, 2, 2)).toEqual(['A1', 'B1', 'A2', 'B2']);
    const d = setCells(base, [
      { ref: 'A1', value: '1' },
      { ref: 'B1', value: '2' },
    ]);
    expect(d.cells['A1']).toBe('1');
    expect(d.cells['B1']).toBe('2');
    expect(base.cells['A1']).toBeUndefined(); // original unchanged
    expect(setCells(d, [{ ref: 'A1', value: '' }]).cells['A1']).toBeUndefined(); // empty clears
  });

  it('TC-P1.1.2 — setCellFormat toggles immutably', () => {
    const d = setCellFormat(base, ['A1'], { b: true });
    expect(d.fmt!['A1'].b).toBe(true);
    expect(base.fmt!['A1']).toBeUndefined();
    const d2 = setCellFormat(d, ['A1'], { b: false });
    expect(d2.fmt!['A1']).toBeUndefined(); // empty format removed
  });

  it('TC-P1.1.3 — aggregate over a range', () => {
    const r = compute({ cells: { A1: '10', A2: '20', A3: '30' }, cols: 26, rows: 100 });
    expect(aggregate(r, cellsInRange(1, 1, 1, 3))).toEqual({ count: 3, sum: 60, avg: 20, min: 10, max: 30 });
  });

  it('TC-P1.1.4 — normalizeSheet carries fmt', () => {
    expect(normalizeSheet({ cells: {}, fmt: { A1: { b: true } } }).fmt!['A1'].b).toBe(true);
    expect(normalizeSheet(undefined).fmt).toEqual({});
  });
});

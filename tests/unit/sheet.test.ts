import { describe, expect, it } from 'vitest';
import {
  type SheetData,
  aggregate,
  clearCell,
  compute,
  normalizeSheet,
  setCell,
} from '../../src/domain/sheet/sheet';

const base: SheetData = { cells: {}, cols: 26, rows: 100 };

describe('TS-02.1 — sheet domain (unit)', () => {
  it('TC-02.1.1 — setCell / clearCell are immutable', () => {
    const d1 = setCell(base, 'A1', '10');
    expect(d1.cells['A1']).toBe('10');
    expect(base.cells['A1']).toBeUndefined(); // original untouched
    const d2 = setCell(d1, 'A1', '');
    expect(d2.cells['A1']).toBeUndefined(); // empty clears
    expect(clearCell(d1, 'A1').cells['A1']).toBeUndefined();
  });

  it('TC-02.1.2 — compute delegates to the engine', () => {
    const r = compute({ cells: { A1: '2', A2: '3', A3: '=A1+A2' }, cols: 26, rows: 100 });
    expect(r['A3'].display).toBe('5');
  });

  it('TC-02.1.3 — aggregate summarises a selection (text ignored)', () => {
    const r = compute({ cells: { A1: '10', A2: '20', A3: 'apple' }, cols: 26, rows: 100 });
    expect(aggregate(r, ['A1', 'A2', 'A3'])).toEqual({
      count: 2,
      sum: 30,
      avg: 15,
      min: 10,
      max: 20,
    });
    const empty = compute({ cells: { A1: 'apple' }, cols: 26, rows: 100 });
    expect(aggregate(empty, ['A1'])).toEqual({ count: 0, sum: 0, avg: null, min: null, max: null });
  });

  it('TC-02.1.4 — normalizeSheet guards bad input', () => {
    expect(normalizeSheet(undefined)).toEqual({ cells: {}, cols: 26, rows: 100 });
    const n = normalizeSheet({ cells: { A1: '1' } });
    expect(n.cells['A1']).toBe('1');
    expect(n.cols).toBe(26);
    expect(n.rows).toBe(100);
    // too-small dimensions are clamped up to the minimum grid
    expect(normalizeSheet({ cols: 5, rows: 5 })).toEqual({ cells: {}, cols: 26, rows: 100 });
  });
});

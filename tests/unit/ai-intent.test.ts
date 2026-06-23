import { describe, expect, it } from 'vitest';
import { validateSheetIntent } from '../../src/ai/intent/sheet-intent';
import { applySheetIntent } from '../../src/ai/applier/sheet-applier';
import { type SheetData, compute } from '../../src/domain/sheet/sheet';

describe('TS-03.1 — intent validation & application', () => {
  it('TC-03.1.1 — valid intent parses', () => {
    const r = validateSheetIntent('{"writes":[{"ref":"A1","value":"Hi"}]}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.writes[0]).toEqual({ ref: 'A1', value: 'Hi' });
  });

  it('TC-03.1.2 — malformed JSON / wrong shape → typed Err', () => {
    expect(validateSheetIntent('not json').ok).toBe(false);
    expect(validateSheetIntent('5').ok).toBe(false); // not an object
    expect(validateSheetIntent('{"writes":"x"}').ok).toBe(false); // writes not array
    expect(validateSheetIntent('{"writes":[]}').ok).toBe(false); // empty
    expect(validateSheetIntent('{"writes":[5]}').ok).toBe(false); // item not object
    expect(validateSheetIntent('{"writes":[{"ref":"A1"}]}').ok).toBe(false); // missing value
    expect(validateSheetIntent('{"writes":[{"ref":"A1","value":5}]}').ok).toBe(false); // value not string
  });

  it('TC-03.1.3 — bad cell ref rejected', () => {
    expect(validateSheetIntent('{"writes":[{"ref":"1A","value":"x"}]}').ok).toBe(false);
    expect(validateSheetIntent('{"writes":[{"ref":"A0","value":"x"}]}').ok).toBe(false);
  });

  it('caps oversized output', () => {
    const big = JSON.stringify({
      writes: Array.from({ length: 501 }, () => ({ ref: 'A1', value: 'x' })),
    });
    expect(validateSheetIntent(big).ok).toBe(false);
  });

  it('extracts JSON from fenced/prose output + uppercases refs', () => {
    const r = validateSheetIntent('Sure!\n```json\n{"writes":[{"ref":"a1","value":"x"}]}\n```');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.writes[0].ref).toBe('A1');
  });

  it('TC-03.1.4 — applySheetIntent immutable + values land', () => {
    const base: SheetData = { cells: {}, cols: 26, rows: 100 };
    const next = applySheetIntent(base, {
      writes: [
        { ref: 'A1', value: '2' },
        { ref: 'A2', value: '=A1*3' },
      ],
    });
    expect(next.cells['A1']).toBe('2');
    expect(base.cells['A1']).toBeUndefined(); // original untouched
    expect(compute(next)['A2'].display).toBe('6');
  });
});

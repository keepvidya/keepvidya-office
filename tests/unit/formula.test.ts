import { describe, expect, it } from 'vitest';
import {
  type CellMap,
  colToNum,
  evaluateFormula,
  numToCol,
  parseRef,
  recalc,
} from '../../src/domain/formula';

const val = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).value;
const disp = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).display;

describe('TS-01.1 — operators & precedence', () => {
  it('TC-01.1.1 — arithmetic + precedence', () => {
    expect(val('=A1*2+A2', { A1: '10', A2: '20' })).toBe(40);
    expect(val('=2+3*4')).toBe(14);
    expect(val('=(2+3)*4')).toBe(20);
    expect(val('=10/4')).toBe(2.5);
  });
  it('TC-01.1.2 — concat, percent, comparison, unary', () => {
    expect(val('="a"&"b"&1')).toBe('ab1');
    expect(val('=50%')).toBe(0.5);
    expect(val('=3>2')).toBe(true);
    expect(val('=-(2)+5')).toBe(3);
  });
  it('TC-01.1.3 — power', () => {
    expect(val('=2^10')).toBe(1024);
  });
});

describe('TS-01.2 — function library', () => {
  const f: CellMap = { A1: '10', A2: '20', A3: '30', A4: 'apple', A5: 'banana' };
  it('TC-01.2.1 — aggregate / math / logic / text', () => {
    expect(val('=SUM(A1:A3)', f)).toBe(60);
    expect(val('=AVERAGE(A1:A3)', f)).toBe(20);
    expect(val('=MIN(A1:A3)', f)).toBe(10);
    expect(val('=MAX(A1:A3)', f)).toBe(30);
    expect(val('=IF(SUM(A1:A3)>50,"big","small")', f)).toBe('big');
    expect(val('=ROUND(PI(),2)')).toBe(3.14);
    expect(val('=CONCAT(A4," ",A5)', f)).toBe('apple banana');
    expect(val('=LEN(UPPER(A4))', f)).toBe(5);
  });
  it('TC-01.2.2 — lookup / conditional aggregate', () => {
    const g: CellMap = { A1: '10', A2: '20', A3: '30' };
    expect(val('=VLOOKUP(20,A1:A3,1,FALSE)', g)).toBe(20);
    expect(val('=MATCH(30,A1:A3,0)', g)).toBe(3);
    expect(val('=INDEX(A1:A3,2)', g)).toBe(20);
    expect(val('=COUNTIF(A1:A3,">15")', g)).toBe(2);
    expect(val('=SUMIF(A1:A3,">=20")', g)).toBe(50);
  });
});

describe('TS-01.3 — references & dependencies', () => {
  it('TC-01.3.1 — A1 helpers round-trip', () => {
    expect(colToNum('A')).toBe(1);
    expect(colToNum('AA')).toBe(27);
    expect(numToCol(1)).toBe('A');
    expect(numToCol(27)).toBe('AA');
    expect(parseRef('$B$3')).toEqual({ col: 2, row: 3 });
    expect(parseRef('not-a-ref')).toBeNull();
  });
  it('TC-01.3.2 — transitive dependencies + ranges', () => {
    const r = recalc({ A1: '5', B1: '=A1*2', C1: '=B1+1', D1: '=SUM(A1:C1)' });
    expect(r['B1'].display).toBe('10');
    expect(r['C1'].display).toBe('11');
    expect(r['D1'].display).toBe('26');
  });
});

describe('TS-01.4 — errors & circular refs', () => {
  it('TC-01.4.1 — error values', () => {
    const e = evaluateFormula('=A1/0', { A1: '1' });
    expect(e.display).toBe('#DIV/0!');
    expect(e.isError).toBe(true);
    expect(disp('=FOO()')).toBe('#NAME?');
    expect(disp('=SQRT(-1)')).toBe('#NUM!');
    expect(val('=IFERROR(A1/0,"safe")', { A1: '1' })).toBe('safe');
  });
  it('TC-01.4.2 — circular reference is detected (no hang)', () => {
    const r = recalc({ C1: '=C2', C2: '=C1' }); // must return, not loop forever
    expect(r['C1'].display).toBe('#CIRC!');
    expect(r['C1'].isError).toBe(true);
  });
});

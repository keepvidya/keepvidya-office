import { describe, expect, it } from 'vitest';
import { type CellMap, evaluateFormula, recalc } from '../../src/domain/formula';

const v = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).value;
const d = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).display;
const nums: CellMap = { A1: '1', A2: '2', A3: '3' };
const words: CellMap = { A4: 'apple', A5: 'apricot' };

describe('TS-01.2 — criteria operators (COUNTIF/SUMIF)', () => {
  it('all comparison + equality + wildcard forms', () => {
    expect(v('=COUNTIF(A1:A3,"<2")', nums)).toBe(1);
    expect(v('=COUNTIF(A1:A3,">2")', nums)).toBe(1);
    expect(v('=COUNTIF(A1:A3,"<=2")', nums)).toBe(2);
    expect(v('=COUNTIF(A1:A3,">=2")', nums)).toBe(2);
    expect(v('=COUNTIF(A1:A3,"<>2")', nums)).toBe(2);
    expect(v('=COUNTIF(A1:A3,"=2")', nums)).toBe(1);
    expect(v('=COUNTIF(A1:A3,2)', nums)).toBe(1); // numeric criterion
    expect(v('=COUNTIF(A4:A5,"ap*")', words)).toBe(2); // wildcard
    expect(v('=COUNTIF(A4:A5,"apple")', words)).toBe(1); // string equality
    expect(v('=COUNTIF(A4:A5,"<>apple")', words)).toBe(1);
    expect(v('=SUMIF(A1:A3,"<3")', nums)).toBe(3);
    expect(v('=SUMIF(A1:A3,">1",A1:A3)', nums)).toBe(5); // explicit sum range
  });
});

describe('TS-01.2 — optional-argument variants', () => {
  it('default-arg branches', () => {
    expect(v('=ROUND(2.345)')).toBe(2);
    expect(v('=ROUNDUP(2.4)')).toBe(3);
    expect(v('=ROUNDDOWN(2.6)')).toBe(2);
    expect(v('=LOG(8,2)')).toBe(3);
    expect(v('=CEILING(7)')).toBe(7);
    expect(v('=FLOOR(7)')).toBe(7);
    expect(v('=LEFT("hello")')).toBe('h');
    expect(v('=RIGHT("hello")')).toBe('o');
    expect(v('=FIND("l","hello",4)')).toBe(4);
    expect(v('=SEARCH("L","hello",4)')).toBe(4);
    expect(v('=MATCH(2,A1:A3)', nums)).toBe(2); // default approx
    expect(v('=TEXT(5,"0")')).toBe('5'); // no-decimal branch
    expect(v('=HLOOKUP("apple",A4:A5,1)', words)).toBe('apple'); // approx, no flag
  });
  it('IF arity branches', () => {
    expect(v('=IF(1>0,"yes")')).toBe('yes');
    expect(v('=IF(1<0,"yes")')).toBe(false); // no else
    expect(v('=IF(1>0)')).toBe(true); // no then/else
  });
  it('empty-numeric aggregates', () => {
    expect(v('=MAX(A4:A5)', words)).toBe(0);
    expect(v('=MIN(A4:A5)', words)).toBe(0);
    expect(v('=COUNT(A4:A5)', words)).toBe(0);
    expect(d('=AVERAGE(A4:A5)', words)).toBe('#DIV/0!');
  });
});

describe('TS-01.1 — coercion & tokenizer branches', () => {
  it('boolean/number/text coercion paths', () => {
    expect(recalc({ A1: 'TRUE', A2: '5', B1: '=SUM(A1:A2)' })['B1'].display).toBe('6'); // bool→1 in sum
    expect(v('="x"&5')).toBe('x5');
    expect(v('=TRUE+1')).toBe(2);
    expect(v('=IF(5,"a","b")')).toBe('a');
    expect(v('=IF(0,"a","b")')).toBe('b');
    expect(v('=IF("true","a","b")')).toBe('a');
    expect(v('=IF("false","a","b")')).toBe('b');
  });
  it('blank handling + whitespace', () => {
    const sparse: CellMap = { A1: '1', A3: '3' }; // A2 blank
    expect(v('=COUNTA(A1:A3)', sparse)).toBe(2);
    expect(v('=COUNTBLANK(A1:A3)', sparse)).toBe(1);
    expect(v('= 1 + 2 ')).toBe(3); // whitespace tokens
  });
  it('error propagation through text concat + bare name', () => {
    expect(recalc({ A1: '=1/0', A2: 'x', B1: '=CONCAT(A1:A2)' })['B1'].display).toBe('#DIV/0!');
    expect(d('=ABC')).toBe('#NAME?'); // name not called as function
    expect(d('="a"<="b"')).toBe('TRUE'); // string <=
  });

  it('blank-vs-typed comparison coercion', () => {
    expect(v('=A9=0')).toBe(true); // blank ↔ 0 (number side)
    expect(v('=0=A9')).toBe(true); // blank on the right
    expect(v('=A9=""')).toBe(true); // blank ↔ "" (string side)
    expect(v('="x"=A9')).toBe(false); // text vs blank
    expect(v('=""+1')).toBe(1); // empty string coerces to 0 in arithmetic
  });

  it('HLOOKUP approximate (numeric header) + YEAR error', () => {
    const t: CellMap = { A1: '10', B1: '20', C1: '30', A2: 'a', B2: 'b', C2: 'c' };
    expect(v('=HLOOKUP(25,A1:C2,2)', t)).toBe('b'); // approx → 20's column
    expect(d('=YEAR("not-a-date")')).toBe('#VALUE!');
    expect(recalc({ A1: '1', A2: '2', B1: '=A1:A2' })['B1'].display).toBe('1'); // range collapses to top-left
  });

  it('error-path branches across the library', () => {
    const t: CellMap = { A1: '10', B1: '20', C1: '30', A2: 'a', B2: 'b', C2: 'c' };
    expect(d('=VLOOKUP(20,A1:A3,5,FALSE)', nums)).toBe('#REF!');
    expect(d('=HLOOKUP("zzz",A1:C2,2,FALSE)', t)).toBe('#N/A');
    expect(d('=MATCH(0,A1:A3,1)', nums)).toBe('#N/A');
    expect(d('=IFS(1<0,1)')).toBe('#N/A');
    expect(d('=CHOOSE(0,"a")')).toBe('#VALUE!');
    expect(d('=STDEV(1)')).toBe('#DIV/0!');
    expect(d('=VAR(1)')).toBe('#DIV/0!');
    expect(d('=MOD(5,0)')).toBe('#DIV/0!');
    expect(d('=LN(0)')).toBe('#NUM!');
    expect(d('=MEDIAN(A4:A5)', words)).toBe('#NUM!'); // no numbers
    expect(d('=FIND("z","abc")')).toBe('#VALUE!');
    expect(d('=2^5000')).toBe('#NUM!'); // overflow → not finite
    expect(recalc({ A1: '1', A3: '3', B1: '=INDEX(A1:A3,2)' })['B1'].display).toBe(''); // empty cell → blank
  });

  it('string comparison directions', () => {
    expect(v('="b">"a"')).toBe(true);
    expect(v('="a"="a"')).toBe(true);
    expect(v('="a">="a"')).toBe(true);
  });
});

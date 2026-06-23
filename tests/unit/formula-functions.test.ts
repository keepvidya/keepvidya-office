import { describe, expect, it } from 'vitest';
import { type CellMap, evaluateFormula, recalc } from '../../src/domain/formula';

const v = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).value;
const d = (expr: string, cells: CellMap = {}) => evaluateFormula(expr, cells).display;

describe('TS-01.2 — broad function coverage', () => {
  it('math', () => {
    expect(v('=PRODUCT(2,3,4)')).toBe(24);
    expect(v('=MEDIAN(1,2,3,4)')).toBe(2.5);
    expect(v('=MEDIAN(1,2,3)')).toBe(2);
    expect(v('=ROUNDUP(2.1,0)')).toBe(3);
    expect(v('=ROUNDDOWN(2.9,0)')).toBe(2);
    expect(v('=INT(2.9)')).toBe(2);
    expect(v('=TRUNC(-2.9)')).toBe(-2);
    expect(v('=ABS(-5)')).toBe(5);
    expect(v('=POWER(2,3)')).toBe(8);
    expect(v('=EXP(0)')).toBe(1);
    expect(v('=LN(1)')).toBe(0);
    expect(v('=LOG(100)')).toBe(2);
    expect(v('=LOG10(1000)')).toBe(3);
    expect(v('=MOD(7,3)')).toBe(1);
    expect(v('=CEILING(2.1,1)')).toBe(3);
    expect(v('=FLOOR(2.9,1)')).toBe(2);
    expect(v('=SIGN(-3)')).toBe(-1);
    expect(v('=STDEV(1,2,3)')).toBe(1);
    expect(v('=VAR(1,2,3)')).toBe(1);
    expect(v('=AVG(2,4)')).toBe(3);
    expect(v('=RANDBETWEEN(5,5)')).toBe(5);
    const r = v('=RAND()') as number;
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });

  it('logic', () => {
    expect(v('=IFS(FALSE,1,TRUE,2)')).toBe(2);
    expect(v('=AND(TRUE,1>0)')).toBe(true);
    expect(v('=OR(FALSE,FALSE)')).toBe(false);
    expect(v('=NOT(FALSE)')).toBe(true);
    expect(v('=XOR(TRUE,FALSE,FALSE)')).toBe(true);
    expect(v('=TRUE()')).toBe(true);
    expect(v('=FALSE()')).toBe(false);
  });

  it('text', () => {
    expect(v('=CONCATENATE("a","b")')).toBe('ab');
    expect(v('=LEFT("hello",2)')).toBe('he');
    expect(v('=RIGHT("hello",2)')).toBe('lo');
    expect(v('=MID("hello",2,3)')).toBe('ell');
    expect(v('=LOWER("AB")')).toBe('ab');
    expect(v('=PROPER("hello world")')).toBe('Hello World');
    expect(v('=TRIM("  a   b  ")')).toBe('a b');
    expect(v('=REPT("ab",3)')).toBe('ababab');
    expect(v('=SUBSTITUTE("a-b-c","-","_")')).toBe('a_b_c');
    expect(v('=FIND("b","abc")')).toBe(2);
    expect(v('=SEARCH("B","abc")')).toBe(2);
    expect(v('=VALUE("42")')).toBe(42);
    expect(v('=TEXT(3.14159,"0.00")')).toBe('3.14');
    expect(v('=CHAR(65)')).toBe('A');
    expect(v('=CODE("A")')).toBe(65);
  });

  it('lookup (approx + table)', () => {
    const g: CellMap = { A1: '10', A2: '20', A3: '30' };
    expect(v('=VLOOKUP(25,A1:A3,1)', g)).toBe(20); // approximate
    expect(v('=MATCH(25,A1:A3,1)', g)).toBe(2);
    expect(v('=CHOOSE(2,"a","b","c")')).toBe('b');
    const t: CellMap = { A1: 'x', B1: 'y', C1: 'z', A2: '1', B2: '2', C2: '3' };
    expect(v('=HLOOKUP("y",A1:C2,2,FALSE)', t)).toBe(2);
    expect(v('=INDEX(A1:C2,2,3)', t)).toBe(3);
  });

  it('info + date', () => {
    expect(v('=ISERROR(A1/0)', { A1: '1' })).toBe(true);
    expect(v('=ISERROR(5)')).toBe(false);
    expect(v('=ISNUMBER(5)')).toBe(true);
    expect(v('=ISNUMBER("x")')).toBe(false);
    expect(v('=ISBLANK(A9)')).toBe(true);
    expect(v('=YEAR("2020-05-15")')).toBe(2020);
    expect(v('=MONTH("2020-05-15")')).toBe(5);
    expect(v('=DAY("2020-05-15")')).toBe(15);
    expect(typeof v('=TODAY()')).toBe('string');
    expect((v('=NOW()') as string).length).toBeGreaterThan(0);
  });
});

describe('TS-01.1/01.4 — coercion, comparisons & error edges', () => {
  it('comparison operators', () => {
    expect(v('=1<2')).toBe(true);
    expect(v('=2<=2')).toBe(true);
    expect(v('=3>=4')).toBe(false);
    expect(v('=1<>2')).toBe(true);
    expect(v('=2=2')).toBe(true);
    expect(v('="a"<"b"')).toBe(true);
    expect(v('=+5')).toBe(5); // unary plus
  });

  it('coercion edges', () => {
    expect(v('="x"&TRUE()')).toBe('xTRUE');
    expect(v('=TRUE()+1')).toBe(2);
    expect(v('=3/2')).toBe(1.5);
    expect(d('=IF("notbool",1,2)')).toBe('#VALUE!'); // toBool throws on non-bool text
  });

  it('errors propagate through aggregation', () => {
    const r = recalc({ A1: '=1/0', A2: '5', B1: '=SUM(A1:A2)' });
    expect(r['B1'].display).toBe('#DIV/0!');
  });

  it('lookup / index failures', () => {
    const g: CellMap = { A1: '10', A2: '20', A3: '30' };
    expect(d('=VLOOKUP(99,A1:A3,1,FALSE)', g)).toBe('#N/A');
    expect(d('=MATCH(99,A1:A3,0)', g)).toBe('#N/A');
    expect(d('=INDEX(A1:A3,9)', g)).toBe('#REF!');
    expect(d('=CHOOSE(9,"a")')).toBe('#VALUE!');
  });

  it('malformed input → #ERROR!, unknown fn → #NAME?', () => {
    expect(d('=@')).toBe('#ERROR!'); // bad token
    expect(d('=SUM(1,2')).toBe('#ERROR!'); // missing paren
    expect(d('=1+')).toBe('#ERROR!'); // dangling operator
    expect(d('=NOPE()')).toBe('#NAME?');
  });

  it('quotes + literals', () => {
    expect(v('="a""b"')).toBe('a"b'); // escaped quote
    expect(recalc({ A1: 'TRUE' })['A1'].value).toBe(true); // literal boolean
    expect(recalc({ A1: 'hello' })['A1'].display).toBe('hello'); // literal text
  });
});

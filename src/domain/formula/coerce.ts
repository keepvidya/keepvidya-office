// Value coercion + gathering. Errors propagate via controlled throws caught at
// the cell boundary (engine.ts). No DOM, no vendor.
import { type EvalValue, type PlainScalar, type Scalar, ERR, isErr, isRange } from './types';

// Collapse a value to a single scalar; error values are thrown (caught at the cell boundary),
// so the result is always a plain (non-error) scalar.
export function asScalar(v: EvalValue): PlainScalar {
  if (isRange(v)) {
    /* v8 ignore next -- empty ranges don't arise from the grid */
    const c = v.__range.length && v.__range[0].length ? v.__range[0][0] : null;
    return scalarCheck(c);
  }
  return scalarCheck(v);
}
function scalarCheck(v: Scalar): PlainScalar {
  if (isErr(v)) throw v;
  return v;
}

export function num(v: EvalValue): number {
  const s = asScalar(v);
  if (s == null || s === '') return 0;
  if (typeof s === 'number') return s;
  if (typeof s === 'boolean') return s ? 1 : 0;
  const n = Number(s);
  if (!isNaN(n)) return n;
  throw ERR('#VALUE!');
}

export function text(v: EvalValue): string {
  const s = asScalar(v);
  if (s == null) return '';
  if (typeof s === 'boolean') return s ? 'TRUE' : 'FALSE';
  if (typeof s === 'number') return numToStr(s);
  return String(s);
}

export function toBool(v: EvalValue): boolean {
  const s = asScalar(v);
  if (s == null || s === '') return false;
  if (typeof s === 'boolean') return s;
  if (typeof s === 'number') return s !== 0;
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  throw ERR('#VALUE!');
}

export function numToStr(n: number): string {
  if (!isFinite(n)) return '#NUM!';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(10)));
}

export function collectNums(v: EvalValue, out: number[]): void {
  if (isRange(v)) {
    for (const row of v.__range) for (const c of row) pushNum(c, out);
    return;
  }
  pushNum(v as Scalar, out);
}
function pushNum(c: Scalar, out: number[]): void {
  if (isErr(c)) throw c;
  if (c == null || c === '') return;
  if (typeof c === 'number') out.push(c);
  else if (typeof c === 'boolean') out.push(c ? 1 : 0);
}

export function collectAll(v: EvalValue, out: Scalar[]): void {
  if (isRange(v)) {
    for (const row of v.__range)
      for (const c of row) {
        if (isErr(c)) throw c;
        out.push(c);
      }
    return;
  }
  if (isErr(v)) throw v;
  out.push(v as Scalar);
}

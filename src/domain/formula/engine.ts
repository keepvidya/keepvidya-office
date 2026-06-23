// Public engine: dependency-aware recalculation with memoisation + circular
// detection. Facade over tokenizer/parser/evaluator. Pure — no DOM/vendor.
import {
  type CellMap,
  type CellResult,
  type Resolver,
  type Scalar,
  ERR,
  isErr,
  isRange,
} from './types';
import { numToStr } from './coerce';
import { tokenize } from './tokenizer';
import { parse } from './parser';
import { evalNode } from './evaluator';
import { makeRef, parseRef } from './refs';

export function recalc(cells: CellMap): Record<string, CellResult> {
  const cache: Record<string, Scalar> = Object.create(null);
  const visiting: Record<string, boolean> = Object.create(null);

  function valueOf(ref: string): Scalar {
    if (ref in cache) return cache[ref];
    if (visiting[ref]) throw ERR('#CIRC!');
    const raw = cells[ref];
    if (raw == null || raw === '') return (cache[ref] = null);
    if (typeof raw === 'number') return (cache[ref] = raw);
    const s = String(raw);
    if (s[0] === '=') {
      visiting[ref] = true;
      let v;
      try {
        v = evalNode(parse(tokenize(s.slice(1))), R);
      } catch (e) {
        /* v8 ignore next -- defensive: all engine throws are ErrorValue */
        v = isErr(e) ? e : ERR('#ERROR!');
      }
      delete visiting[ref];
      const collapsed: Scalar = isRange(v)
        ? v.__range.length && v.__range[0].length
          ? v.__range[0][0]
          : null
        : v;
      return (cache[ref] = collapsed);
    }
    return (cache[ref] = literal(s));
  }

  function rangeOf(aRef: string, bRef: string): Scalar[][] {
    const A = parseRef(aRef);
    const B = parseRef(bRef);
    if (!A || !B) throw ERR('#REF!');
    const c1 = Math.min(A.col, B.col);
    const c2 = Math.max(A.col, B.col);
    const r1 = Math.min(A.row, B.row);
    const r2 = Math.max(A.row, B.row);
    const out: Scalar[][] = [];
    for (let r = r1; r <= r2; r++) {
      const row: Scalar[] = [];
      for (let c = c1; c <= c2; c++) row.push(valueOf(makeRef(c, r)));
      out.push(row);
    }
    return out;
  }

  const R: Resolver = { cell: valueOf, range: rangeOf };

  const out: Record<string, CellResult> = Object.create(null);
  for (const ref in cells) {
    const raw = cells[ref];
    if (raw == null || raw === '') continue;
    let v: Scalar;
    try {
      v = valueOf(ref);
    } catch (e) {
      /* v8 ignore next -- defensive: all engine throws are ErrorValue */
      v = isErr(e) ? e : ERR('#ERROR!');
    }
    out[ref] = present(v);
  }
  return out;
}

// Evaluate a single expression against a (optional) cell map. Used by tests + quick eval.
export function evaluateFormula(expr: string, cells: CellMap = {}): CellResult {
  const probe = expr.startsWith('=') ? expr : '=' + expr;
  const r = recalc({ ...cells, __probe: probe });
  return r['__probe'] ?? present(null);
}

function present(v: Scalar): CellResult {
  if (isErr(v)) return { value: v, display: v.__err, isError: true, isNumber: false };
  if (v == null) return { value: null, display: '', isError: false, isNumber: false };
  if (typeof v === 'number') return { value: v, display: numToStr(v), isError: false, isNumber: true };
  if (typeof v === 'boolean')
    return { value: v, display: v ? 'TRUE' : 'FALSE', isError: false, isNumber: false };
  return { value: v, display: String(v), isError: false, isNumber: false };
}

function literal(s: string): Scalar {
  if (s === '') return null;
  if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s.trim())) return parseFloat(s);
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  return s;
}

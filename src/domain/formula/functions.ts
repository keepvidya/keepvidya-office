// Function library — a name→implementation registry (Strategy). Adding a function
// is open/closed: no change to tokenizer/parser/evaluator. Functions receive arg
// AST nodes + a context (lazy eval), so IF/IFERROR/CHOOSE short-circuit correctly.
import { type FnImpl, type Scalar, ERR, isErr } from './types';
import { asScalar, num, numToStr, text, toBool } from './coerce';

const FUNCTIONS: Record<string, FnImpl> = {
  // ---- math / aggregate ----
  SUM: (a, C) => C.nums(a).reduce((s, n) => s + n, 0),
  PRODUCT: (a, C) => C.nums(a).reduce((s, n) => s * n, 1),
  AVERAGE: (a, C) => {
    const n = C.nums(a);
    if (!n.length) throw ERR('#DIV/0!');
    return n.reduce((s, x) => s + x, 0) / n.length;
  },
  AVG: (a, C) => FUNCTIONS.AVERAGE(a, C),
  MEDIAN: (a, C) => {
    const n = C.nums(a).sort((x, y) => x - y);
    if (!n.length) throw ERR('#NUM!');
    const m = Math.floor(n.length / 2);
    return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2;
  },
  MIN: (a, C) => {
    const n = C.nums(a);
    return n.length ? Math.min(...n) : 0;
  },
  MAX: (a, C) => {
    const n = C.nums(a);
    return n.length ? Math.max(...n) : 0;
  },
  COUNT: (a, C) => C.nums(a).length,
  COUNTA: (a, C) => C.flat(a).filter((v) => v != null && v !== '').length,
  COUNTBLANK: (a, C) => C.flat(a).filter((v) => v == null || v === '').length,
  ROUND: (a, C) => {
    const f = Math.pow(10, a[1] ? num(C.ev(a[1])) : 0);
    return Math.round(num(C.ev(a[0])) * f) / f;
  },
  ROUNDUP: (a, C) => {
    const f = Math.pow(10, a[1] ? num(C.ev(a[1])) : 0);
    const x = num(C.ev(a[0]));
    return ((x < 0 ? -1 : 1) * Math.ceil(Math.abs(x) * f)) / f;
  },
  ROUNDDOWN: (a, C) => {
    const f = Math.pow(10, a[1] ? num(C.ev(a[1])) : 0);
    const x = num(C.ev(a[0]));
    return ((x < 0 ? -1 : 1) * Math.floor(Math.abs(x) * f)) / f;
  },
  INT: (a, C) => Math.floor(num(C.ev(a[0]))),
  TRUNC: (a, C) => {
    const x = num(C.ev(a[0]));
    return x < 0 ? Math.ceil(x) : Math.floor(x);
  },
  ABS: (a, C) => Math.abs(num(C.ev(a[0]))),
  SQRT: (a, C) => {
    const x = num(C.ev(a[0]));
    if (x < 0) throw ERR('#NUM!');
    return Math.sqrt(x);
  },
  POWER: (a, C) => Math.pow(num(C.ev(a[0])), num(C.ev(a[1]))),
  EXP: (a, C) => Math.exp(num(C.ev(a[0]))),
  LN: (a, C) => {
    const x = num(C.ev(a[0]));
    if (x <= 0) throw ERR('#NUM!');
    return Math.log(x);
  },
  LOG: (a, C) => {
    const x = num(C.ev(a[0]));
    const b = a[1] ? num(C.ev(a[1])) : 10;
    return Math.log(x) / Math.log(b);
  },
  LOG10: (a, C) => Math.log10(num(C.ev(a[0]))),
  MOD: (a, C) => {
    const d = num(C.ev(a[1]));
    if (d === 0) throw ERR('#DIV/0!');
    const n = num(C.ev(a[0]));
    return n - d * Math.floor(n / d);
  },
  CEILING: (a, C) => {
    const x = num(C.ev(a[0]));
    const s = a[1] ? num(C.ev(a[1])) : 1;
    return s === 0 ? 0 : Math.ceil(x / s) * s;
  },
  FLOOR: (a, C) => {
    const x = num(C.ev(a[0]));
    const s = a[1] ? num(C.ev(a[1])) : 1;
    return s === 0 ? 0 : Math.floor(x / s) * s;
  },
  SIGN: (a, C) => Math.sign(num(C.ev(a[0]))),
  PI: () => Math.PI,
  RAND: () => Math.random(),
  RANDBETWEEN: (a, C) => {
    const lo = num(C.ev(a[0]));
    const hi = num(C.ev(a[1]));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },
  STDEV: (a, C) => {
    const n = C.nums(a);
    if (n.length < 2) throw ERR('#DIV/0!');
    const m = n.reduce((s, x) => s + x, 0) / n.length;
    return Math.sqrt(n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1));
  },
  VAR: (a, C) => {
    const n = C.nums(a);
    if (n.length < 2) throw ERR('#DIV/0!');
    const m = n.reduce((s, x) => s + x, 0) / n.length;
    return n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1);
  },
  SUMIF: (a, C) => {
    const range = C.range(a[0]).flat();
    const crit = asScalar(C.ev(a[1]));
    const sumRange = a[2] ? C.range(a[2]).flat() : range;
    let s = 0;
    range.forEach((v, i) => {
      if (matchCriteria(v, crit)) s += Number(sumRange[i]) || 0;
    });
    return s;
  },
  COUNTIF: (a, C) => {
    const range = C.range(a[0]).flat();
    const crit = asScalar(C.ev(a[1]));
    return range.filter((v) => matchCriteria(v, crit)).length;
  },
  // ---- logic ----
  IF: (a, C) => (toBool(C.ev(a[0])) ? (a[1] ? C.ev(a[1]) : true) : a[2] ? C.ev(a[2]) : false),
  IFERROR: (a, C) => {
    try {
      const v = C.ev(a[0]);
      asScalar(v);
      return v;
    } catch (e) {
      if (isErr(e)) return C.ev(a[1]);
      throw e;
    }
  },
  IFS: (a, C) => {
    for (let i = 0; i < a.length; i += 2) if (toBool(C.ev(a[i]))) return C.ev(a[i + 1]);
    throw ERR('#N/A');
  },
  AND: (a, C) => a.every((n) => toBool(C.ev(n))),
  OR: (a, C) => a.some((n) => toBool(C.ev(n))),
  NOT: (a, C) => !toBool(C.ev(a[0])),
  XOR: (a, C) => a.reduce((acc, n) => acc !== toBool(C.ev(n)), false),
  TRUE: () => true,
  FALSE: () => false,
  // ---- text ----
  CONCAT: (a, C) =>
    C.flat(a)
      .map((v) => (v == null ? '' : typeof v === 'number' ? numToStr(v) : String(v)))
      .join(''),
  CONCATENATE: (a, C) => FUNCTIONS.CONCAT(a, C),
  LEN: (a, C) => text(C.ev(a[0])).length,
  LEFT: (a, C) => text(C.ev(a[0])).slice(0, a[1] ? num(C.ev(a[1])) : 1),
  RIGHT: (a, C) => {
    const s = text(C.ev(a[0]));
    const n = a[1] ? num(C.ev(a[1])) : 1;
    return s.slice(Math.max(0, s.length - n));
  },
  MID: (a, C) => text(C.ev(a[0])).substr(num(C.ev(a[1])) - 1, num(C.ev(a[2]))),
  UPPER: (a, C) => text(C.ev(a[0])).toUpperCase(),
  LOWER: (a, C) => text(C.ev(a[0])).toLowerCase(),
  PROPER: (a, C) => text(C.ev(a[0])).replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  TRIM: (a, C) => text(C.ev(a[0])).trim().replace(/\s+/g, ' '),
  REPT: (a, C) => text(C.ev(a[0])).repeat(Math.max(0, num(C.ev(a[1])))),
  SUBSTITUTE: (a, C) => {
    const s = text(C.ev(a[0]));
    const o = text(C.ev(a[1]));
    const n = text(C.ev(a[2]));
    return o === '' ? s : s.split(o).join(n);
  },
  FIND: (a, C) => {
    const i = text(C.ev(a[1])).indexOf(text(C.ev(a[0])), a[2] ? num(C.ev(a[2])) - 1 : 0);
    if (i < 0) throw ERR('#VALUE!');
    return i + 1;
  },
  SEARCH: (a, C) => {
    const i = text(C.ev(a[1]))
      .toLowerCase()
      .indexOf(text(C.ev(a[0])).toLowerCase(), a[2] ? num(C.ev(a[2])) - 1 : 0);
    if (i < 0) throw ERR('#VALUE!');
    return i + 1;
  },
  VALUE: (a, C) => num(C.ev(a[0])),
  TEXT: (a, C) => {
    const v = num(C.ev(a[0]));
    const f = text(C.ev(a[1]));
    const dec = (f.match(/\.(0+)/) ?? [, ''])[1]?.length ?? 0;
    return dec ? v.toFixed(dec) : numToStr(v);
  },
  CHAR: (a, C) => String.fromCharCode(num(C.ev(a[0]))),
  CODE: (a, C) => text(C.ev(a[0])).charCodeAt(0) || 0,
  // ---- lookup ----
  VLOOKUP: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const table = C.range(a[1]);
    const col = num(C.ev(a[2]));
    const approx = a[3] ? toBool(C.ev(a[3])) : true;
    if (col < 1 || col > (table[0] ? table[0].length : 0)) throw ERR('#REF!');
    if (!approx) {
      for (const row of table) if (looseEq(row[0], key)) return row[col - 1];
      throw ERR('#N/A');
    }
    let best: Scalar[] | null = null;
    for (const row of table) {
      if (cmpVal(row[0], key) <= 0) best = row;
      else break;
    }
    if (!best) throw ERR('#N/A');
    return best[col - 1];
  },
  HLOOKUP: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const table = C.range(a[1]);
    const rowIdx = num(C.ev(a[2]));
    const approx = a[3] ? toBool(C.ev(a[3])) : true;
    const header = table[0] || [];
    for (let c = 0; c < header.length; c++) {
      if (approx ? cmpVal(header[c], key) === 0 : looseEq(header[c], key))
        return (table[rowIdx - 1] || [])[c];
    }
    if (approx) {
      let bi = -1;
      for (let c = 0; c < header.length; c++) if (cmpVal(header[c], key) <= 0) bi = c;
      if (bi >= 0) return (table[rowIdx - 1] || [])[bi];
    }
    throw ERR('#N/A');
  },
  MATCH: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const arr = C.range(a[1]).flat();
    const type = a[2] ? num(C.ev(a[2])) : 1;
    if (type === 0) {
      for (let i = 0; i < arr.length; i++) if (looseEq(arr[i], key)) return i + 1;
      throw ERR('#N/A');
    }
    let best = -1;
    for (let i = 0; i < arr.length; i++) {
      const c = cmpVal(arr[i], key);
      if (type === 1 && c <= 0) best = i;
      if (type === -1 && c >= 0) best = i;
    }
    if (best < 0) throw ERR('#N/A');
    return best + 1;
  },
  INDEX: (a, C) => {
    const table = C.range(a[0]);
    const r = num(C.ev(a[1]));
    const c = a[2] ? num(C.ev(a[2])) : 1;
    const row = table[r - 1];
    if (!row) throw ERR('#REF!');
    const v = row[table[0].length === 1 && !a[2] ? 0 : c - 1];
    return v == null ? null : v;
  },
  CHOOSE: (a, C) => {
    const i = num(C.ev(a[0]));
    if (i < 1 || i >= a.length) throw ERR('#VALUE!');
    return C.ev(a[i]);
  },
  // ---- date / info ----
  TODAY: () => new Date().toLocaleDateString(),
  NOW: () => new Date().toLocaleString(),
  YEAR: (a, C) => new Date(text(C.ev(a[0]))).getFullYear() || ERR('#VALUE!'),
  MONTH: (a, C) => new Date(text(C.ev(a[0]))).getMonth() + 1 || ERR('#VALUE!'),
  DAY: (a, C) => new Date(text(C.ev(a[0]))).getDate() || ERR('#VALUE!'),
  ISERROR: (a, C) => {
    try {
      asScalar(C.ev(a[0]));
      return false;
    } catch (e) {
      if (isErr(e)) return true;
      throw e;
    }
  },
  ISNUMBER: (a, C) => typeof asScalar(C.ev(a[0])) === 'number',
  ISBLANK: (a, C) => asScalar(C.ev(a[0])) == null,
};

export const FUNCTION_NAMES: string[] = Object.keys(FUNCTIONS).sort();
export function getFunction(name: string): FnImpl | undefined {
  return FUNCTIONS[name];
}

/* ---- criteria + comparison helpers ---- */
function matchCriteria(value: Scalar, crit: Scalar): boolean {
  if (typeof crit === 'string') {
    const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(crit);
    const op = (m && m[1]) || '=';
    const rhs = (m && m[2]) || '';
    const rn = Number(rhs);
    const numeric = rhs !== '' && !isNaN(rn);
    if (op === '=' || op === '<>') {
      const eq = numeric
        ? Number(value) === rn
        : wildToRe(rhs).test(String(value ?? ''));
      return op === '=' ? eq : !eq;
    }
    const aVal: number | string = numeric ? Number(value) : String(value ?? '').toLowerCase();
    const bVal: number | string = numeric ? rn : rhs.toLowerCase();
    return op === '<' ? aVal < bVal : op === '>' ? aVal > bVal : op === '<=' ? aVal <= bVal : aVal >= bVal;
  }
  return Number(value) === Number(crit);
}
function wildToRe(s: string): RegExp {
  const esc = s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + esc + '$', 'i');
}
function looseEq(a: Scalar, b: Scalar): boolean {
  if (a == null) return false;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  return String(a).toLowerCase() === String(b).toLowerCase();
}
function cmpVal(a: Scalar, b: Scalar): number {
  if (a == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

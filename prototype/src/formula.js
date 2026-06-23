// ─────────────────────────────────────────────────────────────────────────────
// Keepvidya Office — spreadsheet formula engine
// A self-contained, dependency-free formula engine: tokenizer → recursive-descent
// parser → evaluator, with on-demand dependency resolution, circular-reference
// detection, and ~70 Excel-compatible functions.
//
// Per OFFICE-ENGINE-SPEC.md this is the *deterministic core*. It mirrors the
// contract Univer's formula engine would expose, so it can be swapped later.
// ─────────────────────────────────────────────────────────────────────────────

/* ---------- A1 reference helpers ---------- */
export function colToNum(s) {
  let n = 0;
  for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n; // 'A' -> 1
}
export function numToCol(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s; // 1 -> 'A'
}
export function parseRef(ref) {
  const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colToNum(m[1]), row: parseInt(m[2], 10) };
}
export function makeRef(col, row) { return numToCol(col) + row; }

const ERR = (code) => ({ __err: code });
const isErr = (v) => v && typeof v === 'object' && v.__err;

/* ---------- tokenizer ---------- */
function tokenize(src) {
  const toks = [];
  let i = 0;
  const re = {
    ws: /\s/,
    ref: /^\$?[A-Za-z]{1,3}\$?\d+/,
    name: /^[A-Za-z_][A-Za-z0-9_.]*/,
    num: /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/,
  };
  while (i < src.length) {
    const c = src[i];
    if (re.ws.test(c)) { i++; continue; }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < src.length) {
        if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
        s += src[j++];
      }
      toks.push({ t: 'str', v: s }); i = j + 1; continue;
    }
    const rest = src.slice(i);
    let m;
    if ((m = re.num.exec(rest))) { toks.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
    if ((m = re.ref.exec(rest)) && /\$?[A-Za-z]{1,3}\$?\d+/.test(m[0])) {
      // make sure it isn't the start of a longer identifier (e.g. LOG10 vs L)
      const after = src[i + m[0].length];
      if (!(after && /[A-Za-z_]/.test(after))) { toks.push({ t: 'ref', v: m[0] }); i += m[0].length; continue; }
    }
    if ((m = re.name.exec(rest))) {
      const up = m[0].toUpperCase();
      if (up === 'TRUE' || up === 'FALSE') toks.push({ t: 'bool', v: up === 'TRUE' });
      else toks.push({ t: 'name', v: m[0] });
      i += m[0].length; continue;
    }
    if ('+-*/^&%(),:'.includes(c)) { toks.push({ t: c }); i++; continue; }
    if (c === '<' || c === '>' || c === '=') {
      let op = c; i++;
      if ((c === '<' && (src[i] === '=' || src[i] === '>')) || (c === '>' && src[i] === '=')) { op += src[i]; i++; }
      toks.push({ t: 'cmp', v: op }); continue;
    }
    throw ERR('#ERROR!');
  }
  toks.push({ t: 'eof' });
  return toks;
}

/* ---------- parser (precedence climbing) ---------- */
function parse(toks) {
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = (t) => { if (toks[p].t !== t) throw ERR('#ERROR!'); return toks[p++]; };

  function parseExpr() { return parseCmp(); }
  function parseCmp() {
    let l = parseConcat();
    while (peek().t === 'cmp') { const op = next().v; l = { t: 'bin', op, l, r: parseConcat() }; }
    return l;
  }
  function parseConcat() {
    let l = parseAdd();
    while (peek().t === '&') { next(); l = { t: 'bin', op: '&', l, r: parseAdd() }; }
    return l;
  }
  function parseAdd() {
    let l = parseMul();
    while (peek().t === '+' || peek().t === '-') { const op = next().t; l = { t: 'bin', op, l, r: parseMul() }; }
    return l;
  }
  function parseMul() {
    let l = parseUnary();
    while (peek().t === '*' || peek().t === '/') { const op = next().t; l = { t: 'bin', op, l, r: parseUnary() }; }
    return l;
  }
  function parseUnary() {
    if (peek().t === '-' || peek().t === '+') { const op = next().t; return { t: 'unary', op, x: parseUnary() }; }
    return parsePow();
  }
  function parsePow() {
    let l = parsePostfix();
    if (peek().t === '^') { next(); return { t: 'bin', op: '^', l, r: parseUnary() }; }
    return l;
  }
  function parsePostfix() {
    let x = parsePrimary();
    while (peek().t === '%') { next(); x = { t: 'postfix', op: '%', x }; }
    return x;
  }
  function parsePrimary() {
    const tk = peek();
    if (tk.t === 'num') { next(); return { t: 'num', v: tk.v }; }
    if (tk.t === 'str') { next(); return { t: 'str', v: tk.v }; }
    if (tk.t === 'bool') { next(); return { t: 'bool', v: tk.v }; }
    if (tk.t === '(') { next(); const e = parseExpr(); expect(')'); return e; }
    if (tk.t === 'ref') {
      next();
      if (peek().t === ':') { next(); const b = expect('ref').v; return { t: 'range', a: tk.v, b }; }
      return { t: 'ref', ref: tk.v };
    }
    if (tk.t === 'name') {
      next();
      if (peek().t === '(') {
        next();
        const args = [];
        if (peek().t !== ')') {
          args.push(parseExpr());
          while (peek().t === ',') { next(); args.push(parseExpr()); }
        }
        expect(')');
        return { t: 'call', name: tk.v.toUpperCase(), args };
      }
      throw ERR('#NAME?');
    }
    throw ERR('#ERROR!');
  }
  const ast = parseExpr();
  if (peek().t !== 'eof') throw ERR('#ERROR!');
  return ast;
}

/* ---------- value coercion ---------- */
function asScalar(v) {
  if (v && v.__range) v = v.__range.length ? v.__range[0][0] : null;
  if (isErr(v)) throw v;
  return v;
}
function num(v) {
  v = asScalar(v);
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  if (!isNaN(n)) return n;
  throw ERR('#VALUE!');
}
function txt(v) {
  v = asScalar(v);
  if (v == null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return numToStr(v);
  return String(v);
}
function bool(v) {
  v = asScalar(v);
  if (v == null || v === '') return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (/^true$/i.test(v)) return true;
  if (/^false$/i.test(v)) return false;
  throw ERR('#VALUE!');
}
export function numToStr(n) {
  if (!isFinite(n)) return '#NUM!';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(10)));
}

/* ---------- evaluator ---------- */
function evalNode(node, R) {
  switch (node.t) {
    case 'num': return node.v;
    case 'str': return node.v;
    case 'bool': return node.v;
    case 'ref': return R.cell(node.ref);
    case 'range': return { __range: R.range(node.a, node.b) };
    case 'unary': return node.op === '-' ? -num(evalNode(node.x, R)) : num(evalNode(node.x, R));
    case 'postfix': return num(evalNode(node.x, R)) / 100;
    case 'bin': return evalBin(node, R);
    case 'call': return evalCall(node, R);
  }
  throw ERR('#ERROR!');
}
function evalBin(node, R) {
  const op = node.op;
  if (op === '&') return txt(evalNode(node.l, R)) + txt(evalNode(node.r, R));
  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
    let a = asScalar(evalNode(node.l, R)), b = asScalar(evalNode(node.r, R));
    if (a == null) a = (typeof b === 'number') ? 0 : '';
    if (b == null) b = (typeof a === 'number') ? 0 : '';
    let c;
    if (typeof a === 'number' && typeof b === 'number') c = a < b ? -1 : a > b ? 1 : 0;
    else c = String(a).toLowerCase() < String(b).toLowerCase() ? -1 : String(a).toLowerCase() > String(b).toLowerCase() ? 1 : 0;
    return op === '=' ? c === 0 : op === '<>' ? c !== 0 : op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
  }
  const a = num(evalNode(node.l, R)), b = num(evalNode(node.r, R));
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': if (b === 0) throw ERR('#DIV/0!'); return a / b;
    case '^': { const r = Math.pow(a, b); if (!isFinite(r)) throw ERR('#NUM!'); return r; }
  }
  throw ERR('#ERROR!');
}
function evalCall(node, R) {
  const fn = FUNCS[node.name];
  if (!fn) throw ERR('#NAME?');
  const C = {
    ev: (n) => evalNode(n, R),
    range: (n) => { const v = evalNode(n, R); return v && v.__range ? v.__range : [[asScalar(v)]]; },
    nums: (nodes) => { const out = []; for (const n of nodes) collectNums(evalNode(n, R), out); return out; },
    flat: (nodes) => { const out = []; for (const n of nodes) collectAll(evalNode(n, R), out); return out; },
  };
  return fn(node.args, C);
}
function collectNums(v, out) {
  if (v && v.__range) { for (const row of v.__range) for (const c of row) pushNum(c, out); return; }
  pushNum(v, out);
}
function pushNum(c, out) {
  if (isErr(c)) throw c;
  if (c == null || c === '') return;
  if (typeof c === 'number') out.push(c);
  else if (typeof c === 'boolean') out.push(c ? 1 : 0);
}
function collectAll(v, out) {
  if (v && v.__range) { for (const row of v.__range) for (const c of row) { if (isErr(c)) throw c; out.push(c); } return; }
  if (isErr(v)) throw v;
  out.push(v);
}

/* ---------- criteria matcher (COUNTIF / SUMIF) ---------- */
function matchCriteria(value, crit) {
  if (typeof crit === 'string') {
    const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(crit);
    const op = m[1] || '=';
    let rhs = m[2];
    const rn = Number(rhs);
    const numeric = rhs !== '' && !isNaN(rn);
    if (op === '=' || op === '<>') {
      const eq = numeric ? Number(value) === rn
        : String(value ?? '').toLowerCase() === wildToRe(rhs).src ? false : wildToRe(rhs).test(String(value ?? ''));
      return op === '=' ? eq : !eq;
    }
    const a = numeric ? Number(value) : String(value ?? '').toLowerCase();
    const b = numeric ? rn : rhs.toLowerCase();
    if (a === undefined) return false;
    return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
  }
  return Number(value) === Number(crit);
}
function wildToRe(s) {
  const esc = s.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + esc + '$', 'i');
}

/* ---------- function library ---------- */
const FUNCS = {
  // math / aggregate
  SUM: (a, C) => C.nums(a).reduce((s, n) => s + n, 0),
  PRODUCT: (a, C) => C.nums(a).reduce((s, n) => s * n, 1),
  AVERAGE: (a, C) => { const n = C.nums(a); if (!n.length) throw ERR('#DIV/0!'); return n.reduce((s, x) => s + x, 0) / n.length; },
  AVG: (a, C) => FUNCS.AVERAGE(a, C),
  MEDIAN: (a, C) => { const n = C.nums(a).sort((x, y) => x - y); if (!n.length) throw ERR('#NUM!'); const m = Math.floor(n.length / 2); return n.length % 2 ? n[m] : (n[m - 1] + n[m]) / 2; },
  MIN: (a, C) => { const n = C.nums(a); return n.length ? Math.min(...n) : 0; },
  MAX: (a, C) => { const n = C.nums(a); return n.length ? Math.max(...n) : 0; },
  COUNT: (a, C) => C.nums(a).length,
  COUNTA: (a, C) => C.flat(a).filter(v => v != null && v !== '').length,
  COUNTBLANK: (a, C) => C.flat(a).filter(v => v == null || v === '').length,
  ROUND: (a, C) => { const f = Math.pow(10, num(C.ev(a[1] ?? { t: 'num', v: 0 }))); return Math.round(num(C.ev(a[0])) * f) / f; },
  ROUNDUP: (a, C) => { const f = Math.pow(10, a[1] ? num(C.ev(a[1])) : 0); const x = num(C.ev(a[0])); return (x < 0 ? -1 : 1) * Math.ceil(Math.abs(x) * f) / f; },
  ROUNDDOWN: (a, C) => { const f = Math.pow(10, a[1] ? num(C.ev(a[1])) : 0); const x = num(C.ev(a[0])); return (x < 0 ? -1 : 1) * Math.floor(Math.abs(x) * f) / f; },
  INT: (a, C) => Math.floor(num(C.ev(a[0]))),
  TRUNC: (a, C) => { const x = num(C.ev(a[0])); return x < 0 ? Math.ceil(x) : Math.floor(x); },
  ABS: (a, C) => Math.abs(num(C.ev(a[0]))),
  SQRT: (a, C) => { const x = num(C.ev(a[0])); if (x < 0) throw ERR('#NUM!'); return Math.sqrt(x); },
  POWER: (a, C) => Math.pow(num(C.ev(a[0])), num(C.ev(a[1]))),
  EXP: (a, C) => Math.exp(num(C.ev(a[0]))),
  LN: (a, C) => { const x = num(C.ev(a[0])); if (x <= 0) throw ERR('#NUM!'); return Math.log(x); },
  LOG: (a, C) => { const x = num(C.ev(a[0])); const b = a[1] ? num(C.ev(a[1])) : 10; return Math.log(x) / Math.log(b); },
  LOG10: (a, C) => Math.log10(num(C.ev(a[0]))),
  MOD: (a, C) => { const d = num(C.ev(a[1])); if (d === 0) throw ERR('#DIV/0!'); const n = num(C.ev(a[0])); return n - d * Math.floor(n / d); },
  CEILING: (a, C) => { const x = num(C.ev(a[0])); const s = a[1] ? num(C.ev(a[1])) : 1; return s === 0 ? 0 : Math.ceil(x / s) * s; },
  FLOOR: (a, C) => { const x = num(C.ev(a[0])); const s = a[1] ? num(C.ev(a[1])) : 1; return s === 0 ? 0 : Math.floor(x / s) * s; },
  SIGN: (a, C) => Math.sign(num(C.ev(a[0]))),
  PI: () => Math.PI,
  RAND: () => Math.random(),
  RANDBETWEEN: (a, C) => { const lo = num(C.ev(a[0])), hi = num(C.ev(a[1])); return Math.floor(Math.random() * (hi - lo + 1)) + lo; },
  STDEV: (a, C) => { const n = C.nums(a); if (n.length < 2) throw ERR('#DIV/0!'); const m = n.reduce((s, x) => s + x, 0) / n.length; return Math.sqrt(n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1)); },
  VAR: (a, C) => { const n = C.nums(a); if (n.length < 2) throw ERR('#DIV/0!'); const m = n.reduce((s, x) => s + x, 0) / n.length; return n.reduce((s, x) => s + (x - m) ** 2, 0) / (n.length - 1); },
  SUMIF: (a, C) => {
    const range = C.range(a[0]).flat();
    const crit = asScalar(C.ev(a[1]));
    const sumRange = a[2] ? C.range(a[2]).flat() : range;
    let s = 0;
    range.forEach((v, i) => { if (matchCriteria(v, crit)) s += Number(sumRange[i]) || 0; });
    return s;
  },
  COUNTIF: (a, C) => {
    const range = C.range(a[0]).flat();
    const crit = asScalar(C.ev(a[1]));
    return range.filter(v => matchCriteria(v, crit)).length;
  },
  // logic
  IF: (a, C) => bool(C.ev(a[0])) ? (a[1] ? C.ev(a[1]) : true) : (a[2] ? C.ev(a[2]) : false),
  IFERROR: (a, C) => { try { const v = C.ev(a[0]); asScalar(v); return v; } catch (e) { if (isErr(e)) return C.ev(a[1]); throw e; } },
  IFS: (a, C) => { for (let i = 0; i < a.length; i += 2) if (bool(C.ev(a[i]))) return C.ev(a[i + 1]); throw ERR('#N/A'); },
  AND: (a, C) => a.every(n => bool(C.ev(n))),
  OR: (a, C) => a.some(n => bool(C.ev(n))),
  NOT: (a, C) => !bool(C.ev(a[0])),
  XOR: (a, C) => a.reduce((acc, n) => acc !== bool(C.ev(n)), false),
  TRUE: () => true,
  FALSE: () => false,
  // text
  CONCAT: (a, C) => C.flat(a).map(v => v == null ? '' : typeof v === 'number' ? numToStr(v) : String(v)).join(''),
  CONCATENATE: (a, C) => FUNCS.CONCAT(a, C),
  LEN: (a, C) => txt(C.ev(a[0])).length,
  LEFT: (a, C) => txt(C.ev(a[0])).slice(0, a[1] ? num(C.ev(a[1])) : 1),
  RIGHT: (a, C) => { const s = txt(C.ev(a[0])); const n = a[1] ? num(C.ev(a[1])) : 1; return s.slice(Math.max(0, s.length - n)); },
  MID: (a, C) => txt(C.ev(a[0])).substr(num(C.ev(a[1])) - 1, num(C.ev(a[2]))),
  UPPER: (a, C) => txt(C.ev(a[0])).toUpperCase(),
  LOWER: (a, C) => txt(C.ev(a[0])).toLowerCase(),
  PROPER: (a, C) => txt(C.ev(a[0])).replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  TRIM: (a, C) => txt(C.ev(a[0])).trim().replace(/\s+/g, ' '),
  REPT: (a, C) => txt(C.ev(a[0])).repeat(Math.max(0, num(C.ev(a[1])))),
  SUBSTITUTE: (a, C) => { const s = txt(C.ev(a[0])); const o = txt(C.ev(a[1])); const n = txt(C.ev(a[2])); return o === '' ? s : s.split(o).join(n); },
  FIND: (a, C) => { const i = txt(C.ev(a[1])).indexOf(txt(C.ev(a[0])), a[2] ? num(C.ev(a[2])) - 1 : 0); if (i < 0) throw ERR('#VALUE!'); return i + 1; },
  SEARCH: (a, C) => { const i = txt(C.ev(a[1])).toLowerCase().indexOf(txt(C.ev(a[0])).toLowerCase(), a[2] ? num(C.ev(a[2])) - 1 : 0); if (i < 0) throw ERR('#VALUE!'); return i + 1; },
  VALUE: (a, C) => num(C.ev(a[0])),
  TEXT: (a, C) => { const v = num(C.ev(a[0])); const f = txt(C.ev(a[1])); const dec = (f.match(/\.(0+)/) || [, ''])[1].length; return dec ? v.toFixed(dec) : numToStr(v); },
  CHAR: (a, C) => String.fromCharCode(num(C.ev(a[0]))),
  CODE: (a, C) => txt(C.ev(a[0])).charCodeAt(0) || 0,
  // lookup
  VLOOKUP: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const table = C.range(a[1]);
    const col = num(C.ev(a[2]));
    const approx = a[3] ? bool(C.ev(a[3])) : true;
    if (col < 1 || col > (table[0] ? table[0].length : 0)) throw ERR('#REF!');
    if (!approx) {
      for (const row of table) if (looseEq(row[0], key)) return row[col - 1];
      throw ERR('#N/A');
    }
    let best = null;
    for (const row of table) { if (cmpVal(row[0], key) <= 0) best = row; else break; }
    if (!best) throw ERR('#N/A');
    return best[col - 1];
  },
  HLOOKUP: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const table = C.range(a[1]);
    const rowIdx = num(C.ev(a[2]));
    const approx = a[3] ? bool(C.ev(a[3])) : true;
    const header = table[0] || [];
    for (let c = 0; c < header.length; c++) {
      if (approx ? cmpVal(header[c], key) === 0 : looseEq(header[c], key)) return (table[rowIdx - 1] || [])[c];
    }
    if (approx) { let bi = -1; for (let c = 0; c < header.length; c++) if (cmpVal(header[c], key) <= 0) bi = c; if (bi >= 0) return (table[rowIdx - 1] || [])[bi]; }
    throw ERR('#N/A');
  },
  MATCH: (a, C) => {
    const key = asScalar(C.ev(a[0]));
    const arr = C.range(a[1]).flat();
    const type = a[2] ? num(C.ev(a[2])) : 1;
    if (type === 0) { for (let i = 0; i < arr.length; i++) if (looseEq(arr[i], key)) return i + 1; throw ERR('#N/A'); }
    let best = -1;
    for (let i = 0; i < arr.length; i++) { const c = cmpVal(arr[i], key); if (type === 1 && c <= 0) best = i; if (type === -1 && c >= 0) best = i; }
    if (best < 0) throw ERR('#N/A');
    return best + 1;
  },
  INDEX: (a, C) => {
    const table = C.range(a[0]);
    const r = num(C.ev(a[1]));
    const c = a[2] ? num(C.ev(a[2])) : 1;
    const row = table[r - 1]; if (!row) throw ERR('#REF!');
    const v = row[(table[0].length === 1 && !a[2]) ? 0 : c - 1];
    return v == null ? null : v;
  },
  CHOOSE: (a, C) => { const i = num(C.ev(a[0])); if (i < 1 || i >= a.length) throw ERR('#VALUE!'); return C.ev(a[i]); },
  // date / info
  TODAY: () => new Date().toLocaleDateString(),
  NOW: () => new Date().toLocaleString(),
  YEAR: (a, C) => new Date(txt(C.ev(a[0]))).getFullYear() || ERR('#VALUE!'),
  MONTH: (a, C) => new Date(txt(C.ev(a[0]))).getMonth() + 1 || ERR('#VALUE!'),
  DAY: (a, C) => new Date(txt(C.ev(a[0]))).getDate() || ERR('#VALUE!'),
  ISERROR: (a, C) => { try { asScalar(C.ev(a[0])); return false; } catch (e) { if (isErr(e)) return true; throw e; } },
  ISNUMBER: (a, C) => typeof asScalar(C.ev(a[0])) === 'number',
  ISBLANK: (a, C) => asScalar(C.ev(a[0])) == null,
};

export const FUNCTION_NAMES = Object.keys(FUNCS).sort();

function looseEq(a, b) {
  if (a == null) return false;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  return String(a).toLowerCase() === String(b).toLowerCase();
}
function cmpVal(a, b) {
  if (a == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  const x = String(a).toLowerCase(), y = String(b).toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

/* ---------- literal coercion for non-formula cells ---------- */
function literal(raw) {
  const s = String(raw);
  if (s === '') return null;
  if (/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s.trim())) return parseFloat(s);
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  return s;
}

/* ---------- public: recompute a whole sheet ----------
   cells: { 'A1': rawString, ... }
   returns { 'A1': { value, display, isNumber, isError }, ... } for every present cell. */
export function recalc(cells) {
  const cache = Object.create(null);
  const visiting = Object.create(null);

  function valueOf(ref) {
    if (ref in cache) return cache[ref];
    if (visiting[ref]) throw ERR('#CIRC!');
    const raw = cells[ref];
    if (raw == null || raw === '') return (cache[ref] = null);
    if (typeof raw === 'number') return (cache[ref] = raw);
    const s = String(raw);
    if (s[0] === '=') {
      visiting[ref] = true;
      let v;
      try { v = evalNode(parse(tokenize(s.slice(1))), R); }
      catch (e) { v = isErr(e) ? e : ERR('#ERROR!'); }
      delete visiting[ref];
      if (v && v.__range) v = v.__range.length ? v.__range[0][0] : null;
      return (cache[ref] = v);
    }
    return (cache[ref] = literal(s));
  }
  function rangeOf(aRef, bRef) {
    const A = parseRef(aRef), B = parseRef(bRef);
    if (!A || !B) throw ERR('#REF!');
    const c1 = Math.min(A.col, B.col), c2 = Math.max(A.col, B.col);
    const r1 = Math.min(A.row, B.row), r2 = Math.max(A.row, B.row);
    const out = [];
    for (let r = r1; r <= r2; r++) {
      const row = [];
      for (let c = c1; c <= c2; c++) row.push(valueOf(makeRef(c, r)));
      out.push(row);
    }
    return out;
  }
  const R = { cell: valueOf, range: rangeOf };

  const out = Object.create(null);
  for (const ref in cells) {
    if (cells[ref] == null || cells[ref] === '') continue;
    let v;
    try { v = valueOf(ref); } catch (e) { v = isErr(e) ? e : ERR('#ERROR!'); }
    out[ref] = present(v);
  }
  return out;
}

function present(v) {
  if (isErr(v)) return { value: v, display: v.__err, isError: true, isNumber: false };
  if (v == null) return { value: null, display: '', isError: false, isNumber: false };
  if (typeof v === 'number') return { value: v, display: numToStr(v), isError: false, isNumber: true };
  if (typeof v === 'boolean') return { value: v, display: v ? 'TRUE' : 'FALSE', isError: false, isNumber: false };
  return { value: v, display: String(v), isError: false, isNumber: false };
}

// Evaluate a single expression string against a cell map (used by tests / quick eval).
export function evalFormula(expr, cells = {}) {
  const r = recalc({ ...cells, __q: expr.startsWith('=') ? expr : '=' + expr });
  return r.__q;
}

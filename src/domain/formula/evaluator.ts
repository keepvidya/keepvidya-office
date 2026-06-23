// Tree-walking interpreter over the AST. Pure.
import {
  type EvalValue,
  type FnCtx,
  type Node,
  type Resolver,
  type Scalar,
  ERR,
  isRange,
} from './types';
import { asScalar, collectAll, collectNums, num, text } from './coerce';
import { getFunction } from './functions';

export function evalNode(node: Node, R: Resolver): EvalValue {
  switch (node.t) {
    case 'num':
      return node.v;
    case 'str':
      return node.v;
    case 'bool':
      return node.v;
    case 'ref':
      return R.cell(node.ref);
    case 'range':
      return { __range: R.range(node.a, node.b) };
    case 'unary':
      return node.op === '-' ? -num(evalNode(node.x, R)) : num(evalNode(node.x, R));
    case 'postfix':
      return num(evalNode(node.x, R)) / 100;
    case 'bin':
      return evalBin(node.op, node.l, node.r, R);
    case 'call':
      return evalCall(node.name, node.args, R);
  }
}

function evalBin(op: string, lNode: Node, rNode: Node, R: Resolver): EvalValue {
  if (op === '&') return text(evalNode(lNode, R)) + text(evalNode(rNode, R));

  if (op === '=' || op === '<>' || op === '<' || op === '>' || op === '<=' || op === '>=') {
    let a = asScalar(evalNode(lNode, R));
    let b = asScalar(evalNode(rNode, R));
    if (a == null) a = typeof b === 'number' ? 0 : '';
    if (b == null) b = typeof a === 'number' ? 0 : '';
    let c: number;
    if (typeof a === 'number' && typeof b === 'number') c = a < b ? -1 : a > b ? 1 : 0;
    else {
      const x = String(a).toLowerCase();
      const y = String(b).toLowerCase();
      c = x < y ? -1 : x > y ? 1 : 0;
    }
    return op === '='
      ? c === 0
      : op === '<>'
        ? c !== 0
        : op === '<'
          ? c < 0
          : op === '>'
            ? c > 0
            : op === '<='
              ? c <= 0
              : c >= 0;
  }

  const a = num(evalNode(lNode, R));
  const b = num(evalNode(rNode, R));
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) throw ERR('#DIV/0!');
      return a / b;
    case '^': {
      const r = Math.pow(a, b);
      if (!isFinite(r)) throw ERR('#NUM!');
      return r;
    }
  }
  /* v8 ignore next -- unreachable: parser only emits known binary operators */
  throw ERR('#ERROR!');
}

function evalCall(name: string, args: Node[], R: Resolver): EvalValue {
  const fn = getFunction(name);
  if (!fn) throw ERR('#NAME?');
  const C: FnCtx = {
    ev: (n) => evalNode(n, R),
    range: (n) => {
      const v = evalNode(n, R);
      return isRange(v) ? v.__range : [[asScalar(v)]];
    },
    nums: (nodes) => {
      const out: number[] = [];
      for (const n of nodes) collectNums(evalNode(n, R), out);
      return out;
    },
    flat: (nodes) => {
      const out: Scalar[] = [];
      for (const n of nodes) collectAll(evalNode(n, R), out);
      return out;
    },
  };
  return fn(args, C);
}

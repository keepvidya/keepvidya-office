// Recursive-descent (precedence-climbing) parser. O(T) in token count.
import { type Node, type Token, ERR } from './types';

export function parse(toks: Token[]): Node {
  let p = 0;
  const peek = (): Token => toks[p];
  const next = (): Token => toks[p++];
  const expect = (t: Token['t']): Token => {
    if (toks[p].t !== t) throw ERR('#ERROR!');
    return toks[p++];
  };

  function parseExpr(): Node {
    return parseCmp();
  }
  function parseCmp(): Node {
    let l = parseConcat();
    while (peek().t === 'cmp') {
      const op = (next() as { t: 'cmp'; v: string }).v;
      l = { t: 'bin', op, l, r: parseConcat() };
    }
    return l;
  }
  function parseConcat(): Node {
    let l = parseAdd();
    while (peek().t === '&') {
      next();
      l = { t: 'bin', op: '&', l, r: parseAdd() };
    }
    return l;
  }
  function parseAdd(): Node {
    let l = parseMul();
    while (peek().t === '+' || peek().t === '-') {
      const op = next().t;
      l = { t: 'bin', op, l, r: parseMul() };
    }
    return l;
  }
  function parseMul(): Node {
    let l = parseUnary();
    while (peek().t === '*' || peek().t === '/') {
      const op = next().t;
      l = { t: 'bin', op, l, r: parseUnary() };
    }
    return l;
  }
  function parseUnary(): Node {
    if (peek().t === '-' || peek().t === '+') {
      const op = next().t as '+' | '-';
      return { t: 'unary', op, x: parseUnary() };
    }
    return parsePow();
  }
  function parsePow(): Node {
    const l = parsePostfix();
    if (peek().t === '^') {
      next();
      return { t: 'bin', op: '^', l, r: parseUnary() };
    }
    return l;
  }
  function parsePostfix(): Node {
    let x = parsePrimary();
    while (peek().t === '%') {
      next();
      x = { t: 'postfix', op: '%', x };
    }
    return x;
  }
  function parsePrimary(): Node {
    const tk = peek();
    if (tk.t === 'num') {
      next();
      return { t: 'num', v: tk.v };
    }
    if (tk.t === 'str') {
      next();
      return { t: 'str', v: tk.v };
    }
    if (tk.t === 'bool') {
      next();
      return { t: 'bool', v: tk.v };
    }
    if (tk.t === '(') {
      next();
      const e = parseExpr();
      expect(')');
      return e;
    }
    if (tk.t === 'ref') {
      next();
      if (peek().t === ':') {
        next();
        const b = expect('ref') as { t: 'ref'; v: string };
        return { t: 'range', a: tk.v, b: b.v };
      }
      return { t: 'ref', ref: tk.v };
    }
    if (tk.t === 'name') {
      next();
      if (peek().t === '(') {
        next();
        const args: Node[] = [];
        if (peek().t !== ')') {
          args.push(parseExpr());
          while (peek().t === ',') {
            next();
            args.push(parseExpr());
          }
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

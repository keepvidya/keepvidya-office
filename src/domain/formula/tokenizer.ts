import { type Token, ERR } from './types';

const NUM = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;
const REF = /^\$?[A-Za-z]{1,3}\$?\d+/;
const NAME = /^[A-Za-z_][A-Za-z0-9_.]*/;
const SINGLE = '+-*/^&%(),:';

export function tokenize(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < src.length) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += src[j++];
      }
      toks.push({ t: 'str', v: s });
      i = j + 1;
      continue;
    }
    const rest = src.slice(i);
    let m = NUM.exec(rest);
    if (m) {
      toks.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    m = REF.exec(rest);
    if (m) {
      const after = src[i + m[0].length];
      // Not a ref if it continues as an identifier, or is called like a function
      // (e.g. LOG10( — a 3-letter+digits function name that also matches a cell ref).
      if (!(after && /[A-Za-z_(]/.test(after))) {
        toks.push({ t: 'ref', v: m[0] });
        i += m[0].length;
        continue;
      }
    }
    m = NAME.exec(rest);
    if (m) {
      const up = m[0].toUpperCase();
      // TRUE/FALSE are boolean literals — unless called as TRUE()/FALSE().
      const isBoolLiteral = (up === 'TRUE' || up === 'FALSE') && src[i + m[0].length] !== '(';
      if (isBoolLiteral) toks.push({ t: 'bool', v: up === 'TRUE' });
      else toks.push({ t: 'name', v: m[0] });
      i += m[0].length;
      continue;
    }
    if (SINGLE.includes(c)) {
      toks.push({ t: c } as Token);
      i++;
      continue;
    }
    if (c === '<' || c === '>' || c === '=') {
      let op = c;
      i++;
      if ((c === '<' && (src[i] === '=' || src[i] === '>')) || (c === '>' && src[i] === '=')) {
        op += src[i];
        i++;
      }
      toks.push({ t: 'cmp', v: op });
      continue;
    }
    throw ERR('#ERROR!');
  }
  toks.push({ t: 'eof' });
  return toks;
}

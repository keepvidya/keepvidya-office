// A1-notation reference helpers.
export function colToNum(s: string): number {
  let n = 0;
  for (const ch of s.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n; // 'A' -> 1, 'AA' -> 27
}

export function numToCol(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s; // 1 -> 'A'
}

export function parseRef(ref: string): { col: number; row: number } | null {
  const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colToNum(m[1]), row: parseInt(m[2], 10) };
}

export function makeRef(col: number, row: number): string {
  return numToCol(col) + row;
}

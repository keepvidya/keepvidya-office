// Sheet domain — a thin, pure facade over the M1 formula engine. Immutable updates.
import { type CellMap, type CellResult, makeRef, recalc } from '../formula';

export interface CellFmt {
  b?: boolean;
  i?: boolean;
}

export interface SheetData {
  cells: CellMap;
  cols: number;
  rows: number;
  fmt?: Record<string, CellFmt>;
}

export interface Aggregate {
  count: number; // numeric cells
  sum: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}

export const DEFAULT_COLS = 26;
export const DEFAULT_ROWS = 100;

export function setCell(data: SheetData, ref: string, raw: string): SheetData {
  const cells: CellMap = { ...data.cells };
  if (raw === '') delete cells[ref];
  else cells[ref] = raw;
  return { ...data, cells };
}

export function clearCell(data: SheetData, ref: string): SheetData {
  return setCell(data, ref, '');
}

export function setCells(data: SheetData, writes: { ref: string; value: string }[]): SheetData {
  const cells: CellMap = { ...data.cells };
  for (const w of writes) {
    if (w.value === '') delete cells[w.ref];
    else cells[w.ref] = w.value;
  }
  return { ...data, cells };
}

export function setCellFormat(data: SheetData, refs: string[], patch: Partial<CellFmt>): SheetData {
  const fmt: Record<string, CellFmt> = { ...(data.fmt ?? {}) };
  for (const ref of refs) {
    const next: CellFmt = { ...fmt[ref], ...patch };
    if (!next.b && !next.i) delete fmt[ref];
    else fmt[ref] = next;
  }
  return { ...data, fmt };
}

export function cellsInRange(c1: number, r1: number, c2: number, r2: number): string[] {
  const loC = Math.min(c1, c2);
  const hiC = Math.max(c1, c2);
  const loR = Math.min(r1, r2);
  const hiR = Math.max(r1, r2);
  const out: string[] = [];
  for (let r = loR; r <= hiR; r++) for (let c = loC; c <= hiC; c++) out.push(makeRef(c, r));
  return out;
}

export function compute(data: SheetData): Record<string, CellResult> {
  return recalc(data.cells);
}

export function aggregate(results: Record<string, CellResult>, refs: string[]): Aggregate {
  const nums: number[] = [];
  for (const ref of refs) {
    const r = results[ref];
    if (r && r.isNumber && typeof r.value === 'number') nums.push(r.value);
  }
  if (nums.length === 0) return { count: 0, sum: 0, avg: null, min: null, max: null };
  const sum = nums.reduce((s, n) => s + n, 0);
  return {
    count: nums.length,
    sum,
    avg: sum / nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
}

export function normalizeSheet(data: unknown): SheetData {
  const d = (data ?? {}) as Partial<SheetData>;
  const cols = typeof d.cols === 'number' && d.cols > 0 ? d.cols : DEFAULT_COLS;
  const rows = typeof d.rows === 'number' && d.rows > 0 ? d.rows : DEFAULT_ROWS;
  const cells = d.cells && typeof d.cells === 'object' ? { ...d.cells } : {};
  const fmt = d.fmt && typeof d.fmt === 'object' ? { ...d.fmt } : {};
  return { cells, cols: Math.max(cols, DEFAULT_COLS), rows: Math.max(rows, DEFAULT_ROWS), fmt };
}

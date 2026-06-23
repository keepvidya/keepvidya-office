// Sheet domain — a thin, pure facade over the M1 formula engine. Immutable updates.
import { type CellMap, type CellResult, recalc } from '../formula';

export interface SheetData {
  cells: CellMap;
  cols: number;
  rows: number;
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
  return { cells, cols: Math.max(cols, DEFAULT_COLS), rows: Math.max(rows, DEFAULT_ROWS) };
}

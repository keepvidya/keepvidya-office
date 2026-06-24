// xlsx export via ExcelJS (the vendor — wrapped here only). Writes live formulas
// (Excel recalculates) + a cached result; literals become numbers or strings.
import ExcelJS from 'exceljs';
import { type SheetData } from '../../domain/sheet/sheet';
import { recalc } from '../../domain/formula';

const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function exportXlsx(data: SheetData): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Keepvidya Office';
  const ws = wb.addWorksheet('Sheet1');
  const results = recalc(data.cells);

  for (const ref of Object.keys(data.cells)) {
    const raw = String(data.cells[ref] ?? '');
    if (raw === '') continue;
    const cell = ws.getCell(ref);
    if (raw[0] === '=') {
      const r = results[ref];
      const result = r && !r.isError && (typeof r.value === 'number' || typeof r.value === 'string') ? r.value : undefined;
      cell.value = result !== undefined ? { formula: raw.slice(1), result } : { formula: raw.slice(1) };
    } else {
      const n = Number(raw);
      cell.value = raw.trim() !== '' && !Number.isNaN(n) ? n : raw;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf as ArrayBuffer], { type: MIME });
}

import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { exportXlsx } from '../../src/adapters/export/xlsx-export';
import { exportDocx } from '../../src/adapters/export/docx-export';
import { exportPptx } from '../../src/adapters/export/pptx-export';
import { type SheetData } from '../../src/domain/sheet/sheet';
import { normalizeDoc } from '../../src/domain/doc/doc';
import { applyDeckIntent } from '../../src/ai/applier/deck-applier';

import type { SlideDeck } from '../../src/domain/slides/slides';

const bytesOf = async (b: Blob): Promise<Uint8Array> => new Uint8Array(await b.arrayBuffer());
const isZip = (u8: Uint8Array): boolean => u8[0] === 0x50 && u8[1] === 0x4b; // 'PK'

describe('TS-07.1 — Office export adapters (real vendors)', () => {
  it('TC-07.1.1 — xlsx is valid and preserves formulas (round-trip)', async () => {
    const sheet: SheetData = {
      cells: { A2: 'Salary', B2: '4500', A8: 'Net', B8: '=SUM(B2:B7)', C2: '=1/0' }, // C2 errors → no cached result
      cols: 26,
      rows: 100,
    };
    const blob = await exportXlsx(sheet);
    const u8 = await bytesOf(blob);
    expect(isZip(u8)).toBe(true);
    expect(u8.length).toBeGreaterThan(1000);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await blob.arrayBuffer());
    const ws = wb.getWorksheet('Sheet1')!;
    expect(ws.getCell('B2').value).toBe(4500);
    const b8 = ws.getCell('B8').value as { formula?: string };
    expect(b8.formula).toBe('SUM(B2:B7)');
  });

  it('TC-07.1.2 — docx is valid and contains the content (all block types)', async () => {
    const doc = normalizeDoc({
      html: '<h1>Proposal</h1><h2>Goals</h2><h3>Detail</h3><p>intro</p><ul><li>one</li></ul>',
    });
    const u8 = await bytesOf(await exportDocx(doc));
    expect(isZip(u8)).toBe(true);
    expect(u8.length).toBeGreaterThan(1000);
    const zip = await JSZip.loadAsync(u8);
    const xml = await zip.file('word/document.xml')!.async('string');
    for (const t of ['Proposal', 'Goals', 'Detail', 'intro', 'one']) expect(xml).toContain(t);

    // a document with no recognised blocks still produces a valid file
    const empty = await bytesOf(await exportDocx({ html: '<span>x</span>' }));
    expect(isZip(empty)).toBe(true);
  });

  it('TC-07.1.3 — pptx is valid with one slide per deck slide', async () => {
    const deck = applyDeckIntent({
      slides: [
        { title: 'Cover', bullets: ['subtitle'] },
        { title: 'Content', bullets: ['a', 'b'] },
      ],
    });
    const u8 = await bytesOf(await exportPptx(deck));
    expect(isZip(u8)).toBe(true);
    const zip = await JSZip.loadAsync(u8);
    expect(zip.file('ppt/slides/slide1.xml')).toBeTruthy();
    expect(zip.file('ppt/slides/slide2.xml')).toBeTruthy();
    const s1 = await zip.file('ppt/slides/slide1.xml')!.async('string');
    expect(s1).toContain('Cover');
  });

  it('pptx handles empty elements + missing colours', async () => {
    const deck: SlideDeck = {
      slides: [
        {
          bg: '', // falls back to default colour
          els: [
            { kind: 'text', x: 0, y: 0, w: 100, h: 50, html: '', size: 20, bold: false, color: '', align: 'left' }, // skipped (no text)
            { kind: 'text', x: 0, y: 60, w: 400, h: 80, html: 'Hello', size: 24, bold: true, color: '', align: 'center' },
          ],
        },
      ],
    };
    const u8 = await bytesOf(await exportPptx(deck));
    expect(isZip(u8)).toBe(true);
  });
});

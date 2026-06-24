# BA — 07 Real Office export (.xlsx / .docx / .pptx)

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
To genuinely compete with MS Office, files must **open in Excel / Word / PowerPoint**. This slice adds real
`.xlsx / .docx / .pptx` export from the three editors, via `ExcelJS` / `docx` / `pptxgenjs` — wrapped behind export
adapters (Wrapper Rule). The spreadsheet exports **live formulas** (Excel recalculates); the deck preserves slide layout;
the document preserves headings/paragraphs/bullets.

## 2. Users & jobs-to-be-done
- Primary user. Job: "When I'm done, I want to download a real Office file I can send to anyone and open in Excel/Word/PowerPoint."

## 3. User stories
- **US-1**: As a user, I want an Export button in each editor that downloads the right Office file for that app.
- **US-2**: As a user, I want my spreadsheet's formulas to be live in Excel (not just values).
- **US-3**: As a user, I want my deck's slides and my document's structure to survive the export.

## 4. Acceptance criteria (testable)
- **AC-1** (US-1/US-2): `exportXlsx(sheet)` produces a valid `.xlsx` (ZIP `PK` header) that **re-opens** with our values and **formulas preserved** (e.g. `B8` formula `SUM(B2:B7)`). *(→ TC-07.1.1)*
- **AC-2** (US-3): `exportDocx(doc)` produces a valid `.docx` whose document.xml contains the heading + paragraph + bullet text. *(→ TC-07.1.2)*
- **AC-3** (US-3): `exportPptx(deck)` produces a valid `.pptx` with one slide per deck slide and the slide text present. *(→ TC-07.1.3)*
- **AC-4**: the vendors are reached **only** through `src/adapters/export/*` (Wrapper Rule / boundary check). *(→ boundary gate)*
- **AC-5** (US-1): the Export button in each editor downloads a file. *(→ TC-07.3.1)*

## 5. Scope
- **In**: `exportXlsx/exportDocx/exportPptx` adapters (behind an `ExportPort`), an Export button in the editor chrome, a download helper, tests that verify valid Office bytes + content.
- **Out**: import of existing Office files, perfect style fidelity (fonts/themes), charts/images in export, PDF export.

## 6. Success metrics / done-signal
Each editor exports a file that opens in the corresponding MS Office app with the content intact; bytes verified as valid ZIP/OOXML; 0 console errors.

## 7. Open questions / decisions for owner
- Spreadsheet exports formulas + a cached result (Excel recalculates). Inline doc formatting (bold/italic) is best-effort at block level for now. ✔ assumed OK.

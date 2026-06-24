# DEV — 07 Real Office export (.xlsx / .docx / .pptx)

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1 (esp. the Wrapper Rule).

## 1. Approach (think-first)
Three thin **export adapters** wrap the vendors and expose our `ExportPort` (domain types in, `Blob` out). The composition
root injects `ExportPort`; the editor chrome gets an Export button that reads the latest data from the store and downloads.
Spreadsheet cells map to ExcelJS values/formulas; doc HTML is parsed (regex, no DOM) into docx paragraphs; deck elements map
to pptxgenjs text boxes (px → inches). Domain/UI never import a vendor.

## 2. Ports touched
- Outbound: **`ExportPort`** (new) — `xlsx(SheetData)`, `docx(DocData)`, `pptx(SlideDeck)` → `Promise<Blob>`.
- Inbound: the Export button → composition root → `ExportPort` → `download()`.

## 3. Domain / mapping
- xlsx: `=formula` → `{formula, result}` (Excel recalculates); numeric literal → number; else string.
- docx: `htmlToBlocks` (regex over `h1–3/p/li`) → `Paragraph` (heading levels / bullet).
- pptx: each `TextElement` → `addText` with px→inch geometry (`*10/960`, `*5.625/540`), pt≈px·0.75, hex colour.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| xlsx | iterate cells | O(C) | O(C) | — |
| docx | regex block scan | O(L) | O(blocks) | — |
| pptx | iterate slides×els | O(n) | O(n) | — |

## 5. Design patterns used
- **Adapter** — vendor wire formats → `ExportPort`. **Facade** — one `ExportPort` over three vendors. **Builder** — assembling docx/pptx objects.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| ExcelJS | `adapters/export/xlsx-export` | `ExportPort.xlsx` | no |
| docx | `adapters/export/docx-export` | `ExportPort.docx` | no |
| pptxgenjs | `adapters/export/pptx-export` | `ExportPort.pptx` | no |
Enforced: `exceljs/docx/pptxgenjs` are in the eslint restricted-imports list (allowed only under `src/adapters`) + dependency-cruiser.

## 7. Environment handling
- ExcelJS `writeBuffer()` and pptxgenjs `write({outputType:'arraybuffer'})` work in node + browser → wrap in `Blob`.
- docx: browser → `Packer.toBlob`; node → `Packer.toBuffer` → `Blob` (small env branch; the browser arm is `v8 ignore`-d as it's not node-testable).

## 8. Flow / sequence
Export button → `onExport` (composition root) → `openFile` (latest, autosaved) → normalize → `ExportPort.<type>` → `Blob` →
`download(filename, blob)`.

## 9. Error handling
Adapters are pure transforms; export failures surface a toast (UI). Empty document → a single empty paragraph (valid file).

## 10. ADRs
No new ADR — realises the BUILD-PLAN "export real files" goal and ADR-0002's "export via ExcelJS/docx/pptxgenjs".

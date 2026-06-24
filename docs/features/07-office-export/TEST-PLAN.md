# TEST PLAN — 07 Real Office export

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-07
- **Items under test**: `src/adapters/export/{xlsx,docx,pptx}-export`, `ExportPort`, Export button + download.
- **Approach**: integration (real vendors, verify bytes/content) + e2e (download event). **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-07.1 — Export adapters (INTEGRATION, real vendors)
### TC-07.1.1 — xlsx is valid + formulas preserved (round-trip)
- **Test data**: budget sheet `{A2:'Salary',B2:'4500',…,B8:'=SUM(B2:B7)'}`.
| # | Action | Expected result |
|---|---|---|
| 1 | `exportXlsx(sheet)` → blob → bytes | first two bytes are `PK`; size > 1KB |
| 2 | re-read the bytes with ExcelJS | `B2` value is `4500`; `B8` is a formula cell whose formula is `SUM(B2:B7)` |

### TC-07.1.2 — docx is valid + content present
- **Test data**: a doc with `<h1>Proposal</h1><p>intro</p><ul><li>one</li></ul>`.
| # | Action | Expected result |
|---|---|---|
| 1 | `exportDocx(doc)` → bytes | `PK` header; size > 1KB |
| 2 | unzip `word/document.xml` | contains `Proposal`, `intro`, and `one` |

### TC-07.1.3 — pptx is valid + one slide per deck slide
- **Test data**: a 2-slide deck (cover + content) from `applyDeckIntent`.
| # | Action | Expected result |
|---|---|---|
| 1 | `exportPptx(deck)` → bytes | `PK` header; size > 1KB |
| 2 | unzip | `ppt/slides/slide1.xml` and `slide2.xml` exist; slide1 xml contains the cover title text |

---

## Suite TS-07.3 — Export button (E2E — Playwright)
### TC-07.3.1 — each editor downloads its Office file
| # | Action | Expected result |
|---|---|---|
| 1 | open a spreadsheet, AI-fill, click Export | a download starts with a `.xlsx` filename |
| 2 | open a presentation, AI-generate, click Export | a download starts with a `.pptx` filename |
| 3 | open a document, AI-generate, click Export | a download starts with a `.docx` filename; 0 console errors |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-07.1.1, TC-07.3.1 |
| AC-2 | TC-07.1.2, TC-07.3.1 |
| AC-3 | TC-07.1.3, TC-07.3.1 |
| AC-4 | boundary gate (npm run boundary + eslint) |
| AC-5 | TC-07.3.1 |

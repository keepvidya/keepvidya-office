# QA — P1 Sheets parity

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Refactor breaks existing grid editing | M | H | Re-run all M2 e2e (type/formula/persist) |
| Aggregate wrong over a range | M | M | Domain unit + e2e drag-select reads totals |
| Format not persisted/exported | M | M | normalizeSheet fmt unit; xlsx export sets font; e2e reload |
| Paste mis-places cells | M | M | Domain setCells unit + e2e paste |

## 2. Test approach by level
- **Unit**: `cellsInRange`, `setCells`, `setCellFormat`, `aggregate` over a range, `normalizeSheet` fmt. ≥90% on new domain.
- **Integration**: xlsx export applies bold (round-trip reads `cell.font.bold`).
- **E2E**: drag-select → status totals; Bold toggles + persists; ∑ inserts SUM; paste places a 2×2 block; existing M2 flows still pass.

## 3. Coverage matrix
| AC | Unit | Integration | E2E |
|---|---|---|---|
| AC-1 domain | TC-P1.1.1–.4 | — | — |
| AC-2 aggregate | TC-P1.1.3 | — | TC-P1.3.1 |
| AC-3 bold | TC-P1.1.2 | TC-P1.2.1 | TC-P1.3.2 |
| AC-4 ∑ | — | — | TC-P1.3.3 |
| AC-5 paste | TC-P1.1.1 | — | TC-P1.3.4 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M7 on main.
- **Exit (Done)**: all TCs pass; ≥90% new domain; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (range highlight, bold cells, toolbar — light+dark).

## 5. Visual review checklist
- [ ] Range highlight (in-range fill + active ring); toolbar (Bold/Italic/∑); bold cells render bold
- [ ] Status bar shows Sum/Avg/Count/Min/Max for a selection
- [ ] Light + dark; no console errors

## 6. Test environment & data
Node + Vitest; Chromium + Playwright; ExcelJS re-read for the bold round-trip.

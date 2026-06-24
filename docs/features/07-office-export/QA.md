# QA — 07 Real Office export

> Quality strategy. QA owns the Definition of Done sign-off.

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| File doesn't open in MS Office | M | H | Bytes are valid ZIP/OOXML (PK header) + content present; xlsx re-read round-trips |
| Vendor leaks past the adapter | L | H | eslint restricted-imports + dependency-cruiser |
| Formula lost (values only) | M | M | xlsx export writes `{formula,result}`; round-trip asserts the formula |
| Browser docx path differs from node | M | M | env-branch; e2e download in a real browser |

## 2. Test approach by level
- **Unit/Integration**: call each adapter; assert a valid `Blob` (PK header + non-trivial size); **xlsx round-trip** re-reads our value + formula; docx/pptx unzip and assert the text is in the OOXML. ≥90% on new adapters.
- **E2E**: each editor's Export button triggers a file download (Playwright download event) with the right extension.

## 3. Coverage matrix
| AC | Unit/Integration | E2E |
|---|---|---|
| AC-1 xlsx | TC-07.1.1 | TC-07.3.1 |
| AC-2 docx | TC-07.1.2 | TC-07.3.1 |
| AC-3 pptx | TC-07.1.3 | TC-07.3.1 |
| AC-4 boundary | boundary gate | — |
| AC-5 button | — | TC-07.3.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M6 on main; vendors installed.
- **Exit (Done)**: all TCs pass; ≥90% on new adapters; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (Export button present, download works).

## 5. Visual review checklist
- [ ] Export button in each editor chrome; brand styling
- [ ] Light + dark; no console errors
- [ ] A downloaded `.xlsx/.docx/.pptx` opens in the corresponding app (manual spot-check)

## 6. Test environment & data
Node + Vitest (vendors re-imported in tests to verify bytes — eslint restriction lifted for `tests/**`). Chromium + Playwright for the download event. Fixtures: the budget sheet, the proposal doc, the pitch deck.

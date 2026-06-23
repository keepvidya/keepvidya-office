# QA — 02 Sheets edit slice

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Typed formula doesn't compute/display | M | H | E2E: type `=SUM(...)`, assert result |
| Edits lost on reload | M | H | E2E reload; domain setCell immutability unit test |
| Error formula crashes UI | L | H | E2E `=A1/0` shows `#DIV/0!`, no console error |
| Grid re-render perf | L | M | Update-only-changed-cells design (DEV §9) |

## 2. Test approach by level
- **Unit**: `domain/sheet` — `setCell`, `clearCell`, `compute`, `aggregate`, `normalizeSheet`. ≥90% on new domain code.
- **Integration**: a setCell→compute sequence reproducing the budget total (domain-level).
- **E2E** (Playwright): open a sheet, type values + a SUM formula, see the result, see an error value, reload to confirm persistence.

## 3. Coverage matrix
| AC | Unit | Integration | E2E |
|---|---|---|---|
| AC-1 grid renders | — | — | TC-02.3.1 |
| AC-2 type formula → result | — | TC-02.2.1 | TC-02.3.2 |
| AC-3 error display | — | — | TC-02.3.3 |
| AC-4 formula bar | — | — | TC-02.3.4 |
| AC-5 persistence | — | — | TC-02.3.5 |
| AC-6 domain | TC-02.1.1–.3 | TC-02.2.1 | — |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M1 engine on main.
- **Exit (Done)**: all TCs pass; ≥90% on `src/domain/sheet/**`; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (light+dark) approved.

## 5. Visual review checklist
- [ ] Grid matches the prototype (headers, gridlines, active-cell ring, formula bar, status bar)
- [ ] Light + dark screenshots attached
- [ ] Numbers right-aligned; errors styled; no console errors
- [ ] Brand tokens correct

## 6. Test environment & data
Chromium (Playwright) + IndexedDB; Node + Vitest for domain. Data: hand-typed A1/A2/A3 = 10/20/=SUM(A1:A2).

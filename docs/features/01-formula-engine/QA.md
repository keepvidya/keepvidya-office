# QA — 01 Formula engine (domain)

> Quality strategy. QA owns the Definition of Done sign-off.

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Wrong numeric result (silent) | M | H | Broad function + operator value tests vs Excel-known answers |
| Infinite loop on circular ref | M | H | Dedicated `#CIRC!` test asserts it returns an error (no hang) |
| Error not propagated (e.g. through SUM) | M | M | Error-propagation tests |
| Perf blow-up on deep chains | L | M | Perf-budget test on a 1,000-cell chain |
| Engine accidentally imports DOM/vendor | L | H | `npm run boundary` gate |

## 2. Test approach by level (the pyramid)
- **Unit**: tokenizer/parser/evaluator + each operator + a broad swath of the function library + A1/ref helpers. ≥90% on `src/domain/formula/**`.
- **Integration (engine-level)**: run whole realistic sheets (budget + invoice fixtures) through `recalc` and assert every computed cell.
- **E2E**: **N/A this slice** — no UI yet (Sheets UI is M2). The existing M0 e2e still runs green (app unchanged).
- **Perf**: a timed test with a documented budget (counts as a unit test with an assertion on duration).

## 3. Coverage matrix (every AC covered)
| AC | Unit | Integration | Perf |
|---|---|---|---|
| AC-1 operators/precedence | TC-01.1.1–.3 | — | — |
| AC-2 functions | TC-01.2.1–.2 | TC-01.5.1 | — |
| AC-3 refs/ranges/deps | TC-01.3.1–.2 | TC-01.5.1 | — |
| AC-4 errors + circular | TC-01.4.1–.2 | — | — |
| AC-5 recalc API | — | TC-01.5.1 | — |
| AC-6 perf | — | — | TC-01.6.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; engine modules planned.
- **Exit (Done)**: all TCs pass; coverage ≥90% on `src/domain/formula/**`; typecheck+lint+boundary green; CI `quality`+`e2e` green; code review approved. (No visual change → visual review = "no UI delta; M0 app unchanged".)

## 5. Visual review checklist
- [x] No UI change in this slice (engine only); M0 app still renders (e2e green).

## 6. Test environment & data
Node + Vitest. Fixtures: the prototype's budget + invoice cell maps reused as `recalc` inputs.

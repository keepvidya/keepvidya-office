# QA — 03 AI plumbing (the narrator spine)

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Malformed/hallucinated AI output reaches a cell | M | H | Validator unit tests; pipeline rejects + repairs; applier only runs on valid intent |
| Pipeline hangs / unbounded retries | L | H | Bounded-loop unit test (always-invalid → fails after N) |
| AI writes wrong numbers | M | H | Narrator boundary: model emits raw strings; engine computes; eval asserts computed values |
| Non-determinism in CI | M | M | Mock/fixture `LlmPort`; no live model in CI |

## 2. Test approach by level (the pyramid)
- **Unit**: `validateSheetIntent`, `applySheetIntent`, `generateSheetIntent` (success / retry / exhaustion), `fillSheet`. ≥90% on `src/ai/**` + `src/adapters/llm/**`.
- **Integration**: orchestrator + real sheet domain + mock LLM → fills a budget and `compute` shows the total.
- **E2E**: Sheets prompt bar → Generate → cells appear and a formula computes.
- **AI eval** (§6.4): golden prompts through the pipeline (fixture model) scoring intent validity, applied-cell correctness, and the trajectory (retry count).

## 3. Coverage matrix (every AC covered)
| AC | Unit | Integration | E2E | Eval |
|---|---|---|---|---|
| AC-1 validate | TC-03.1.1–.3 | — | — | — |
| AC-2 apply + compute | TC-03.1.4 | TC-03.2.1 | TC-03.3.1 | TC-03.4.1 |
| AC-3 self-correction | TC-03.1.5–.6 | — | — | — |
| AC-4 prompt bar | — | — | TC-03.3.1 | — |
| AC-5 eval | — | — | — | TC-03.4.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M2 on main.
- **Exit (Done)**: all TCs pass; ≥90% on new AI + adapter code; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (prompt bar, light+dark).

## 5. Visual review checklist
- [ ] Prompt bar matches brand (input + Generate button); fits the Sheets chrome
- [ ] Light + dark screenshots attached
- [ ] No console errors; generated cells render correctly (numbers right-aligned, formulas computed)

## 6. Test environment & data
Node + Vitest (unit/integration/eval, fixture `LlmPort`); Chromium + Playwright (e2e, mock model wired in the app).
Golden data: a freelancer monthly-budget intent whose `Net=SUM(...)` computes deterministically.

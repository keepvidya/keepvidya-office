# TEST PLAN — 03 AI plumbing (the narrator spine)

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-03
- **Items under test**: `src/ai/**` (intent/validator, pipeline, applier, orchestrator), `src/adapters/llm/mock-llm`, Sheets prompt bar.
- **In scope**: schema validation, guardrails + self-correction, intent application, orchestration, eval.
- **Out**: real model, multi-type experts, BYOK.
- **Approach**: unit + integration + e2e + AI eval (fixture model). **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-03.1 — Intent, validation, pipeline (UNIT)
### TC-03.1.1 — valid intent parses
| # | Action | Expected result |
|---|---|---|
| 1 | `validateSheetIntent('{"writes":[{"ref":"A1","value":"Hi"}]}')` | `ok:true`, `intent.writes[0]` = `{ref:'A1',value:'Hi'}` |

### TC-03.1.2 — malformed JSON / wrong shape → typed Err
| # | Action | Expected result |
|---|---|---|
| 1 | `validateSheetIntent('not json')` | `ok:false`, error mentions JSON |
| 2 | `validateSheetIntent('{"writes":"x"}')` | `ok:false` (writes not array) |
| 3 | `validateSheetIntent('{"writes":[{"ref":"A1"}]}')` | `ok:false` (missing value) |

### TC-03.1.3 — bad cell ref rejected
| # | Action | Expected result |
|---|---|---|
| 1 | `validateSheetIntent('{"writes":[{"ref":"1A","value":"x"}]}')` | `ok:false` (ref pattern) |

### TC-03.1.4 — applySheetIntent is immutable + values land
| # | Action | Expected result |
|---|---|---|
| 1 | apply `{writes:[{ref:'A1',value:'2'},{ref:'A2',value:'=A1*3'}]}` to empty sheet | new data: `A1='2'`, `A2='=A1*3'`; original unchanged |
| 2 | `compute` the result | `A2.display==='6'` |

### TC-03.1.5 — self-correction succeeds on invalid-then-valid
| # | Action | Expected result |
|---|---|---|
| 1 | `generateSheetIntent` with a scripted model `['oops', '{"writes":[{"ref":"A1","value":"ok"}]}']` | `ok:true`; trace shows 1 failed attempt then success |

### TC-03.1.6 — bounded retries fail cleanly
| # | Action | Expected result |
|---|---|---|
| 1 | `generateSheetIntent` with an always-invalid model, maxRetries=2 | `ok:false`, typed error, `trace` has 3 attempts; **no throw / no hang** |

---

## Suite TS-03.2 — Orchestrator + sheet domain (INTEGRATION)
### TC-03.2.1 — fillSheet populates a computing budget
- **Preconditions**: mock `LlmPort` returns the budget fixture intent.
| # | Action | Expected result |
|---|---|---|
| 1 | `fillSheet('freelancer budget', emptySheet, {llm})` | returns new `SheetData` |
| 2 | `compute(result.data)` `B5` (Net = SUM) | `display==='2400'` |
| 3 | `result.data.cells.A1` | `'Category'` (label applied) |

---

## Suite TS-03.3 — Sheets prompt bar (E2E — Playwright)
### TC-03.3.1 — prompt → cells appear and compute
- **Preconditions**: app wired with the mock LLM (budget fixture).
| # | Action | Expected result |
|---|---|---|
| 1 | create a spreadsheet | grid + AI prompt bar visible |
| 2 | type a prompt, click Generate | A1 shows `Category`; B5 shows `2400` (computed); 0 console errors |

---

## Suite TS-03.4 — AI eval (golden set, fixture model)
### TC-03.4.1 — pipeline trajectory + result rubric
| # | Action | Expected result |
|---|---|---|
| 1 | run golden prompt G1 through `fillSheet` with the fixture model | intent validates; applied cells include the labels; `Net` computes to the rubric value; trace has exactly 1 successful attempt (0 retries) |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-03.1.1–.3 |
| AC-2 | TC-03.1.4, TC-03.2.1, TC-03.3.1, TC-03.4.1 |
| AC-3 | TC-03.1.5–.6 |
| AC-4 | TC-03.3.1 |
| AC-5 | TC-03.4.1 |

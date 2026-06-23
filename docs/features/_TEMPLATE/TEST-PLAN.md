# TEST PLAN — <NN-slice-name>

> IEEE-829-aligned. Written FIRST (test-first). Plan → Suites → Cases. **Every case step has an Action and an Expected Result.**

## 1. Test plan header
- **Plan id**: TP-<NN>
- **Items under test**: <modules/ports/UI>
- **Features in scope** / **out of scope**: …
- **Approach**: unit + integration + e2e (+ AI eval) per QA.md
- **Environment**: <browser, build, data>
- **Entry / exit criteria**: see QA.md
- **Risks / deliverables**: …

---

## Suite TS-<NN>.1 — <capability> (UNIT)
### TC-<NN>.1.1 — <title>
- **Preconditions**: …
- **Test data**: …

| # | Action (step) | Expected result |
|---|---|---|
| 1 | … | … |

- **Pass/Fail**: ☐

---

## Suite TS-<NN>.2 — <capability> (INTEGRATION)
### TC-<NN>.2.1 — <title>
- **Preconditions**: real adapter wired (vendor NOT mocked)

| # | Action | Expected result |
|---|---|---|
| 1 | … | … |

- **Pass/Fail**: ☐

---

## Suite TS-<NN>.3 — <critical flow> (E2E)
### TC-<NN>.3.1 — <title>
- **Preconditions**: app launched (Playwright)

| # | Action | Expected result |
|---|---|---|
| 1 | Launch app | Home renders, rail visible |

- **Pass/Fail**: ☐

---

## Suite TS-<NN>.4 — <ai behaviour> (AI EVAL — AI slices only)
### TC-<NN>.4.1 — <title>
- **Preconditions**: `LlmPort` bound to a deterministic fixture model

| # | Action | Expected result |
|---|---|---|
| 1 | Run golden prompt G1 through the pipeline | Intent validates against schema; applier produces artifact matching rubric |

- **Pass/Fail**: ☐

---

## Traceability
| Acceptance criterion (BA) | Covered by |
|---|---|
| AC-1 | TC-<NN>.1.1, TC-<NN>.3.1 |

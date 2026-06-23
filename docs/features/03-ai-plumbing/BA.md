# BA — 03 AI plumbing (the narrator spine)

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
The product promise is "AI-driven office tools," but the product DNA is "the LLM never decides correctness." This slice
builds the **spine** that makes both true: a prompt produces **validated structured intent**, guardrails reject/repair bad
output, and a **deterministic applier** turns the intent into real cells via the M2 sheet domain. The model drafts; our code
builds the file. M3 proves this end-to-end with a **mock model** (so it runs in CI with no live LLM); M4 swaps in Shiva.

## 2. Users & jobs-to-be-done
- Primary user: a spreadsheet user. Job: "When I describe what I want ('a freelancer monthly budget'), I want the sheet
  populated correctly — and I trust the numbers because *our engine* computed them."
- Maintainer: "When AI ships, I want it tested deterministically (mock model, golden set) so CI stays green and honest."

## 3. User stories
- **US-1**: As a user, I want a prompt bar on the spreadsheet so I can ask the AI to fill it.
- **US-2**: As a user, I want the AI's output to populate real cells (values *and* formulas) that then compute live.
- **US-3**: As the system, I want every AI output validated against an intent schema before anything is applied.
- **US-4**: As the system, I want invalid AI output to trigger a bounded self-correction loop, not a crash or a bad write.
- **US-5**: As a maintainer, I want a golden-set eval (mock model) scoring the pipeline's trajectory + result.

## 4. Acceptance criteria (testable)
- **AC-1** (US-3): GIVEN raw model text, `validateSheetIntent` returns Ok for well-formed `{writes:[{ref,value}]}` and a typed Err for malformed/JSON-broken/bad-ref input. *(→ TC-03.1.x)*
- **AC-2** (US-2): GIVEN a valid `SheetIntent`, `applySheetIntent` writes those cells immutably; `compute` then evaluates formulas (e.g. `Net=SUM(...)`). *(→ TC-03.1.4, TC-03.2.1)*
- **AC-3** (US-4): GIVEN a model that returns invalid-then-valid, the pipeline retries and succeeds within the budget; GIVEN always-invalid, it fails after N with a typed error (no throw). *(→ TC-03.1.5, TC-03.1.6)*
- **AC-4** (US-1/US-2): GIVEN the Sheets editor, WHEN I type a prompt and Generate, THEN cells appear and a formula computes (mock model). *(→ TC-03.3.1)*
- **AC-5** (US-5): GIVEN golden prompts + a fixture model, the eval asserts intent validity, applied-cell correctness, and the trace (retry count). *(→ TC-03.4.1)*

## 5. Scope
- **In**: `LlmPort` (+ mock adapter), `SheetIntent` schema + hand-written validator, guardrail pipeline (validate + bounded self-correction), `applySheetIntent`, an Orchestrator (`fillSheet`) with a trace, a Sheets prompt bar, an eval harness.
- **Out**: a real model (Shiva — M4), per-type expert agents beyond Sheets, BYOK/cloud providers, streaming, RAG.

## 6. Success metrics / done-signal
The Sheets prompt bar fills a budget that computes; the pipeline repairs invalid output; eval green; 0 console errors.

## 7. AI acceptance (narrator boundary)
- The model may emit **only** `SheetIntent` (cell `ref` + raw `value` strings). It never computes results or writes files.
- The engine (M1) computes every value; the applier (M2 `setCell`) writes cells. A malformed/hallucinated intent is rejected by the validator before any cell changes.

## 8. Open questions / decisions for owner
- Schema validation is **hand-written in `src/ai/intent`** (no Zod) to keep the core dependency-free; a vendor validator could sit behind an adapter later. ✔ assumed OK.

# ADR-0003: AI architecture — narrator pattern via validated structured intent

- **Status**: Accepted
- **Date**: 2026-06-23

## Context
The product promise is "AI-driven office tools." The product DNA is "the LLM is a narrator" — correctness lives in our
deterministic code, never in the model. We must reconcile *AI generates the document* with *the model never decides
correctness*. Industry best practice for reliable agents in 2026 converges on: **structured outputs, guardrails,
self-correction loops, ReAct tool-use, and trajectory evaluation** (see protocol §6 sources).

## Decision
The AI never mutates an artifact directly. The pipeline is:

```
user prompt
  → Orchestrator routes to a per-type Expert Agent (Slides | Sheets | Docs | PDF)
    → Agent (ReAct) proposes STRUCTURED INTENT  (e.g. DeckIntent { slides:[{ title, bullets[], layout }] })
      → INPUT/OUTPUT GUARDRAILS: schema-validate (Zod) + policy-check the intent
        → on failure → self-correction loop (re-prompt with validator error, max N retries)
        → on success → DETERMINISTIC APPLIER calls only our tools (addSlide, setCell, insertParagraph…)
          → our ENGINE produces the real Deck/Workbook/Document and the file bytes
```

- **Intent schemas** are the contract between AI and engine; they live in `src/ai/intent/` and are the unit-of-test for AI.
- **Experts** have a **strict tool contract** — they may only call our deterministic tools, never write files or numbers.
- **Models**: Shiva (local) is the runtime author; BYOK cloud is opt-in; **Claude is a DEV-time template author**, not a
  runtime dependency.
- **Evaluation**: every AI slice ships a golden-set harness scoring the full trajectory with a **mocked deterministic
  model in CI** (no live model in CI).

## Consequences
- A hallucinated number or malformed slide **cannot reach the file** — it fails schema/guard and is corrected or rejected.
- AI features are testable deterministically (mock the `LlmPort`, assert the intent + the applied artifact).
- Swapping models or engines (Shiva ↔ BYOK ↔ Univer) changes adapters only; the intent contract is stable.
- Slightly more upfront design (schemas + guards) per AI feature — accepted as the cost of reliability.

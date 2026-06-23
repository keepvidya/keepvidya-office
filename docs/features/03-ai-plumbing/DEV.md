# DEV — 03 AI plumbing (the narrator spine)

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1 + §6.

## 1. Approach (think-first)
Build the §6 pipeline as pure, model-agnostic code under `src/ai/`, depending only on an injected `LlmPort` and the M2
sheet domain. A **mock LLM adapter** makes the whole thing deterministic in CI. The composition root wires the port and
passes a single `aiFill(prompt, data)` function into the Sheets view — the UI never imports the AI internals.

## 2. Ports touched
- Outbound: **`LlmPort`** (new) — `complete(req) → response`. Implemented by `adapters/llm/mock-llm` now; Shiva at M4.
- Inbound: `fillSheet(prompt, data, deps)` orchestrator (driven by the Sheets prompt bar via the composition root).
- Reuses M2 `setCell`/`compute` (sheet domain) and M1 engine.

## 3. Domain / AI model
- `SheetIntent = { writes: { ref: string; value: string }[] }` — the **only** thing the model may emit.
- `TraceStep` — per-attempt record (raw text, validated?/error) for observability + eval (§6.4).
- `IntentOutcome<T> = { ok; intent?; error?; trace }`.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| `validateSheetIntent` | JSON.parse + linear field checks | O(n) (writes) | O(n) | — |
| self-correction loop | bounded for-loop | O(R·call) (R = maxRetries) | O(trace) | R ≤ 2 by default |
| `applySheetIntent` | fold `setCell` | O(n·k) (k = existing cells) | O(k) | small |

## 5. Design patterns used
- **Chain of Responsibility** — guardrail pipeline (build request → model → validate → repair/apply).
- **Strategy / DIP** — `LlmPort` injected; mock vs Shiva are interchangeable.
- **Interpreter-adjacent** — the validator parses model text into a typed intent (the contract).
- **Command** — `applySheetIntent` applies a batch of cell writes immutably.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| (future) Shiva/Ollama, BYOK | `adapters/llm/*` | `LlmPort` | no |
| *(M3 uses a hand-written mock adapter — no vendor)* | `adapters/llm/mock-llm` | `LlmPort` | no |

`src/ai/**` is pure (no DOM, no vendor, no ui/adapters imports) — enforced by new dependency-cruiser rules.

## 7. Intent schema & guardrails (§6)
- **Schema**: `validateSheetIntent(text): Result<SheetIntent>` — JSON-parse (typed Err on failure), require `writes: array`,
  each item `{ ref: string matching /^[A-Za-z]+[1-9]\d*$/, value: string }`. Caps write count (safety).
- **Guard pipeline**: `build request → LlmPort.complete → validate → (fail) re-prompt with the validator error → (success) return`.
- **Self-correction**: bounded retries (default 2); on exhaustion returns a typed `AiError`, never throws to the UI.
- **Tool contract**: the applier only calls our deterministic `setCell` — the model cannot write files or numbers.

## 8. Flow / sequence
Sheets prompt bar → `aiFill(prompt, data)` (composition root) → `fillSheet` → `generateSheetIntent` (pipeline, may retry) →
`applySheetIntent(data, intent)` → new `SheetData` → grid recomputes via `compute` → autosave. Trace returned for eval.

## 9. Error handling
Everything returns `Result`/`IntentOutcome` — no throw escapes `fillSheet`. Invalid model output → typed error + a UI note;
the grid is left unchanged on failure.

## 10. ADRs
Realises **ADR-0003** (narrator via validated structured intent). No new ADR.

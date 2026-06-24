# DEV — 04 AI Slides ("prompt → deck")

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1 + §6.

## 1. Approach (think-first)
Mirror the M2/M3 shape for a new document type. A pure **slides domain** holds the deck model + ops. A new `SlideIntent`
(model emits content only) is validated, then `applyDeckIntent` **deterministically lays out** each slide (title element +
bullets element) — the narrator boundary made literal: the model writes words, our code positions them. `buildDeck` reuses
the M3 pipeline (validate + bounded self-correction). The Slides editor renders the deck (rail + stage), offers a prompt
bar + inline text edit + add/delete, and a **present mode**.

## 2. Ports touched
- Outbound: `LlmPort` (reused). Inbound: `buildDeck(prompt, deps)` orchestrator; deck ops (pure). Persistence via `saveData`.

## 3. Domain / AI model
- `TextElement = { kind:'text'; x;y;w;h; html; size; bold; color; align }`; `Slide = { bg; els: TextElement[] }`; `SlideDeck = { slides: Slide[] }`.
- `SlideIntent = { slides: { title: string; bullets: string[] }[] }` — the only thing the model may emit.
- Deck ops (pure): `addSlide`, `deleteSlide`, `setSlideText`, `normalizeDeck`.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| `validateDeckIntent` | JSON.parse + field checks | O(n·b) (slides×bullets) | O(n·b) | cap slides/bullets |
| `applyDeckIntent` | map intent → slide els | O(n·b) | O(n·b) | — |
| present render | scale transform | O(els) | O(1) | — |

## 5. Design patterns used
- **Strategy/DIP** — `LlmPort` reused. **Chain of Responsibility** — pipeline reused. **Command** — `applyDeckIntent`.
- **Builder** — `applyDeckIntent` assembles slides from content using fixed layout templates (title vs content slide).
- **Model-View** — `SlideDeck` ↔ editor/present view.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| (future) Shiva/BYOK | `adapters/llm/*` | `LlmPort` | no |
| *(M4 reuses the mock adapter — deck fixture)* | `adapters/llm/mock-llm` | `LlmPort` | no |
`src/ai` + `src/domain/slides` stay pure (no DOM/vendor) — enforced by boundary rules.

## 7. Intent schema & guardrails (§6)
- `validateDeckIntent(text)`: JSON-parse → `slides: array` (1..N) → each `{ title: string, bullets: string[] of strings }`. Caps counts.
- Pipeline `generateDeckIntent` reuses the M3 self-correction loop (re-prompt with validator error, bounded retries).
- The applier only writes via deck ops; the model never sets geometry/colour.

## 8. Flow / sequence
Slides prompt bar → `buildDeck(prompt)` → `generateDeckIntent` (pipeline) → `applyDeckIntent` → `SlideDeck` → editor renders
rail+stage → autosave. Present button → full-screen overlay scaling the current slide; ←/→ navigate; Esc exits.

## 9. Error handling
`buildDeck` returns `{ deck, ok, note, trace }`; on failure the deck is unchanged. Validation rejects malformed model output.
`normalizeDeck` guards malformed `file.data` (always ≥1 slide).

## 10. ADRs
Realises ADR-0003 for the Slides type. No new ADR.

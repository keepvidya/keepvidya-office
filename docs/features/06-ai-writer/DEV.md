# DEV — 06 AI Writer ("prompt → document")

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1 + §6.

## 1. Approach (think-first)
Mirror M2/M4 for the document type. A thin pure **doc domain** (`DocData = {html}`, `normalizeDoc`, `wordCount`). A new
`DocIntent` (structure only) is validated, then `applyDocIntent` deterministically builds HTML (our formatting). `buildDoc`
reuses the generic pipeline. The Writer editor is a `contentEditable` page with an `execCommand` toolbar + a prompt bar +
live word count; it persists `{html}` via `saveData`.

## 2. Ports touched
- Outbound: `LlmPort` (reused). Inbound: `buildDoc(prompt, deps)`. Persistence via `saveData`.

## 3. Domain / AI model
- `DocData = { html: string }`; `wordCount(text)`, `normalizeDoc(data)`.
- `DocBlock = {type:'heading';level:1|2|3;text} | {type:'paragraph';text} | {type:'bullets';items:string[]}`; `DocIntent = { blocks: DocBlock[] }`.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| `validateDocIntent` | JSON.parse + per-block checks | O(n) (blocks/items) | O(n) | cap counts |
| `applyDocIntent` | map blocks → HTML | O(n) | O(n) | — |
| `wordCount` | split on whitespace | O(L) | O(1) | — |

## 5. Design patterns used
- **Builder** — `applyDocIntent` assembles HTML from structured blocks via fixed templates.
- **Strategy/Chain** — reused pipeline. **Model-View** — `DocData` ↔ editable page.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| (future) Shiva/BYOK | `adapters/llm/*` | `LlmPort` | no |
| `document.execCommand` (DOM) | used only inside `src/ui/writer` | — | n/a (UI layer) |
`src/ai` + `src/domain/doc` stay pure.

## 7. Intent schema & guardrails (§6)
- `validateDocIntent(text)`: JSON-parse → `blocks: array` (1..N) → each a valid block (heading needs `text`, level clamped 1–3; paragraph needs `text`; bullets needs `items: string[]`). Caps counts.
- Pipeline `buildDoc` reuses the self-correction loop. The applier owns all HTML/formatting; the model never emits markup.

## 8. Flow / sequence
Writer prompt bar → `buildDoc(prompt)` → `generateIntent` (pipeline) → `applyDocIntent` → `{html}` → page re-rendered →
autosave. Manual edits go through `contentEditable`/`execCommand` → `onChange({html})`.

## 9. Error handling
`buildDoc` returns `{data, ok, note, trace}`; on failure the document is unchanged. `normalizeDoc` guards malformed data.

## 10. ADRs
Realises ADR-0003 for the Writer type. No new ADR.

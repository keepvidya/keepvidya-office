# DEV — 02 Sheets edit slice

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1.

## 1. Approach (think-first)
Add a tiny pure **sheet domain** (`src/domain/sheet/`) over the M1 engine — `setCell`/`clearCell` (immutable),
`compute` (delegates to `recalc`), `aggregate` (selection summary), `normalizeSheet`. Build a **grid UI**
(`src/ui/sheets/`) that holds the active cell + sheet state, renders displays from `compute`, and emits changed
`SheetData` to the composition root, which persists via the M0 `saveData` use-case. The grid is built once; only cell
text/classes are updated on edits (keeps editing O(visible cells)).

## 2. Ports touched
- Inbound: `setCell`/`clearCell`/`compute`/`aggregate` (driven by the grid UI).
- Outbound: `StoragePort` via the existing `saveData` use-case (no new outbound port).

## 3. Domain model
- `SheetData = { cells: CellMap; cols: number; rows: number }` (reuses the engine's `CellMap`).
- `Aggregate = { count; sum; avg|null; min|null; max|null }`.
- All sheet functions are pure and return new objects (no mutation).

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| `setCell` | shallow-cloned map | O(k) (k = cells) | O(k) | trivial |
| `compute` | engine `recalc` | O(C+R) (memoised) | O(C) | inherits M1 budget |
| render displays | `tdMap[ref]` lookup | O(V) (V visible cells) | O(V) | one pass per edit |
| `aggregate(refs)` | linear scan | O(s) (s = selection) | O(1) | — |

## 5. Design patterns used
- **Facade** — `domain/sheet` over the formula engine.
- **Model-View** — `SheetData` (model) ↔ grid (view); view re-derives displays from `compute`.
- **Command-ish** — each commit applies `setCell` and persists; immutable updates make undo trivial later.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| *(none)* | — | — | — |
Grid uses the DOM directly inside `src/ui/**` (allowed; UI layer). Persistence stays behind `StoragePort`.

## 7. Flow / sequence
keydown/click → grid edits active cell → `setCell(data,ref,raw)` → `compute(data)` → update `tdMap` displays + formula bar
+ status → `onChange(data)` → composition root → `saveData` → IndexedDB. Reload → `OpenFile` → grid renders restored data.

## 8. Error handling
Engine errors are values (`CellResult.isError`) rendered as error text — never thrown to the UI. `normalizeSheet` guards
malformed `file.data`. Out-of-range navigation is clamped.

## 9. Risks & mitigations
- *Re-rendering 2,600 cells per keystroke* → build grid once, update only changed cells' text/classes from `compute`.
- *Focus/keyboard handling for inline edit* → a single positioned `<input>` overlay; commit on Enter/Tab/blur (ported, proven in the prototype).

## 10. ADRs
No new ADR. Composes M0 (shell/persistence) + M1 (engine) into the first end-user feature.

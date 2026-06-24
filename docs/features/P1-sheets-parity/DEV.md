# DEV — P1 Sheets parity

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1.

## 1. Approach (think-first)
Extend the sheet domain with pure helpers (`cellsInRange`, `setCells`, `setCellFormat`) and a `fmt` map on `SheetData`.
Refactor the grid view to track a **selection rectangle** (anchor + active) instead of a single active cell; render the
in-range highlight + a status-bar aggregate (reusing the existing `aggregate`). Add a small toolbar (Bold, Italic, ∑) and a
paste handler. xlsx export reads `fmt` to set cell font (bold/italic) for fidelity.

## 2. Ports touched
- Inbound: the grid view drives `setCell`/`setCells`/`setCellFormat`/`compute`/`aggregate`. Persistence via `saveData` (unchanged).
- Outbound: `ExportPort.xlsx` extended to apply `fmt`.

## 3. Domain model
- `CellFmt = { b?: boolean; i?: boolean }`; `SheetData.fmt?: Record<Ref, CellFmt>`.
- `cellsInRange(c1,r1,c2,r2): Ref[]`, `setCells(data, writes)`, `setCellFormat(data, refs, patch)` — all immutable.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| selection paint | iterate rect | O(area) | O(1) | visible only |
| aggregate(range) | linear scan | O(area) | O(1) | — |
| paste | split TSV → setCells | O(cells) | O(cells) | — |
| setCellFormat | clone fmt | O(k) | O(k) | — |

## 5. Design patterns used
- **Model-View** — selection is view state; data ops are pure domain. **Command** — batch `setCells` for paste; format toggle.

## 6. External modules (Wrapper Rule)
None new. The grid stays in `src/ui` (DOM allowed there); domain stays pure.

## 7. Flow / sequence
mousedown → set anchor+active; drag/shift → extend active; paint rect + status aggregate. Toolbar Bold → `setCellFormat`
over selection → re-render + save. ∑ → compute target/range → `setCell('=SUM(range)')`. Paste → parse TSV → `setCells` from active.

## 8. Error handling
Selection clamped to the grid. Paste ignores empty trailing rows. Format on empty selection is a no-op.

## 9. Risks & mitigations
- *Refactor breaks M2 typing/persistence e2e* → keep `active` semantics for single-cell ops; run the full M2 e2e.
- *Re-render cost on drag* → update only cell classes (no rebuild), as in M2.

## 10. ADRs
No new ADR — feature-parity slice over M2.

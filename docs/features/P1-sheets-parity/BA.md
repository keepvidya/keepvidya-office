# BA — P1 Sheets parity

> Business Analysis. Written FIRST. Closes the gap between the typed Sheets editor (M2) and the reference prototype.

## 1. Problem & context
M2 gave a working grid but deferred several editing niceties the prototype had. This slice ports them onto the typed
editor so Sheets feels complete: **range selection** with a live aggregate, **cell bold/italic**, a **∑ quick-sum**, and
**multi-cell paste**. All deterministic — no AI.

## 2. Users & jobs-to-be-done
- Spreadsheet user. Job: "When I drag across cells I want to see their sum/average; I want to bold a header, paste a table, and sum a column with one click."

## 3. User stories
- **US-1**: As a user, I want to drag (or shift-click / shift-arrow) to select a range and see Sum/Avg/Count/Min/Max in the status bar.
- **US-2**: As a user, I want to bold/italic the selected cells.
- **US-3**: As a user, I want a ∑ button that inserts `=SUM(range)` for my selection (or the column above).
- **US-4**: As a user, I want to paste tab/newline-separated data across many cells at once.

## 4. Acceptance criteria (testable)
- **AC-1** (domain): `cellsInRange`, `setCells` (batch, immutable), `setCellFormat` (toggle b/i, immutable), `aggregate` over a multi-cell selection behave; `normalizeSheet` carries `fmt`. *(→ TC-P1.1.x)*
- **AC-2** (US-1): GIVEN A1=10,A2=20,A3=30, WHEN I drag-select A1:A3, THEN the status bar shows Sum 60, Avg 20, Count 3, Min 10, Max 30. *(→ TC-P1.3.1)*
- **AC-3** (US-2): WHEN I select a cell and click Bold, THEN that cell renders bold and the format persists on reload. *(→ TC-P1.3.2)*
- **AC-4** (US-3): GIVEN values in A1:A3 and A4 active, WHEN I click ∑, THEN A4 becomes `=SUM(A1:A3)` and shows the total. *(→ TC-P1.3.3)*
- **AC-5** (US-4): WHEN I paste `1\t2\n3\t4` at A1, THEN A1=1,B1=2,A2=3,B2=4. *(→ TC-P1.3.4)*

## 5. Scope
- **In**: range selection (drag, shift-click, shift-arrow, header click) + aggregate; a Sheets toolbar (Bold, Italic, ∑); cell b/i format model + render + xlsx fidelity; TSV paste.
- **Out**: number formats, borders/fills, freeze panes, multiple sheets, charts.

## 6. Success metrics / done-signal
A user can select a range and read its totals, bold a header (which exports bold to Excel), ∑ a column, and paste a table; edits persist; 0 console errors.

## 7. Open questions / decisions for owner
- ∑ with a single active cell sums the contiguous numbers directly above it (prototype behaviour). ✔ assumed OK.

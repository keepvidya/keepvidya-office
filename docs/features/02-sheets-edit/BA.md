# BA — 02 Sheets edit slice

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
M1 gave us a trustworthy calculator; M0 gave us a shell with a placeholder Sheets editor. M2 connects them: a **real,
editable grid** where typing a value or `=formula` shows the correct result instantly and persists locally. This is the
first genuinely useful end-user feature and the surface the AI Sheets agent (M5) will later drive.

## 2. Users & jobs-to-be-done
- Primary user: a spreadsheet user. Job: "When I open a spreadsheet, I want to click a cell, type a number or formula, and
  see the answer — and have it still be there tomorrow."

## 3. User stories
- **US-1**: As a user, I want a grid of rows/columns with A1-style headers so I can place data.
- **US-2**: As a user, I want to select a cell (click or arrow keys) and type a value or `=formula`, committing with Enter/Tab.
- **US-3**: As a user, I want formulas to compute live (via the M1 engine) and show errors as error text.
- **US-4**: As a user, I want a formula bar showing/editing the active cell's raw content.
- **US-5**: As a user, I want my edits saved automatically and restored on reload.
- **US-6**: As a user, I want a status bar showing the active cell and (for numbers) its value.

## 4. Acceptance criteria (testable)
- **AC-1** (US-1): GIVEN a new spreadsheet, THEN a grid renders with column headers A,B,… and row numbers 1,2,…. *(→ TC-02.3.1)*
- **AC-2** (US-2/US-3): GIVEN cells A1=10, A2=20, WHEN I type `=SUM(A1:A2)` into A3 and press Enter, THEN A3 shows `30`. *(→ TC-02.3.2)*
- **AC-3** (US-3): GIVEN A1=1, WHEN A2=`=A1/0`, THEN A2 shows `#DIV/0!` (error styled). *(→ TC-02.3.3)*
- **AC-4** (US-4): GIVEN A3 holds `=SUM(A1:A2)`, WHEN A3 is selected, THEN the formula bar shows `=SUM(A1:A2)` and editing it + Enter updates the cell. *(→ TC-02.3.4)*
- **AC-5** (US-5): GIVEN edited cells, WHEN I reload, THEN the values (and recomputed formulas) are restored. *(→ TC-02.3.5)*
- **AC-6** (domain): GIVEN a sheet, `setCell`/`clearCell` produce a new immutable sheet; `compute` returns engine results; `aggregate` summarises a selection. *(→ TC-02.1.x)*

## 5. Scope
- **In**: editable grid (click + keyboard nav + inline edit), formula bar, live recalc via M1 engine, autosave + restore, a status bar.
- **Out** (later slices): drag range-selection & multi-cell paste, bold/italic/number formats, multiple sheets, charts, export, the AI prompt bar.

## 6. Success metrics / done-signal
A user can build the budget/invoice by hand and the totals compute; edits survive reload; engine errors surface; 0 console errors.

## 7. (AI) — N/A this slice.

## 8. Open questions / decisions for owner
- Range *selection* (drag-highlight) deferred to a follow-up; range *references* in formulas already work. ✔ assumed OK.

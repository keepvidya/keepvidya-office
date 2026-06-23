# BA — 01 Formula engine (domain)

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
A spreadsheet that competes with Excel lives or dies on its **formula engine**. The reference prototype proved a working
engine (`prototype/src/formula.js`); this slice makes it the **deterministic core** of the real product: pure, typed,
isolated behind a clean evaluation API so the Sheets UI (M2) and the AI Sheets agent (M5) both build on the same trustworthy
calculator. This is the [`narrator principle`] in action — numbers are *computed here*, never produced by a model.

## 2. Users & jobs-to-be-done
- Primary user: a spreadsheet user. Job: "When I type `=SUM(A1:A3)` or `=IF(B1>50,"hi","lo")`, I want the correct result instantly, so I can trust my numbers."
- Secondary user: the Sheets UI / AI agent. Job: "Given a map of cells, give me each cell's computed value, errors and all."

## 3. User stories
- **US-1**: As a user, I want arithmetic, comparison, text-concat and percent operators to evaluate correctly (incl. precedence).
- **US-2**: As a user, I want functions (math, stats, logic, text, lookup, info) to match Excel's behaviour for common cases.
- **US-3**: As a user, I want cell & range references (`A1`, `$A$1`, `A1:B3`) and cross-cell dependencies to resolve.
- **US-4**: As a user, I want clear error values (`#DIV/0! #VALUE! #NAME? #REF! #N/A`) and **circular references detected** (`#CIRC!`), never a crash or a wrong silent answer.
- **US-5**: As the next slice, I want a single `recalc(cells)` API returning every cell's display + typed value.

## 4. Acceptance criteria (testable)
- **AC-1** (US-1): GIVEN `A1=10,A2=20`, WHEN evaluating `=A1*2+A2`, THEN result is `40`; `=2^3^… ` and `%`/`&` precedence hold. *(→ TC-01.1.x)*
- **AC-2** (US-2): GIVEN a fixture sheet, WHEN evaluating `SUM/AVERAGE/MIN/MAX/COUNT/IF/ROUND/CONCAT/LEN/LEFT/VLOOKUP/MATCH/INDEX/COUNTIF/SUMIF/…`, THEN each returns the Excel-correct value. *(→ TC-01.2.x)*
- **AC-3** (US-3): GIVEN `A1..A3`, WHEN evaluating `=SUM(A1:A3)` and chained refs `B1=A1, C1=B1+1`, THEN ranges + transitive deps resolve. *(→ TC-01.3.x)*
- **AC-4** (US-4): GIVEN `=A1/0`, THEN `#DIV/0!`; GIVEN `=FOO()`, THEN `#NAME?`; GIVEN `C1=C2,C2=C1`, THEN `#CIRC!` (no infinite loop). *(→ TC-01.4.x)*
- **AC-5** (US-5): GIVEN a `cells` map, WHEN `recalc(cells)` runs, THEN it returns `{display,value,isNumber,isError}` for every non-empty cell. *(→ TC-01.5.x)*
- **AC-6** (perf): GIVEN a 1,000-cell dependency chain, WHEN `recalc` runs, THEN it completes within the documented budget (memoised, no re-walk). *(→ TC-01.6.1)*

## 5. Scope
- **In**: pure TS formula engine in `src/domain/formula/` (tokenizer, parser, evaluator, function library, dependency-aware recalc with cycle detection) + `recalc`/`evaluateFormula` API.
- **Out**: the Sheets grid/UI (M2), number-formatting/styles, charts, multi-sheet refs, array spill, live model/AI.

## 6. Success metrics / done-signal
All AC test cases pass; ≥90% coverage on the engine; perf budget met; engine is import-clean (no DOM/vendor) per the boundary check.

## 7. Open questions / decisions for owner
- Date functions return locale strings (prototype behaviour) — acceptable for now; Excel-serial dates deferred. ✔ assumed yes.

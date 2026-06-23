# DEV — 01 Formula engine (domain)

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1.

## 1. Approach (think-first)
Port the proven prototype engine into pure, typed, **single-responsibility modules** under `src/domain/formula/`. No DOM,
no vendor — it is domain logic, so it lives in the domain and is reached by the (future) Sheets use-case directly. Public
surface is two functions: `recalc(cells)` and `evaluateFormula(expr, cells)`.

## 2. Ports touched
- Inbound: a thin domain API `recalc` / `evaluateFormula` (the Sheets UI use-case in M2 calls these). No new outbound port.
- Outbound: none (pure computation).

## 3. Domain model
- `CellMap = Record<Ref, RawCell>` where `RawCell = string | number`.
- `CellResult = { value: CellValue; display: string; isNumber: boolean; isError: boolean }`.
- `CellValue = number | string | boolean | null | ErrorValue`.
- AST node union (`Num|Str|Bool|Ref|Range|Unary|Postfix|Bin|Call`).

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| Tokenize one formula | linear scan + regex | O(L) (L = formula length) | O(T) tokens | — |
| Parse | recursive-descent (precedence climbing) | O(T) | O(depth) | — |
| `recalc(cells)` | lazy memoised eval + `visiting` set for cycles | **O(C + R)** (C cells, R reference edges); each cell computed once (memo) | O(C) cache | **1,000-cell chain < 100 ms** |
| Cycle detection | DFS `visiting` set | O(1) per node | O(depth) | throws `#CIRC!`, no infinite loop |

Memoisation guarantees each referenced cell is evaluated **once** per `recalc`, so a deep dependency chain is linear, not
exponential. A `visiting` set converts a would-be infinite recursion into a detected `#CIRC!`.

## 5. Design patterns used
- **Interpreter** — AST + `evalNode` walk.
- **Strategy** — the `FUNCTIONS` registry (name → implementation); adding a function is open/closed, no engine change.
- **Facade** — `engine.ts`/`index.ts` expose `recalc`/`evaluateFormula`, hiding tokenizer/parser/evaluator.
- **Result/Error-as-value** — `ErrorValue` propagates via controlled throws caught at the cell boundary.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| *(none)* | — | — | — |

Pure TS only. Enforced by `npm run boundary` (no npm imports from `src/domain`).

## 7. Flow / sequence
`recalc(cells)` → for each non-empty cell → `valueOf(ref)` (memoised): literal → coerce; `=` → `tokenize → parse → evalNode`
with a resolver that calls `valueOf` for refs/ranges (recursion + `visiting` cycle guard) → `present(value)` → `CellResult`.

## 8. Error handling
`ErrorValue = { kind: ErrCode }`. Coercion (`num/text/bool`) throws the error value; the cell-compute boundary catches and
stores it as a result. `IFERROR`/`ISERROR` catch via try around lazy arg evaluation. No throw escapes `recalc`.

## 9. Risks & mitigations
- *Behavioural drift from the prototype* → port tests assert the same outputs I verified live (SUM=60, VLOOKUP=20, `#CIRC!`, …).
- *Perf regression on deep chains* → explicit perf test (TC-01.6.1) with a budget.
- *Coverage of the large function library* → a broad parametrised function test (TC-01.2.x).

## 10. ADRs
No new ADR. Realises ADR-0003's "deterministic engine" half (the narrator boundary). Re-homes `prototype/src/formula.js`.

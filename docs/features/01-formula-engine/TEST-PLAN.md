# TEST PLAN — 01 Formula engine (domain)

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-01
- **Items under test**: `src/domain/formula/**` (refs, tokenizer, parser, evaluator, functions, engine `recalc`/`evaluateFormula`).
- **In scope**: operators, functions, refs/ranges, dependency resolution, errors, circular detection, recalc API, perf.
- **Out of scope**: Sheets UI, formatting, multi-sheet, arrays.
- **Approach**: unit + engine-level integration + a perf test. No e2e (no UI delta).
- **Environment**: Node 18+, Vitest.
- **Entry/exit**: see QA.md.

---

## Suite TS-01.1 — Operators & precedence (UNIT)
### TC-01.1.1 — arithmetic + precedence
| # | Action | Expected result |
|---|---|---|
| 1 | `evaluateFormula('=A1*2+A2', {A1:'10',A2:'20'})` | `.value === 40` |
| 2 | `evaluateFormula('=2+3*4')` | `14` |
| 3 | `evaluateFormula('=(2+3)*4')` | `20` |
| 4 | `evaluateFormula('=10/4')` | `2.5` |

### TC-01.1.2 — concat, percent, comparison, unary
| # | Action | Expected result |
|---|---|---|
| 1 | `=\"a\"&\"b\"&1` | `'ab1'` |
| 2 | `=50%` | `0.5` |
| 3 | `=3>2` | `true` |
| 4 | `=-2^2`-style `=-(2)+5` | `3` |

### TC-01.1.3 — power
| # | Action | Expected result |
|---|---|---|
| 1 | `=2^10` | `1024` |

---

## Suite TS-01.2 — Function library (UNIT)
### TC-01.2.1 — aggregate / math / logic / text on a fixture
- **Test data**: `{A1:'10',A2:'20',A3:'30',A4:'apple',A5:'banana'}`
| # | Action | Expected result |
|---|---|---|
| 1 | `=SUM(A1:A3)` | `60` |
| 2 | `=AVERAGE(A1:A3)` | `20` |
| 3 | `=MIN(A1:A3)` / `=MAX(A1:A3)` | `10` / `30` |
| 4 | `=IF(SUM(A1:A3)>50,"big","small")` | `'big'` |
| 5 | `=ROUND(PI(),2)` | `3.14` |
| 6 | `=CONCAT(A4," ",A5)` | `'apple banana'` |
| 7 | `=LEN(UPPER(A4))` | `5` |

### TC-01.2.2 — lookup / conditional aggregate
- **Test data**: `{A1:'10',A2:'20',A3:'30'}`
| # | Action | Expected result |
|---|---|---|
| 1 | `=VLOOKUP(20,A1:A3,1,FALSE)` | `20` |
| 2 | `=MATCH(30,A1:A3,0)` | `3` |
| 3 | `=INDEX(A1:A3,2)` | `20` |
| 4 | `=COUNTIF(A1:A3,">15")` | `2` |
| 5 | `=SUMIF(A1:A3,">=20")` | `50` |

---

## Suite TS-01.3 — References & dependencies (UNIT)
### TC-01.3.1 — A1 helpers round-trip
| # | Action | Expected result |
|---|---|---|
| 1 | `colToNum('A')`, `colToNum('AA')` | `1`, `27` |
| 2 | `numToCol(1)`, `numToCol(27)` | `'A'`, `'AA'` |
| 3 | `parseRef('$B$3')` | `{col:2,row:3}` |

### TC-01.3.2 — transitive dependencies + ranges
- **Test data**: `{A1:'5', B1:'=A1*2', C1:'=B1+1', D1:'=SUM(A1:C1)'}`
| # | Action | Expected (display) |
|---|---|---|
| 1 | `recalc` then read `B1` | `'10'` |
| 2 | read `C1` | `'11'` |
| 3 | read `D1` | `'26'` (5+10+11) |

---

## Suite TS-01.4 — Errors & circular refs (UNIT)
### TC-01.4.1 — error values
| # | Action | Expected result |
|---|---|---|
| 1 | `=A1/0` with `A1=1` | display `#DIV/0!`, `isError true` |
| 2 | `=FOO()` | `#NAME?` |
| 3 | `=SQRT(-1)` | `#NUM!` |
| 4 | `=IFERROR(A1/0,"safe")` | `'safe'` |

### TC-01.4.2 — circular reference is detected (no hang)
- **Test data**: `{C1:'=C2', C2:'=C1'}`
| # | Action | Expected result |
|---|---|---|
| 1 | `recalc` returns within the test timeout | does NOT hang |
| 2 | `C1` result | display `#CIRC!`, `isError true` |

---

## Suite TS-01.5 — recalc API on realistic sheets (INTEGRATION)
### TC-01.5.1 — budget + invoice fixtures compute end-to-end
- **Test data**: the prototype budget (`B8=SUM(B2:B7)`) and invoice (`D2=B2*C2`, `D5=SUM(D2:D4)`, `D7=D5+D6`).
| # | Action | Expected result |
|---|---|---|
| 1 | `recalc(budget)` → `B8` | `'2480'` |
| 2 | `recalc(invoice)` → `D2` | `'1200'` |
| 3 | invoice `D5` | `'2000'` |
| 4 | invoice `D7` (total) | `'2360'` |
| 5 | every returned result has `{display,value,isNumber,isError}` | shape holds |

---

## Suite TS-01.6 — Performance (PERF)
### TC-01.6.1 — 1,000-cell dependency chain within budget
- **Test data**: `A1=1`, `A2='=A1+1'`, … `A1000='=A999+1'`.
| # | Action | Expected result |
|---|---|---|
| 1 | build the chain + `recalc` | `A1000` display `'1000'` |
| 2 | measure elapsed | `< 100 ms` (memoised, single pass) |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-01.1.1–.3 |
| AC-2 | TC-01.2.1–.2, TC-01.5.1 |
| AC-3 | TC-01.3.1–.2, TC-01.5.1 |
| AC-4 | TC-01.4.1–.2 |
| AC-5 | TC-01.5.1 |
| AC-6 | TC-01.6.1 |

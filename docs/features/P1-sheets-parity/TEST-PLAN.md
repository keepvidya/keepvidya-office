# TEST PLAN — P1 Sheets parity

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-P1
- **Items under test**: `src/domain/sheet/sheet` (new helpers + fmt), `src/ui/sheets/sheets-view` (selection, toolbar, paste), `xlsx-export` (font).
- **Approach**: unit + integration + e2e. **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-P1.1 — Sheet domain additions (UNIT)
### TC-P1.1.1 — cellsInRange + setCells (batch, immutable)
| # | Action | Expected result |
|---|---|---|
| 1 | `cellsInRange(1,1,2,2)` | `['A1','B1','A2','B2']` |
| 2 | `setCells(base,[{ref:'A1',value:'1'},{ref:'B1',value:'2'}])` | both set; original unchanged |
| 3 | `setCells(base,[{ref:'A1',value:''}])` | clears `A1` |

### TC-P1.1.2 — setCellFormat toggles immutably
| # | Action | Expected result |
|---|---|---|
| 1 | `setCellFormat(base,['A1'],{b:true})` | `fmt.A1.b===true`; original unchanged |
| 2 | `setCellFormat(d,['A1'],{b:false})` (then no i) | `fmt.A1` removed (empty) |

### TC-P1.1.3 — aggregate over a range
| # | Action | Expected result |
|---|---|---|
| 1 | compute `{A1:'10',A2:'20',A3:'30'}`; `aggregate(results, cellsInRange(1,1,1,3))` | `{count:3,sum:60,avg:20,min:10,max:30}` |

### TC-P1.1.4 — normalizeSheet carries fmt
| # | Action | Expected result |
|---|---|---|
| 1 | `normalizeSheet({cells:{},fmt:{A1:{b:true}}})` | `fmt.A1.b===true` |
| 2 | `normalizeSheet(undefined).fmt` | `{}` |

---

## Suite TS-P1.2 — xlsx font fidelity (INTEGRATION)
### TC-P1.2.1 — bold cell exports bold
| # | Action | Expected result |
|---|---|---|
| 1 | export a sheet with `A1='Hi'`, `fmt.A1.b=true`; re-read with ExcelJS | `getCell('A1').font.bold === true` |

---

## Suite TS-P1.3 — Grid editor (E2E — Playwright)
### TC-P1.3.1 — drag-select shows aggregate
| # | Action | Expected result |
|---|---|---|
| 1 | type 10/20/30 into A1/A2/A3 | values shown |
| 2 | drag-select A1:A3 | status bar contains `Sum 60`, `Avg 20`, `Count 3`, `Min 10`, `Max 30` |

### TC-P1.3.2 — bold toggles + persists
| # | Action | Expected result |
|---|---|---|
| 1 | select A1, click Bold | A1 renders bold |
| 2 | reload, reopen | A1 still bold |

### TC-P1.3.3 — ∑ inserts SUM
| # | Action | Expected result |
|---|---|---|
| 1 | 10/20/30 in A1:A3; select A4; click ∑ | A4 shows `60`; formula bar shows `=SUM(A1:A3)` |

### TC-P1.3.4 — multi-cell paste
| # | Action | Expected result |
|---|---|---|
| 1 | select A1; paste `1\t2\n3\t4` | A1=1, B1=2, A2=3, B2=4 |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-P1.1.1–.4 |
| AC-2 | TC-P1.1.3, TC-P1.3.1 |
| AC-3 | TC-P1.1.2, TC-P1.2.1, TC-P1.3.2 |
| AC-4 | TC-P1.3.3 |
| AC-5 | TC-P1.1.1, TC-P1.3.4 |

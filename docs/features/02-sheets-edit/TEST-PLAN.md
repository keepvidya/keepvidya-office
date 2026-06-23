# TEST PLAN — 02 Sheets edit slice

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-02
- **Items under test**: `src/domain/sheet/**`, `src/ui/sheets/**`, composition-root wiring.
- **In scope**: grid editing, live recalc, formula bar, persistence, status bar. **Out**: range-select, formats, multi-sheet.
- **Approach**: unit (domain) + integration (setCell→compute) + e2e (real grid).
- **Environment**: Node + Vitest; Chromium + Playwright; IndexedDB.

---

## Suite TS-02.1 — Sheet domain (UNIT)
### TC-02.1.1 — setCell / clearCell are immutable
| # | Action | Expected result |
|---|---|---|
| 1 | `setCell({cells:{},cols:26,rows:100},'A1','10')` | returns new data with `cells.A1==='10'`; original unchanged |
| 2 | `setCell(d,'A1','')` | removes `A1` (empty clears) |
| 3 | `clearCell(d,'A1')` | `A1` absent |

### TC-02.1.2 — compute delegates to the engine
| # | Action | Expected result |
|---|---|---|
| 1 | `compute({cells:{A1:'2',A2:'3',A3:'=A1+A2'}})` | `result.A3.display==='5'` |

### TC-02.1.3 — aggregate summarises a selection
| # | Action | Expected result |
|---|---|---|
| 1 | `aggregate(results,['A1','A2','A3'])` over 10/20/text | `{count:2,sum:30,avg:15,min:10,max:20}` (text ignored) |
| 2 | aggregate over no numbers | `{count:0,sum:0,avg:null,min:null,max:null}` |

### TC-02.1.4 — normalizeSheet guards bad input
| # | Action | Expected result |
|---|---|---|
| 1 | `normalizeSheet(undefined)` | `{cells:{},cols:26,rows:100}` |
| 2 | `normalizeSheet({cells:{A1:'1'}})` | keeps cells, fills cols/rows defaults |

---

## Suite TS-02.2 — setCell → compute (INTEGRATION)
### TC-02.2.1 — building a total by successive edits
| # | Action | Expected result |
|---|---|---|
| 1 | start empty; setCell B2..B7 to the budget amounts; setCell B8 `=SUM(B2:B7)`; `compute` | `B8.display==='2480'` |
| 2 | setCell B2 `=4500` then change to `9000`; recompute | `B8.display==='6980'` (dependent updates) |

---

## Suite TS-02.3 — Grid editor (E2E — Playwright)
### TC-02.3.1 — grid renders
| # | Action | Expected result |
|---|---|---|
| 1 | create a spreadsheet | grid visible; header `A` and row `1` present; formula bar present; 0 console errors |

### TC-02.3.2 — type values + SUM formula
| # | Action | Expected result |
|---|---|---|
| 1 | click A1, type `10`, Enter | A1 shows `10` |
| 2 | type `20`, Enter (now A2) | A2 shows `20` |
| 3 | type `=SUM(A1:A2)`, Enter | A3 shows `30` |

### TC-02.3.3 — error value displays
| # | Action | Expected result |
|---|---|---|
| 1 | click B1, type `=1/0`, Enter | B1 shows `#DIV/0!` (error styled); no console error |

### TC-02.3.4 — formula bar reflects + edits the active cell
| # | Action | Expected result |
|---|---|---|
| 1 | click A3 | formula bar value is `=SUM(A1:A2)` |
| 2 | set formula bar to `=A1*A2`, press Enter | A3 shows `200` |

### TC-02.3.5 — persistence across reload
| # | Action | Expected result |
|---|---|---|
| 1 | reload the page, reopen the sheet | A1=`10`, A2=`20`, A3 recomputed (`200`) still shown |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-02.3.1 |
| AC-2 | TC-02.2.1, TC-02.3.2 |
| AC-3 | TC-02.3.3 |
| AC-4 | TC-02.3.4 |
| AC-5 | TC-02.3.5 |
| AC-6 | TC-02.1.1–.4, TC-02.2.1 |

# TEST PLAN — 00 Walking Skeleton

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. **Every step has an Action and an Expected Result.**

## 1. Test plan header
- **Plan id**: TP-00
- **Items under test**: `CreateFile`/`ListFiles`/`OpenFile` use-cases, `StoragePort` adapters, hash router, theme store, app shell.
- **In scope**: boot, routing, persistence, theming, CI gates. **Out**: editor functionality, AI, export.
- **Approach**: unit + integration + e2e (no AI eval in M0).
- **Environment**: Node 18+, Vitest, Playwright/Chromium, `fake-indexeddb`.
- **Entry/exit**: see QA.md. **Deliverables**: passing suites, coverage report, Home visual snapshot.

---

## Suite TS-00.1 — Use-cases & stores (UNIT)

### TC-00.1.1 — Create then list/open a file (memory storage)
- **Preconditions**: `createApp` wired with `memory-storage` fake + fixed `ClockPort` (returns 1_000).
- **Test data**: type `sheets`, name `Untitled spreadsheet`.

| # | Action | Expected result |
|---|---|---|
| 1 | Call `CreateFile({type:'sheets'})` | Returns `Ok(file)` with a non-empty `id`, `created=modified=1000` |
| 2 | Call `ListFiles()` | Returns array length 1 containing that `id` |
| 3 | Call `OpenFile(id)` | Returns `Ok(file)` with `type:'sheets'` and the same `id` |
| 4 | Call `OpenFile('nope')` | Returns `Err(NotFound)` (no throw) |

- **Pass/Fail**: ☐

### TC-00.1.2 — Theme store persists choice
- **Preconditions**: theme store bound to a fake key-value.

| # | Action | Expected result |
|---|---|---|
| 1 | Read theme with empty store | Returns default `'light'` |
| 2 | Set theme `'dark'` | Store holds `'dark'`; `document.documentElement[data-theme]` = `dark` |
| 3 | Re-read theme | Returns `'dark'` |

- **Pass/Fail**: ☐

---

## Suite TS-00.2 — Storage adapter (INTEGRATION)

### TC-00.2.1 — IndexedDB adapter round-trips a file
- **Preconditions**: real `indexeddb-storage` adapter over `fake-indexeddb` (vendor NOT mocked).

| # | Action | Expected result |
|---|---|---|
| 1 | `put(file)` then `getAll()` | `getAll()` includes the file with identical fields |
| 2 | `get(file.id)` | Returns the file |
| 3 | New adapter instance (simulating reload), `get(file.id)` | Still returns the file (durable across instances) |

- **Pass/Fail**: ☐

---

## Suite TS-00.3 — Critical flows (E2E — Playwright)

### TC-00.3.1 — App boots to Home
- **Preconditions**: app served (dev build).

| # | Action | Expected result |
|---|---|---|
| 1 | Navigate to `/` | Home renders; brand "Keepvidya Office" visible; Writer/Sheets/Slides create tiles present; **0 console errors** |

- **Pass/Fail**: ☐

### TC-00.3.2 — Create routes to the editor
| # | Action | Expected result |
|---|---|---|
| 1 | Click "New spreadsheet" | URL hash becomes `#/sheets/<id>`; Sheets placeholder view mounts with an editable title |

- **Pass/Fail**: ☐

### TC-00.3.3 — Persistence survives reload
| # | Action | Expected result |
|---|---|---|
| 1 | Create a sheet, set title "Budget" | Title shows "Budget" |
| 2 | Reload the page | App returns to Home |
| 3 | Inspect Recent | A card "Budget" (type sheets) is listed |
| 4 | Open it | Sheets view mounts with title "Budget" |

- **Pass/Fail**: ☐

### TC-00.3.4 — Theme toggle is durable
| # | Action | Expected result |
|---|---|---|
| 1 | Click theme toggle | `data-theme` flips light↔dark; UI restyles |
| 2 | Reload | The chosen theme is still applied on first paint (no flash) |

- **Pass/Fail**: ☐

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-00.3.1 |
| AC-2 | TC-00.1.1, TC-00.3.2 |
| AC-3 | TC-00.1.1, TC-00.2.1, TC-00.3.3 |
| AC-4 | TC-00.1.2, TC-00.3.4 |
| AC-5 | CI workflow review (required checks block merge) |

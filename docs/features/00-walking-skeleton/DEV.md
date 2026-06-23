# DEV — 00 Walking Skeleton

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1.

## 1. Approach (think-first)
Stand up the hexagonal spine with the **thinnest** real path: a composition root wires a `StoragePort` (IndexedDB adapter)
and a `ClockPort` into an app shell that renders Home and four placeholder views via a hash router. No editor logic yet —
this proves boot, routing, persistence, theming, and CI. We re-home the prototype's look (theme tokens, launcher markup)
but behind typed modules.

## 2. Ports touched
- Inbound: `CreateFile`, `ListFiles`, `OpenFile` (use-cases driven by the UI).
- Outbound: `StoragePort` (persist/list/get files), `ClockPort` (timestamps — injected for deterministic tests).

## 3. Domain model
- `FileType = 'writer' | 'sheets' | 'slides'`
- `OfficeFile { id, type, name, data, created, modified }` (value object; `data` is opaque per-type JSON).
- Use-cases are pure functions over a `StoragePort` — no DOM, no IndexedDB types.

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Why / budget |
|---|---|---|---|---|
| List recent | array sorted by `modified` desc | O(n log n) | O(n) | n = file count (small); sort on read is fine |
| Get by id | IndexedDB keyPath `id` | O(1) avg | O(1) | indexed lookup |
| Create | append + put | O(1) | O(1) | id = time36+rand |

## 5. Design patterns used
- **Ports & Adapters / Dependency Inversion** — use-cases depend on `StoragePort`, not IndexedDB.
- **Factory** — `createApp(deps)` composition root injects adapters (real in app, fakes in tests).
- **Strategy** — router maps route → view factory.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by (adapter) | Port it implements | Vendor types leak? |
|---|---|---|---|
| IndexedDB (browser) | `adapters/storage/indexeddb-storage.ts` | `StoragePort` | no |
| (tests) in-memory | `adapters/storage/memory-storage.ts` | `StoragePort` | no |

## 7. (AI slices only)
N/A — no AI in M0.

## 8. Flow / sequence
`main.ts` → `createApp({ storage, clock })` → router reads `location.hash` → renders Home (calls `ListFiles`) or a view
(calls `OpenFile`). "New X" calls `CreateFile` then sets the hash.

## 9. Error handling
Use-cases return `Result<T, AppError>`. Storage failures surface a non-blocking toast; never swallowed. Unknown route → Home.

## 10. Risks & mitigations
- *IndexedDB async in tests* → inject `memory-storage` fake for unit; real adapter covered by one integration test.
- *Theme flash on load* → inline pre-paint script sets `data-theme` before first render (carried from prototype).

## 11. ADRs
- [ADR-0002](../../adr/0002-stack-web-first-typescript.md) (stack), [ADR-0001](../../adr/0001-record-architecture-decisions.md).

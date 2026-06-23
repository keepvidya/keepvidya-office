# QA — 00 Walking Skeleton

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Persistence loses data on reload | M | H | Integration test on real IndexedDB adapter + e2e reload |
| Router mounts wrong/blank view | M | M | Unit on route→view map + e2e navigation |
| Theme preference not durable | L | M | Unit on theme store + e2e toggle/reload |
| CI not actually red-blocking | L | H | Inspect required checks; intentionally break a test in a spike |

## 2. Test approach by level
- **Unit** (Vitest): use-cases with `memory-storage` fake; router map; theme store. ≥90% on new domain code.
- **Integration** (Vitest + fake-indexeddb): `indexeddb-storage` adapter round-trips an `OfficeFile`.
- **E2E** (Playwright): boot → Home renders → create sheet → reload → file persists → theme toggle persists.

## 3. Coverage matrix
| AC | Unit | Integration | E2E | Eval |
|---|---|---|---|---|
| AC-1 Home renders | — | — | TC-00.3.1 | — |
| AC-2 route to sheets | TC-00.1.1 | — | TC-00.3.2 | — |
| AC-3 persistence | TC-00.1.1 | TC-00.2.1 | TC-00.3.3 | — |
| AC-4 theme durable | TC-00.1.2 | — | TC-00.3.4 | — |
| AC-5 CI gates | — | — | — | CI review |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; Vitest/Playwright configured; fake-indexeddb installed.
- **Exit (Done)**: all TCs pass; coverage ≥90% new code; typecheck+lint+boundary green; code review + **visual review** approved; snapshot stored.

## 5. Visual review checklist
- [ ] Home launcher matches the prototype (brand, create tiles, recent grid)
- [ ] Light + dark screenshots attached to the PR
- [ ] Brand tokens correct; no console errors; usable at 1024px width
- [ ] Playwright visual snapshot of Home committed

## 6. Test environment & data
Chromium (Playwright), Node 18+, `fake-indexeddb` for integration. Seed: one created "Untitled spreadsheet".

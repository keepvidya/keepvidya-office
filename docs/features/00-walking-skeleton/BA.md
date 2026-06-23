# BA — 00 Walking Skeleton

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
Before any AI or office feature, we need a **real-but-minimal app spine** proving the architecture works end-to-end: it
boots in TypeScript, routes between the four areas, themes, persists a file locally, and is guarded by a green CI. This de-
risks everything after it ("join small to make large" starts from a trustworthy spine). Reference: the approved vanilla-JS
prototype already in `src/` (its launcher + three editors are the UX target).

## 2. Users & jobs-to-be-done
- Primary user: a person who wants a private place to make documents/sheets/decks.
- Job: "When I open the app, I want to land on a launcher and open each tool, so that I trust it works before I rely on it."
- Secondary user: the maintainer — "When I push code, I want CI to block regressions, so that `main` is always releasable."

## 3. User stories
- **US-1**: As a user, I want the app to open on a Home launcher with Writer/Sheets/Slides entry points, so I can navigate the suite.
- **US-2**: As a user, I want to create a file and have it still be there after I reload, so that nothing is lost.
- **US-3**: As a user, I want a light/dark theme toggle that sticks, so the app suits my environment.
- **US-4**: As a maintainer, I want CI to run typecheck + lint + boundary + unit + e2e on every PR, so quality is enforced.

## 4. Acceptance criteria (testable)
- **AC-1** (US-1): GIVEN the app is loaded, WHEN it renders, THEN a Home view shows the brand + create-new entries for Writer, Sheets, Slides. *(→ TC-00.3.1)*
- **AC-2** (US-1): GIVEN Home, WHEN I activate "New spreadsheet", THEN the route becomes `#/sheets/<id>` and a Sheets placeholder view mounts. *(→ TC-00.3.2)*
- **AC-3** (US-2): GIVEN I created a file, WHEN I reload the app, THEN that file appears in Recent and reopens with its content. *(→ TC-00.2.1, TC-00.3.3)*
- **AC-4** (US-3): GIVEN any view, WHEN I toggle theme, THEN `data-theme` flips and the choice survives reload. *(→ TC-00.1.2, TC-00.3.4)*
- **AC-5** (US-4): GIVEN a PR, WHEN CI runs, THEN typecheck, lint, import-boundary, unit, and e2e jobs all run and a failure blocks merge. *(→ CI config review)*

## 5. Scope
- **In**: TS app shell, hash router, Home launcher, four placeholder views, `StoragePort` (IndexedDB) create/list/get, theme toggle, CI workflow, repo governance files.
- **Out**: the actual editors' functionality (M1–M2), any AI (M3+), export, desktop packaging.

## 6. Success metrics / done-signal
App boots with zero console errors; all four routes mount; a created file survives reload; CI is green and red-blocking.

## 7. Open questions / decisions for owner
- Confirm product name stays **Keepvidya Office** (AI-native) in this repo (vs. a new name/repo).
- Confirm web-first now, desktop at M9 (ADR-0002).

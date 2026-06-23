# Changelog

All notable changes to Keepvidya Office are documented here. Format: [Keep a Changelog](https://keepachangelog.com);
versioning: [SemVer](https://semver.org).

## [Unreleased]

### Added — M3: AI plumbing (the narrator spine)
- **AI pipeline** (`src/ai/`) realising ADR-0003: `LlmPort` (model abstraction) → `validateSheetIntent` (hand-written
  schema, no vendor) → guardrail pipeline with **bounded self-correction** → deterministic `applySheetIntent` → engine
  computes. The model emits only validated *intent*; a malformed/hallucinated output is rejected before any cell changes.
- **Mock LLM adapter** (`adapters/llm/mock-llm`) — deterministic, so the whole pipeline is testable in CI; Shiva/BYOK swaps
  in at M4 behind the same port.
- **Sheets prompt bar**: type a request → cells fill and formulas compute live (e.g. a budget whose `Net=SUM(...)`=2400).
- **AI eval harness** (`tests/evals/`, §6.4): golden prompts scored on trajectory (retry count) + applied-cell correctness
  with a fixture model. Boundary rules extended to keep `src/ai` pure. 62 unit/integration/eval + 9 e2e green.
  Slice docs: `docs/features/03-ai-plumbing`.

### Added — M2: Sheets edit slice
- **Editable spreadsheet grid** (`src/ui/sheets/`) wired to the engine via a pure sheet domain
  (`src/domain/sheet/`: `setCell`/`clearCell`/`compute`/`aggregate`/`normalizeSheet`): click/keyboard nav, inline edit,
  formula bar, **live recalc**, error styling, a status bar, and **autosave + restore** via the M0 `saveData` use-case.
- Reusable `editorChrome` (back/title/saved) extracted; Sheets replaces the placeholder editor.
- Tests: 5 unit + 1 integration + 4 e2e (type `=SUM(...)` → result, `=1/0` → `#DIV/0!`, formula-bar edit, reload-persist).
  Fixed a real first-keystroke double-char bug surfaced by e2e. Slice docs: `docs/features/02-sheets-edit`.

### Added — M1: formula engine (domain)
- **Pure, typed formula engine** under `src/domain/formula/` (refs · tokenizer · parser · evaluator · ~70-function
  registry · `recalc`/`evaluateFormula`), ported from the prototype. Dependency-aware recalculation with memoisation and
  **circular-reference detection** (`#CIRC!`); documented complexity + a 1,000-cell perf-budget test.
- Fixed two latent tokenizer bugs found by tests: `LOG10(` mis-read as a cell ref, and `TRUE()/FALSE()` not callable.
- 37 new unit/integration tests (engine now 90%+ branch coverage). Full slice docs in `docs/features/01-formula-engine`.

### Added
- **Engineering protocol & governance**: `ENGINEERING-PROTOCOL.md`, `BUILD-PLAN.md`, ADR-0001/0002/0003, feature-doc
  templates, and the fully-documented first slice (`docs/features/00-walking-skeleton`).
- **M0 — Walking skeleton**: TypeScript + hexagonal spine — pure domain (`OfficeFile`, use-cases, ports), adapters
  (IndexedDB storage, DOM theme, system clock/id), composition root + hash router, Home launcher + placeholder editor.
- **Quality gates**: Vitest unit + integration (8 tests green), dependency-cruiser boundary check, ESLint flat config,
  Prettier, strict `tsc`, Playwright e2e spec, GitHub Actions CI (`quality` + `e2e`).
- **Repo governance**: README, LICENSE (Apache-2.0), CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CODEOWNERS, PR/issue
  templates, path labeler.
- **Reference prototype** preserved under `prototype/` (working Writer, real spreadsheet formula engine, Slides + present).

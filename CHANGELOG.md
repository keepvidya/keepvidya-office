# Changelog

All notable changes to Keepvidya Office are documented here. Format: [Keep a Changelog](https://keepachangelog.com);
versioning: [SemVer](https://semver.org).

## [Unreleased]

### Added — P1: Sheets parity (range select · cell format · ∑ · paste)
- **Range selection** (drag, shift-click/arrow, header click) with a live status-bar aggregate (Sum / Avg / Count / Min / Max),
  **cell bold/italic** (rendered + persisted + **exported to Excel as bold/italic font**), a **∑ quick-sum** button, and
  **multi-cell TSV paste** — porting the prototype's grid features onto the typed editor.
- New pure sheet helpers (`cellsInRange`, `setCells`, `setCellFormat`, `fmt` on `SheetData`). 96 unit/integration + 20 e2e
  green (M2 flows unchanged). Slice docs: `docs/features/P1-sheets-parity`.

### Added — M7: Real Office export (.xlsx / .docx / .pptx) — "opens in MS Office"
- **Three export adapters** wrapping ExcelJS / docx / pptxgenjs (Wrapper Rule — vendors only under `src/adapters/export`,
  enforced by eslint + dependency-cruiser) exposing an `ExportPort`. An **Export** button in each editor downloads the
  matching Office file.
- Spreadsheet exports **live formulas** (Excel recalculates) + cached results; documents preserve heading/paragraph/bullet
  structure; decks export one slide per slide with positioned text. Verified valid OOXML (ZIP/PK) — xlsx **round-trips**
  its formula, docx/pptx content checked by unzip; also produced valid files **in the browser** (docx `Packer.toBlob` path).
- **Lazy-loaded**: the heavy export libraries are code-split and load only on first export — the **main bundle stays ~17.5 kB
  gzipped** (down from ~514 kB). 91 unit/integration + 16 e2e green. Slice docs: `docs/features/07-office-export`.

### Added — M6: AI Writer ("prompt → document") — completes the trifecta
- **Writer editor** (`src/ui/writer/`): a contentEditable document page with an `execCommand` toolbar (paragraph styles,
  bold/italic/underline, lists, undo/redo), a live word count, an AI prompt bar, and autosave — replaces the placeholder.
- **AI document generation**: prompt → `DocIntent` (the model emits headings/paragraphs/bullets only) → deterministic
  HTML via `doc-applier` (our markup, model text escaped) → a formatted draft. Reuses the generic pipeline.
- Doc domain (`src/domain/doc/`: `DocData`, `normalizeDoc`, `wordCount`). Mock returns a project-proposal fixture for
  writer prompts (system-prompt routing fixed to a unique token). 87 unit/integration/eval + 15 e2e green.
  Slice docs: `docs/features/06-ai-writer`. **All three apps (Writer/Sheets/Slides) now have real editors + AI.**

### Added — M5: Real model providers (Shiva / BYOK)
- **Real `LlmPort` adapters**: `ollama-llm` (Shiva via a local Ollama endpoint, default-private, no key) and
  `openai-compat-llm` (BYOK — any OpenAI-compatible endpoint, Bearer key), plus a **configurable** `LlmPort` (Proxy) that
  resolves the provider from current settings on each call. Mock stays the default (offline + CI deterministic).
- **AI provider settings panel** (gear in the rail): Built-in demo / Local Shiva / BYOK + endpoint + model (+ key). Config
  persisted locally via a `ProviderSettingsPort` (localStorage); keys never leave the device; no provider call unless opted in.
- **Pipeline resilience**: a model/network error is now a clean failed attempt (note, sheet/deck unchanged), never a throw.
- Tests: provider config + settings + both HTTP adapters (fetch mocked: request shape, parse, error) + configurable
  dispatch + resilience + an integration fillSheet over a stubbed Ollama + a settings e2e. 80 unit/integration/eval + 13 e2e
  green. Slice docs: `docs/features/05-real-providers`.

### Added — M4: AI Slides ("prompt → deck") ⭐
- **Slides editor** (`src/ui/slides/`): thumbnail rail + stage, inline text editing, add/delete slide, and a full-screen
  **present mode** (←/→ navigate, Esc exit) — replaces the placeholder.
- **AI deck generation**: a prompt → `SlideIntent` (the model emits titles + bullets only) → **deterministic layout**
  (`deck-applier`, cover + content templates; all geometry/colour from our code) → a presentable `SlideDeck`. Generalised
  the M3 pipeline (`generateIntent<T>`) so Sheets + Slides share one guardrail+self-correction loop (Open/Closed).
- Mock model now returns a deck fixture for slide prompts (routes by system prompt); Shiva/BYOK swaps in behind `LlmPort`.
- Slides domain (`src/domain/slides/`) with immutable deck ops. Tests: 8 unit + 1 integration + 1 eval + 3 e2e
  (generate, present, inline-edit-persist). 70 unit/integration/eval + 12 e2e green. Slice docs: `docs/features/04-ai-slides`.

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

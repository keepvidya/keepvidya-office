# Keepvidya Office (AI) — Build Plan

> The slice roadmap. Each slice is **fully done** (docs + tests + visual review, per the protocol) before the next starts.
> "Join small to make large" — every slice composes onto the prior ones. **WIP = 1.**

## Product in one line
A private, local-first office suite (Writer · Sheets · Slides) where **Shiva (local AI) drafts, our deterministic engines
build the real file.** AI proposes validated *intent*; the engine guarantees correctness. Separate product from Saathi.

## Stack (see ADR-0002)
TypeScript (strict) · Vite · vanilla DOM (no framework) · Vitest · Playwright · ESLint+Prettier · dependency-cruiser.
Web-first; desktop (Electron + electron-updater) at the packaging milestone. The existing vanilla-JS suite in `src/` is
the **reference prototype**; we re-home it into the hexagonal TS structure as we go — not a rewrite-for-its-own-sake.

## Target structure (hexagonal)
```
src/
  domain/        pure TS: entities (Deck, Slide, Workbook, Cell, Document), use-cases (ports)
  app/           wiring, state, routing (composition root)
  ui/            DOM views (launcher, writer, sheets, slides) — drive inbound ports
  adapters/      wrappers ONLY: llm/ (Shiva, BYOK), export/ (exceljs, pptxgenjs, docx), storage/, formula/
  ai/            orchestrator + per-type expert agents + guardrail pipeline + intent schemas
docs/            ENGINEERING-PROTOCOL, BUILD-PLAN, ARCHITECTURE, adr/, features/<NN>/
tests/           unit/ integration/ e2e/ evals/
```

## Slices

| # | Slice | Type | What "done" proves |
|---|---|---|---|
| **M0** | **Walking skeleton** | infra | App boots in TS, routes Home/Writer/Sheets/Slides, theme, `StoragePort` persists, **green CI** (typecheck+lint+boundary+unit+e2e). Spine before features. |
| **M1** | **Formula engine → domain (TS port)** | core | The existing engine, ported behind `EvaluateFormula` with 90% unit coverage + a perf budget test. Deterministic core locked. |
| **M2** | **Sheets edit slice** | feature | Grid drives `SetCell`/`EvaluateFormula`; integration test recalcs; e2e types a formula and sees the result. |
| **M3** | **AI plumbing (narrator spine)** | AI infra | Prompt box → `LlmPort` (mock) → **intent schema validate** → guardrail pipeline → deterministic applier. The §6 spine, model-agnostic. Eval harness wired in CI. |
| **M4** | **AI Slides — "prompt → deck" (Shiva)** ⭐ | AI feature | Expert Slides agent (ReAct) emits validated deck-intent; `BuildDeck` renders it; **Shiva** adapter live + mock for CI; golden-set eval green; present mode works. *(Owner's headline: "Shiva really makes good PPT.")* |
| **M5** | **AI Sheets — "prompt → table/formulas"** | AI feature | Sheets expert emits cell/formula intent; engine computes; eval checks formula validity, never hallucinated numbers. |
| **M6** | **AI Writer — "prompt → document / rewrite"** | AI feature | Docs expert emits paragraph/heading intent; rewrite/expand selected text; narrator boundary enforced. |
| **M7** | **Real Office export** | feature | `FileExportPort` via ExcelJS/docx/pptxgenjs wrappers → valid `.xlsx/.docx/.pptx`; integration tests open the bytes. |
| **M8** | **Univer engine option** | feature | Swap Sheets/Docs onto Univer behind the same ports (per `UPGRADE-to-univer.md`) — fidelity upgrade, no UI change. |
| **M9** | **Desktop packaging** | infra | Electron shell, security baseline, signed installer, `electron-updater` feed. |
| **M10** | **Download page on keepvidya.com** | release | LAST — wired only when functionally complete + stable release exists. |

## Milestone 0 acceptance (the only thing we build after sign-off)
See `docs/features/00-walking-skeleton/`. Nothing else starts until M0 is **Done** per §5.

## Sequencing rule
M0 → M1 → M2 establish the deterministic spine. **M3 → M4 is where "AI-driven" becomes visible** and is the owner's
priority; everything after composes onto it.

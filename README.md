<div align="center">

# Keepvidya Office

**A private, local-first, AI-native office suite — Writer · Sheets · Slides.**
The AI drafts; deterministic engines build the real file. Built to compete with MS Office on ownership and privacy.

[![CI](https://github.com/keepvidya/keepvidya-office/actions/workflows/ci.yml/badge.svg)](https://github.com/keepvidya/keepvidya-office/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Local-first](https://img.shields.io/badge/data-100%25%20local-3F7D5B)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)

</div>

---

## The idea

Microsoft 365 and Google Workspace are excellent — and they put your documents on someone else's servers, behind an
account and a subscription. Keepvidya Office takes the opposite bet: **your files live on your machine.** And the AI is
built on a hard rule — **the model never decides correctness.** It proposes *validated structured intent*; our
deterministic engines turn that into the real spreadsheet, document, or deck. A hallucinated number or malformed slide
**cannot reach the file**: it fails a schema/guard and is corrected or rejected.

> Separate product from Saathi. Shares engineering DNA, ships on its own.

## How it's built (this is the point)

This repo is run by a binding engineering protocol — **Plan → Document → Execute**, one fully-tested vertical slice at a
time. Before any feature is coded, it has BA/DEV/QA docs and a test plan.

- 📐 [`docs/ENGINEERING-PROTOCOL.md`](docs/ENGINEERING-PROTOCOL.md) — SOLID · hexagonal · the **Wrapper Rule** · DSA-first · test pyramid · Definition of Done (incl. visual review) · the **AI standard** (structured intent, guardrails, ReAct experts, trajectory evals).
- 🗺️ [`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md) — the slice roadmap M0 → M10.
- 🧭 [`docs/adr/`](docs/adr/) — architecture decision records.
- 🧪 [`docs/features/`](docs/features/) — per-slice BA/DEV/QA/TEST-PLAN (start with `00-walking-skeleton`).

## Status

| Milestone | State |
|---|---|
| **M0 — Walking skeleton** (TS + hexagonal spine, routing, IndexedDB persistence, theme, green CI) | ✅ built & tested |
| M1–M2 — Formula engine → domain, Sheets edit slice | ⏳ next |
| M3–M4 — AI plumbing → **prompt → deck (Shiva)** | planned |
| M5+ — AI Sheets/Writer · real Office export · Univer engine · desktop · download page | planned |

The fully-featured **vanilla-JS reference prototype** (working Writer, a real spreadsheet formula engine, Slides with a
present mode) lives in [`prototype/`](prototype/) — run it with `npm --prefix prototype run dev` if Vite is installed there.
It is the UX spec the typed build re-homes slice by slice.

## Architecture (hexagonal)
```
src/
  domain/    pure TS — entities (OfficeFile), use-cases, ports. No DOM, no vendor.
  adapters/  the ONLY place vendors/DOM appear — storage (IndexedDB), theme, system
  app/       composition root + router
  ui/        DOM views (home, editor) — drive ports, never touch adapters
  ai/        (M3+) orchestrator · per-type expert agents · guardrails · intent schemas
tests/       unit · integration · e2e · evals
```
The boundaries are **CI-enforced** (`npm run boundary`, dependency-cruiser).

## Run it
```bash
npm install
npm run dev         # http://localhost:5180
npm test            # unit + integration (Vitest)
npm run typecheck && npm run lint && npm run boundary
npm run e2e         # Playwright (npx playwright install chromium first)
```

## Contributing
Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and the protocol. Trunk-based branches, Conventional Commits, small PRs, green
required checks, visual review for UI. Every slice ships documented and tested.

## Licence
Apache-2.0 — see [LICENSE](LICENSE).

<div align="center"><sub>Part of the Keepvidya line · local-first by default</sub></div>

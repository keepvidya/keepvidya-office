# ADR-0002: Stack — web-first, TypeScript, vanilla DOM, hexagonal

- **Status**: Accepted
- **Date**: 2026-06-23

## Context
This app is **separate from Saathi** (which is Electron-first). It grew from a working vanilla-JS browser prototype
(`src/`) created in the founding session. We want quality (types, tests, boundaries) without a heavy framework, and we want
a download page on keepvidya.com eventually — but the product is useful as a pure local-first web app first.

## Decision
- **TypeScript (strict)** + **Vite** + **vanilla DOM** (no React/Vue) — matches the Keepvidya line (Emberfall/Flows) and
  keeps the bundle tiny and dependency-light.
- **Hexagonal (ports & adapters)** with the **Wrapper Rule**: domain is pure TS; every vendor sits behind an adapter.
- **Web-first**; package to **Electron** (with `electron-updater`) at milestone M9, reusing Saathi's security baseline.
- Test stack: **Vitest** (unit/integration/AI-eval) + **Playwright** (e2e/visual).
- The existing vanilla-JS suite is the **reference prototype**; it is re-homed into the TS structure slice by slice, not
  rewritten wholesale.

## Consequences
- Domain + AI logic are testable with zero browser/vendor (fast CI).
- A future Univer or Electron swap touches only adapters/packaging, not the domain (see ADR-0003, `UPGRADE-to-univer.md`).
- We accept a one-time cost to port the prototype JS into typed, hexagonal modules.

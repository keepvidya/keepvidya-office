# Changelog

All notable changes to Keepvidya Office are documented here. Format: [Keep a Changelog](https://keepachangelog.com);
versioning: [SemVer](https://semver.org).

## [Unreleased]

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

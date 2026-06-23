# Contributing to Keepvidya Office

Thanks for helping build a private, local-first office suite. This project runs on a strict but simple process — read
[`docs/ENGINEERING-PROTOCOL.md`](docs/ENGINEERING-PROTOCOL.md) first; it is binding.

## The loop: Plan → Document → Execute
1. **Plan** a thin vertical slice (one capability, end-to-end). WIP limit = **1 slice**.
2. **Document** it under `docs/features/<NN-slice>/` — `BA.md`, `DEV.md`, `QA.md`, `TEST-PLAN.md` — *before* code. Copy `docs/features/_TEMPLATE/`.
3. **Execute** to make the documented tests pass, then open a PR. A slice is only **Done** when it meets §5 (incl. **visual review**).

## Ground rules
- **SOLID + hexagonal.** Domain code is pure; no DOM/vendor imports.
- **Wrapper Rule.** Every external module is reached only through an adapter in `src/adapters/**`. Enforced by `npm run boundary`.
- **DSA first.** State data structure + time/space complexity in `DEV.md` for non-trivial algorithms.
- **Test-first.** Write the Test Plan → Suite → Cases before/with the code. Every case step has an Action + Expected Result.
- **The narrator rule.** AI emits *validated structured intent*; our engines build the file. The model never writes bytes or numbers.

## Local commands
```bash
npm install
npm run dev         # http://localhost:5180
npm run typecheck
npm run lint
npm run boundary    # Wrapper Rule / hexagonal boundaries
npm test            # unit + integration
npm run coverage
npm run e2e         # Playwright (needs: npx playwright install chromium)
```

## Branches & commits
- Branches: `feat/*`, `fix/*`, `docs/*`, `chore/*` off `main` (trunk-based, short-lived).
- Commits & PR titles: **[Conventional Commits](https://www.conventionalcommits.org)** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Small PRs. Required checks (`quality`, `e2e`) must be green before merge.

## Definition of Done
See `ENGINEERING-PROTOCOL §5` and the PR template checklist — including light + dark screenshots for UI changes.

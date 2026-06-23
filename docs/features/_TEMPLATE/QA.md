# QA — <NN-slice-name>

> Quality strategy for this slice. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment (drives test depth)
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| … | L/M/H | L/M/H | … |

## 2. Test approach by level (the pyramid)
- **Unit**: domain logic + each adapter (vendor mocked). Target ≥90% lines/branches on new code.
- **Integration**: port ↔ real adapter.
- **E2E**: which critical user flow(s) only.
- **AI eval** (AI slices): golden-set, mocked deterministic model, score the trajectory + artifact.

## 3. Coverage matrix (every AC is covered)
| Acceptance criterion | Unit | Integration | E2E | Eval |
|---|---|---|---|---|
| AC-1 | TC-… | TC-… | TC-… | — |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved, env ready, test data prepared.
- **Exit (Done)**: all cases pass, coverage gate met, lint/typecheck/boundary green, code review + **visual review** approved, snapshots stored.

## 5. Visual review checklist
- [ ] Layout & alignment match the approved prototype
- [ ] Light theme + dark theme correct (screenshots attached to PR)
- [ ] Brand tokens (colour, type, spacing) correct
- [ ] No console errors; responsive at min width
- [ ] Visual-regression snapshot committed

## 6. Test environment & data
Browser/build, fixtures, seed files, mocked model fixtures (AI slices).

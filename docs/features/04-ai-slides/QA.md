# QA — 04 AI Slides ("prompt → deck")

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Model output drives layout (breaks narrator rule) | M | H | Applier owns geometry; intent has no positions; unit-test layout determinism |
| Malformed deck intent crashes editor | M | H | Validator unit tests; buildDeck never throws |
| Present mode broken / can't exit | L | M | E2E: open present, navigate, Esc exits |
| Deck not persisted | M | H | E2E reload; deck ops immutability unit test |

## 2. Test approach by level (the pyramid)
- **Unit**: `validateDeckIntent`, `applyDeckIntent` (layout determinism), deck ops (`addSlide`/`deleteSlide`/`setSlideText`/`normalizeDeck`). ≥90% on new domain/ai.
- **Integration**: `buildDeck` + mock model → multi-slide deck with title + content.
- **E2E**: Slides editor — generate a deck, see thumbnails + stage, open present mode + navigate + exit, edit text + reload persists.
- **AI eval**: golden prompt → deck rubric + trajectory.

## 3. Coverage matrix
| AC | Unit | Integration | E2E | Eval |
|---|---|---|---|---|
| AC-1 validate/apply | TC-04.1.1–.4 | — | — | — |
| AC-2 buildDeck | — | TC-04.2.1 | TC-04.3.1 | TC-04.4.1 |
| AC-3 present | — | — | TC-04.3.2 | — |
| AC-4 prompt→deck UI | — | — | TC-04.3.1 | — |
| AC-5 edit/persist | TC-04.1.5 | — | TC-04.3.3 | — |
| AC-6 eval | — | — | — | TC-04.4.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M3 on main.
- **Exit (Done)**: all TCs pass; ≥90% on new domain/ai; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (deck + present, light+dark).

## 5. Visual review checklist
- [ ] Generated deck looks like a real presentation (title slide + content slides); brand colours
- [ ] Thumbnail rail + stage aligned; present mode fills the viewport correctly
- [ ] Light + dark screenshots attached; no console errors

## 6. Test environment & data
Node + Vitest (fixture model); Chromium + Playwright (e2e). Golden: a pitch-deck intent (title + a few content slides).

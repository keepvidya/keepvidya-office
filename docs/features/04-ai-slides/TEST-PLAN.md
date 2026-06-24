# TEST PLAN — 04 AI Slides ("prompt → deck")

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-04
- **Items under test**: `src/domain/slides/**`, `src/ai/intent/slide-intent`, `src/ai/applier/deck-applier`, `buildDeck`, `src/ui/slides/**`.
- **In scope**: deck intent validation, deterministic layout, deck ops, orchestration, Slides editor, present mode, persistence.
- **Out**: drag/resize, images/shapes, `.pptx` export, real model.
- **Approach**: unit + integration + e2e + AI eval (fixture model). **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-04.1 — Slides domain & intent (UNIT)
### TC-04.1.1 — valid deck intent parses
| # | Action | Expected result |
|---|---|---|
| 1 | `validateDeckIntent('{"slides":[{"title":"Hi","bullets":["a","b"]}]}')` | `ok:true`; one slide, title `Hi`, bullets `['a','b']` |

### TC-04.1.2 — malformed / wrong shape rejected
| # | Action | Expected result |
|---|---|---|
| 1 | `validateDeckIntent('nope')` | `ok:false` (JSON) |
| 2 | `validateDeckIntent('{"slides":[]}')` | `ok:false` (empty) |
| 3 | `validateDeckIntent('{"slides":[{"title":1,"bullets":[]}]}')` | `ok:false` (title not string) |
| 4 | `validateDeckIntent('{"slides":[{"title":"x","bullets":[2]}]}')` | `ok:false` (bullet not string) |

### TC-04.1.3 — applyDeckIntent lays out deterministically (narrator boundary)
| # | Action | Expected result |
|---|---|---|
| 1 | `applyDeckIntent({slides:[{title:'T',bullets:['x','y']}]})` | deck.slides[0].els has a title element (`html` contains `T`, `bold:true`) and a bullets element (`html` contains `x` and `y`) |
| 2 | every element has numeric `x,y,w,h` set by our code (not from intent) | geometry present + within the 960×540 stage |

### TC-04.1.4 — first slide is a title (cover) layout
| # | Action | Expected result |
|---|---|---|
| 1 | apply a 2-slide intent | slide 0 uses the centred cover layout; slide 1 uses the content layout (title + bullets) |

### TC-04.1.5 — deck ops are immutable
| # | Action | Expected result |
|---|---|---|
| 1 | `addSlide(deck)` | new deck with +1 slide; original unchanged |
| 2 | `deleteSlide(deck,0)` on a 1-slide deck | stays at 1 slide (never empty) |
| 3 | `setSlideText(deck,0,elIndex,'New')` | targeted element html updated immutably |
| 4 | `normalizeDeck(undefined)` | `{slides:[{bg,els:[]}]}` (≥1 slide) |

---

## Suite TS-04.2 — buildDeck orchestrator (INTEGRATION)
### TC-04.2.1 — prompt → multi-slide deck
- **Preconditions**: mock `LlmPort` returns the pitch-deck fixture.
| # | Action | Expected result |
|---|---|---|
| 1 | `buildDeck('a pitch for my app', {llm})` | `ok:true`; `deck.slides.length >= 3` |
| 2 | slide 0 has a title element; a content slide has bullets | structure holds |

---

## Suite TS-04.3 — Slides editor + present (E2E — Playwright)
### TC-04.3.1 — generate a deck from a prompt
| # | Action | Expected result |
|---|---|---|
| 1 | create a presentation | editor shows a thumbnail rail + stage + AI prompt bar |
| 2 | type a prompt, click Generate | ≥2 thumbnails appear; the stage shows the first slide's title text; 0 console errors |

### TC-04.3.2 — present mode
| # | Action | Expected result |
|---|---|---|
| 1 | click Present | a full-screen overlay shows the current slide |
| 2 | press ArrowRight | the next slide shows |
| 3 | press Escape | the overlay closes (back to the editor) |

### TC-04.3.3 — inline edit + persistence
| # | Action | Expected result |
|---|---|---|
| 1 | generate a deck; double-click the title text; change it; click elsewhere | the title updates on the slide |
| 2 | reload; reopen | the edited title is restored |

---

## Suite TS-04.4 — AI eval (golden set, fixture model)
### TC-04.4.1 — deck rubric + trajectory
| # | Action | Expected result |
|---|---|---|
| 1 | `buildDeck(goldenPrompt, {fixtureLlm})` | intent validates (0 retries); deck has ≥3 slides; slide 0 title non-empty; at least one slide has ≥1 bullet |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-04.1.1–.4 |
| AC-2 | TC-04.2.1, TC-04.3.1, TC-04.4.1 |
| AC-3 | TC-04.3.2 |
| AC-4 | TC-04.3.1 |
| AC-5 | TC-04.1.5, TC-04.3.3 |
| AC-6 | TC-04.4.1 |

# TEST PLAN — 06 AI Writer ("prompt → document")

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-06
- **Items under test**: `src/domain/doc/**`, `src/ai/intent/doc-intent`, `src/ai/applier/doc-applier`, `buildDoc`, `src/ui/writer/**`.
- **Approach**: unit + integration + e2e + AI eval (fixture model). **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-06.1 — Doc domain, intent & applier (UNIT)
### TC-06.1.1 — valid doc intent parses
| # | Action | Expected result |
|---|---|---|
| 1 | `validateDocIntent('{"blocks":[{"type":"heading","level":1,"text":"Hi"},{"type":"paragraph","text":"p"},{"type":"bullets","items":["a"]}]}')` | `ok:true`; 3 blocks |

### TC-06.1.2 — malformed / wrong shape rejected
| # | Action | Expected result |
|---|---|---|
| 1 | `validateDocIntent('nope')` / `'5'` / `'{"blocks":[]}'` | `ok:false` |
| 2 | `'{"blocks":[{"type":"heading"}]}'` (heading no text) | `ok:false` |
| 3 | `'{"blocks":[{"type":"bullets","items":"x"}]}'` (items not array) | `ok:false` |
| 4 | `'{"blocks":[{"type":"wat","text":"x"}]}'` (unknown type) | `ok:false` |

### TC-06.1.3 — applyDocIntent builds escaped HTML (narrator boundary)
| # | Action | Expected result |
|---|---|---|
| 1 | apply heading/paragraph/bullets | html contains `<h1>`, `<p>`, `<ul><li>` |
| 2 | a heading text `A <b> B` | rendered as escaped `A &lt;b&gt; B` (no raw markup from the model) |
| 3 | heading level 5 | clamped to `<h3>` (our code decides) |

### TC-06.1.4 — wordCount + normalizeDoc
| # | Action | Expected result |
|---|---|---|
| 1 | `wordCount('  hello   world ')` | `2`; `wordCount('')` | `0` |
| 2 | `normalizeDoc(undefined)` | a default doc (`html` non-empty) |
| 3 | `normalizeDoc({html:'<p>x</p>'})` | keeps the html |

---

## Suite TS-06.2 — buildDoc orchestrator (INTEGRATION)
### TC-06.2.1 — prompt → structured document
- **Preconditions**: mock returns the proposal fixture.
| # | Action | Expected result |
|---|---|---|
| 1 | `buildDoc('a project proposal', empty, {llm})` | `ok:true`; html has `<h1>`, a `<p>`, and a `<ul>` |

---

## Suite TS-06.3 — Writer editor (E2E — Playwright)
### TC-06.3.1 — editable page + word count
| # | Action | Expected result |
|---|---|---|
| 1 | create a document | an editable page + toolbar + AI prompt bar render |
| 2 | type "hello world" | the page shows the text; the status word count updates to include them |

### TC-06.3.2 — prompt → document
| # | Action | Expected result |
|---|---|---|
| 1 | type a prompt, click Generate | the page shows "Project Proposal" (generated heading); 0 console errors |

### TC-06.3.3 — persistence across reload
| # | Action | Expected result |
|---|---|---|
| 1 | generate a document; reload; reopen | the generated content is still shown |

---

## Suite TS-06.4 — AI eval (golden set, fixture model)
### TC-06.4.1 — doc rubric + trajectory
| # | Action | Expected result |
|---|---|---|
| 1 | `buildDoc(goldenPrompt, {fixtureLlm})` | intent validates (0 retries); html has a heading, ≥1 paragraph, ≥1 list item |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-06.1.1–.3 |
| AC-2 | TC-06.2.1, TC-06.3.2, TC-06.4.1 |
| AC-3 | TC-06.1.4 |
| AC-4 | TC-06.3.1, TC-06.3.3 |
| AC-5 | TC-06.3.2 |
| AC-6 | TC-06.4.1 |

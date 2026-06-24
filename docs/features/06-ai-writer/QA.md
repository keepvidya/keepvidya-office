# QA — 06 AI Writer ("prompt → document")

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| Model emits HTML/markup (breaks narrator rule) | M | M | Intent is structure-only; applier owns HTML; validator rejects markup-as-text? (text is escaped) |
| Malformed intent breaks the editor | M | H | Validator unit tests; buildDoc never throws |
| Edits lost on reload | M | H | E2E reload; normalizeDoc + autosave |
| XSS via generated/edited HTML | L | M | applier escapes text; (full sanitisation noted for export slice) |

## 2. Test approach by level (the pyramid)
- **Unit**: `validateDocIntent`, `applyDocIntent` (HTML structure + escaping), `wordCount`, `normalizeDoc`. ≥90% new domain/ai.
- **Integration**: `buildDoc` + mock → HTML with heading + paragraph + list.
- **E2E**: Writer editor — type into the page (word count updates), AI generate (content appears), reload persists.
- **AI eval**: golden prompt → doc rubric + trajectory.

## 3. Coverage matrix
| AC | Unit | Integration | E2E | Eval |
|---|---|---|---|---|
| AC-1 validate/apply | TC-06.1.1–.3 | — | — | — |
| AC-2 buildDoc | — | TC-06.2.1 | TC-06.3.2 | TC-06.4.1 |
| AC-3 wordCount/normalize | TC-06.1.4 | — | — | — |
| AC-4 editor/persist | — | — | TC-06.3.1, TC-06.3.3 | — |
| AC-5 prompt→doc | — | — | TC-06.3.2 | — |
| AC-6 eval | — | — | — | TC-06.4.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M5 on main.
- **Exit (Done)**: all TCs pass; ≥90% new domain/ai; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (page + toolbar + generated doc, light+dark).

## 5. Visual review checklist
- [ ] Document page looks like a real editor (serif body, headings); toolbar + prompt bar; brand colours
- [ ] Generated draft is well-formatted (title, headings, bullets)
- [ ] Light + dark screenshots; no console errors

## 6. Test environment & data
Node + Vitest (fixture model); Chromium + Playwright. Golden: a project-proposal intent (title + goals bullets + timeline).

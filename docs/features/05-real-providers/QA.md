# QA — 05 Real model providers (Shiva / BYOK)

> Quality strategy. QA owns the Definition of Done sign-off (incl. visual review).

## 1. Risk assessment
| Risk | Likelihood | Impact | Test focus |
|---|---|---|---|
| BYOK key leaks / call without consent | L | H | No provider call unless non-mock selected; key in localStorage only; default mock |
| Network error crashes the app | M | H | Pipeline try/catch → failed attempt; adapter `res.ok` checks |
| Wrong wire format → provider rejects | M | M | Adapter unit tests assert request body/headers + response parsing (fetch mocked) |
| Settings not persisted | L | M | Settings port round-trip unit test |

## 2. Test approach by level (the pyramid)
- **Unit**: provider config validate/default; settings port; **Ollama + BYOK adapters with `fetch` mocked** (request shape + response parse + HTTP-error path); configurable dispatch; pipeline-on-model-error. ≥90% on new domain/adapters.
- **Integration**: configurable `LlmPort` + a stubbed fetch → fillSheet produces cells (provider path end-to-end, no real server).
- **E2E**: Settings panel opens from the rail, shows fields, saves; the app keeps working on the default mock (no live model in CI).

## 3. Coverage matrix
| AC | Unit | Integration | E2E |
|---|---|---|---|
| AC-1 config/settings | TC-05.1.1–.3 | — | — |
| AC-2 adapters | TC-05.1.4–.5 | TC-05.2.1 | — |
| AC-3 dispatch | TC-05.1.6 | TC-05.2.1 | — |
| AC-4 resilience | TC-05.1.7 | — | — |
| AC-5 settings UI | — | — | TC-05.3.1 |

## 4. Entry / exit criteria
- **Entry**: BA+DEV approved; M4 on main.
- **Exit (Done)**: all TCs pass; ≥90% on new code; typecheck+lint+boundary green; CI `quality`+`e2e` green; **visual review** (settings panel, light+dark).

## 5. Visual review checklist
- [ ] Settings panel matches brand; provider fields + save/cancel; opens from the rail
- [ ] Light + dark screenshots attached; no console errors
- [ ] Default mock still generates (Sheets fill + Slides deck)

## 6. Test environment & data
Node + Vitest with `fetch` stubbed (vi.stubGlobal); Chromium + Playwright (default mock). Fixtures: an Ollama `message.content` JSON, an OpenAI `choices[0].message.content` JSON.

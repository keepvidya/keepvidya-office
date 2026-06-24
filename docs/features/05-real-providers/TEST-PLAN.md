# TEST PLAN — 05 Real model providers (Shiva / BYOK)

> IEEE-829-aligned. Written FIRST. Plan → Suites → Cases. Every step has an Action + Expected Result.

## 1. Test plan header
- **Plan id**: TP-05
- **Items under test**: `src/domain/ai-provider`, `adapters/settings/local-provider-settings`, `adapters/llm/{ollama-llm,openai-compat-llm,configurable-llm}`, pipeline resilience, Settings UI.
- **Approach**: unit (fetch mocked) + integration (stubbed fetch) + e2e (default mock). **Environment**: Node + Vitest; Chromium + Playwright.

---

## Suite TS-05.1 — Config, settings & adapters (UNIT)
### TC-05.1.1 — default + validate
| # | Action | Expected result |
|---|---|---|
| 1 | `defaultProviderConfig()` | `{provider:'mock', …}` |
| 2 | `validateProviderConfig({provider:'ollama', baseUrl:''})` | `ok:false` (URL required) |
| 3 | `validateProviderConfig({provider:'byok', baseUrl:'x', apiKey:''})` | `ok:false` (key required) |
| 4 | `validateProviderConfig({provider:'mock'})` | `ok:true` |

### TC-05.1.2 — settings port round-trips
| # | Action | Expected result |
|---|---|---|
| 1 | `set(cfg)` then `get()` (fresh instance) | returns the saved cfg |
| 2 | `get()` with empty store | returns the default (mock) |

### TC-05.1.4 — Ollama adapter (fetch mocked)
| # | Action | Expected result |
|---|---|---|
| 1 | `complete({system,prompt})` | POSTs to `<base>/api/chat`, body has `model`, `messages` (system+user), `stream:false` |
| 2 | mock returns `{message:{content:'HELLO'}}` | `.text === 'HELLO'` |
| 3 | mock returns HTTP 500 | throws/returns a typed error (no silent empty) |

### TC-05.1.5 — BYOK adapter (fetch mocked)
| # | Action | Expected result |
|---|---|---|
| 1 | `complete(...)` | POSTs to `<base>/chat/completions` with `Authorization: Bearer <key>` |
| 2 | mock returns `{choices:[{message:{content:'HI'}}]}` | `.text === 'HI'` |

### TC-05.1.6 — configurable dispatch
| # | Action | Expected result |
|---|---|---|
| 1 | settings = mock | `complete` returns a fixture (no fetch) |
| 2 | settings = ollama (fetch mocked) | `complete` hits the Ollama path |

### TC-05.1.7 — pipeline resilience to model error
| # | Action | Expected result |
|---|---|---|
| 1 | `generateIntent` with an LlmPort whose `complete` throws | `ok:false`, trace records failed attempts, **no throw** |

---

## Suite TS-05.2 — Provider path end-to-end (INTEGRATION)
### TC-05.2.1 — fillSheet via the configurable port over a stubbed Ollama
| # | Action | Expected result |
|---|---|---|
| 1 | settings = ollama; `fetch` stubbed to return a valid budget-intent in `message.content`; `fillSheet(prompt)` | `ok:true`; `compute` Net = 2400 |

---

## Suite TS-05.3 — Settings panel (E2E — Playwright)
### TC-05.3.1 — open, save, keep working on mock
| # | Action | Expected result |
|---|---|---|
| 1 | click the Settings rail button | a settings panel appears with provider fields |
| 2 | choose Local Shiva, set a URL/model, Save | panel closes; choice persisted |
| 3 | (reset to Built-in demo, Save) create a sheet, AI-generate | the mock still fills the budget (2400); 0 console errors |

---

## Traceability
| AC (BA) | Covered by |
|---|---|
| AC-1 | TC-05.1.1–.2 |
| AC-2 | TC-05.1.4–.5, TC-05.2.1 |
| AC-3 | TC-05.1.6, TC-05.2.1 |
| AC-4 | TC-05.1.7 |
| AC-5 | TC-05.3.1 |

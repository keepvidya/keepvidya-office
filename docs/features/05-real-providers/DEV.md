# DEV — 05 Real model providers (Shiva / BYOK)

> Technical design. Written before code. Satisfies ENGINEERING-PROTOCOL §1 + §6 + §9.

## 1. Approach (think-first)
Add two real `LlmPort` adapters (Ollama, OpenAI-compatible) plus a **configurable** `LlmPort` that reads the current
provider config (from a `ProviderSettingsPort`) and dispatches per call — so changing settings takes effect immediately
without a restart. The config + validation are pure domain. The mock stays default (offline + CI). Make the pipeline
**resilient**: a thrown/HTTP model error becomes a failed attempt, not an exception.

## 2. Ports touched
- Outbound: `LlmPort` (two new adapters + a configurable wrapper); `ProviderSettingsPort` (new; local adapter).
- Inbound: a Settings panel drives `ProviderSettingsPort.set`.

## 3. Domain model
- `AiProvider = 'mock' | 'ollama' | 'byok'`; `AiProviderConfig = { provider; baseUrl; model; apiKey }`.
- `defaultProviderConfig()` → mock. `validateProviderConfig(cfg)` → `Result` (URL required for ollama/byok; key required for byok).

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Budget |
|---|---|---|---|---|
| dispatch | switch on provider | O(1) | O(1) | per call |
| HTTP call | `fetch` | network-bound | O(resp) | adapter owns timeouts/errors |

## 5. Design patterns used
- **Strategy / Factory** — provider config → concrete adapter. **Adapter** — Ollama/OpenAI wire formats → our `LlmPort`.
- **Proxy** — the configurable `LlmPort` resolves the real adapter lazily from settings.
- **Null Object** — the mock is the safe default provider.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by | Port | Leaks? |
|---|---|---|---|
| Ollama HTTP API (`fetch`) | `adapters/llm/ollama-llm` | `LlmPort` | no |
| OpenAI-compatible HTTP API (`fetch`) | `adapters/llm/openai-compat-llm` | `LlmPort` | no |
| `localStorage` | `adapters/settings/local-provider-settings` | `ProviderSettingsPort` | no |
`fetch` is a platform global (not npm). The `src/ai` core stays provider-agnostic (only `LlmPort`).

## 7. Resilience & security (§9)
- Pipeline wraps `llm.complete` in try/catch → a model/network error is a failed attempt (`ok:false` + note), never a throw.
- HTTP adapters check `res.ok` and surface a typed error string; basic timeout via `AbortController`.
- BYOK key stored in `localStorage` (device-only); **no provider call happens unless the user selects a non-mock provider**.
  Default mock = nothing leaves the device.

## 8. Flow / sequence
Settings panel → `ProviderSettingsPort.set(cfg)`. AI generate → configurable `LlmPort.complete` → reads cfg → builds the
provider adapter → `fetch` → parses → returns text → existing validator + guardrails (unchanged).

## 9. Error handling
`Result`/typed errors throughout. Adapter errors become pipeline failed-attempts. Settings validation blocks saving an
invalid config (UI shows why).

## 10. ADRs
No new ADR — fulfils ADR-0003's "Shiva/BYOK behind `LlmPort`" and the §9 privacy stance.

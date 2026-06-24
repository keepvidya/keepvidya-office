# BA — 05 Real model providers (Shiva / BYOK)

> Business Analysis. Written FIRST. No design/code here.

## 1. Problem & context
M3/M4 proved the AI spine with a **deterministic mock** that ignores the prompt. To make the AI genuinely useful — and to
honour "our Shiva model really makes good PPT" — we need real providers behind `LlmPort`: **Shiva via a local Ollama-style
endpoint** (default-private, no key) and **BYOK** (any OpenAI-compatible endpoint). Selection lives in **local settings**;
nothing leaves the device unless the user opts into a cloud provider. The mock stays the default so the app works offline
and CI stays deterministic.

## 2. Users & jobs-to-be-done
- Primary user. Job: "When I point the app at my local Shiva (or paste a BYOK key), the AI should use it — and stay on the
  mock/offline otherwise, with my key never leaving my machine."

## 3. User stories
- **US-1**: As a user, I want a settings panel to choose the AI provider (Built-in demo / Local Shiva / BYOK) + endpoint + model (+ key).
- **US-2**: As a user, I want my choice saved locally and used for the next generation.
- **US-3**: As a user, I want a real provider to actually drive the Sheets/Slides generation from my prompt.
- **US-4**: As a user, I want a provider/network failure to degrade gracefully (a note, no crash, sheet/deck unchanged).

## 4. Acceptance criteria (testable)
- **AC-1** (US-1/US-2): `defaultProviderConfig()` is the mock; `validateProviderConfig` rejects an Ollama/BYOK config with no base URL (or BYOK with no key); the settings port persists + restores a config. *(→ TC-05.1.x)*
- **AC-2** (US-3): the Ollama adapter POSTs `{model,messages,stream:false}` to `<base>/api/chat` and returns `message.content`; the BYOK adapter POSTs to `<base>/chat/completions` with a Bearer key and returns `choices[0].message.content`. *(→ TC-05.1.4/5)*
- **AC-3** (US-3): the configurable `LlmPort` dispatches to the provider from current settings (mock when unset). *(→ TC-05.1.6)*
- **AC-4** (US-4): a thrown/HTTP-error model failure becomes a **clean failed attempt** in the pipeline (`ok:false`, note, no throw). *(→ TC-05.1.7, TC-05.2.1)*
- **AC-5** (US-1): the settings panel opens from the rail, shows fields, saves a config, and the app keeps working (mock by default). *(→ TC-05.3.1)*

## 5. Scope
- **In**: provider config domain + validation, `ProviderSettingsPort` (+ local adapter), Ollama adapter, OpenAI-compatible BYOK adapter, a configurable `LlmPort` reading settings, pipeline resilience to model errors, a Settings panel UI.
- **Out**: streaming responses, model auto-discovery lists, multiple concurrent providers, per-feature model routing, prompt-tuning.

## 6. Success metrics / done-signal
With a local Shiva endpoint set, a prompt drives real generation; with nothing set, the mock still works; failures show a note; 0 console errors.

## 7. AI acceptance
- Real providers return free text; it still passes through the **same validator + guardrails** (§6) before any cell/slide changes. The provider only supplies candidate text — correctness is still ours.

## 8. Open questions / decisions for owner
- Default endpoints: Ollama `http://localhost:11434`, model `shiva` (editable). BYOK base URL user-supplied. ✔ assumed OK.

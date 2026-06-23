# Keepvidya Office (AI) — Engineering Protocol (the Constitution)

> Governs **how** we build the AI-driven Keepvidya Office. It is binding. No code is written that violates it.
> Owner-mandated 2026-06-23. The vanilla-JS suite already in this repo (`src/`, `index.html`) is the **approved
> reference prototype** — it proves the UX. This protocol governs the *real* build: TypeScript, hexagonal, tested,
> AI-native, slice by slice.
> Sibling document: `keepvidya-saathi/docs/ENGINEERING-PROTOCOL.md`. **This app is separate from Saathi** and ships on
> its own; the two share engineering DNA but not code or release cadence.
> Status: **DRAFT — awaiting owner sign-off.** After sign-off, changes go through an ADR ([docs/adr](./adr)).

## 0. The prime directive — Plan → Document → Execute

For **every** unit of work (a "slice"):

1. **PLAN** — agree scope + approach (a one-page brief, reviewed).
2. **DOCUMENT** — author **BA**, **DEV**, **QA** docs and the **Test Plan → Test Suite → Test Cases** *before* implementation.
3. **EXECUTE** — implement to make the documented tests pass, then review (code **and** visual UI).

> If it isn't documented, it isn't started. If it has no tests, it isn't done. **WIP limit = 1 slice in flight.**

---

## 1. Architecture rules

### 1.1 SOLID — non-negotiable
Single Responsibility · Open/Closed · Liskov · Interface Segregation · **Dependency Inversion**. Domain logic depends on
**abstractions (ports)**, never on concrete libraries or the DOM. (DIP is the backbone of the hexagonal style below — see [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/welcome.html).)

### 1.2 Hexagonal — Ports & Adapters (Anti-Corruption Layer)
- The **domain/core** is framework-agnostic, pure TypeScript: no third-party runtime lib, no DOM, no network.
- **Inbound ports** = how UI/agents drive the core (`BuildDeck`, `EvaluateFormula`, `GenerateOutline`).
- **Outbound ports** = how the core reaches the world (`LlmPort`, `FileExportPort`, `StoragePort`, `ClockPort`, `SearchPort`).
- **Adapters** implement ports and translate to/from the outside world — the *only* place a vendor type appears.

### 1.3 The Wrapper Rule (owner rule #2 — "every external module import has a wrapper")
**No external module is imported directly into feature/domain code.** Every dependency (Univer, ExcelJS, docx, pptxgenjs,
PDF.js, an LLM client, a fetch/HTTP client, KaTeX, Mermaid, IndexedDB) is reached **only** through a hand-written wrapper
under `src/adapters/<vendor>/` that:
- exposes **our** interface (a port), not the vendor's;
- owns all vendor types (they never leak past the wrapper);
- is independently unit-testable with the vendor mocked;
- is the single swap-point if we change vendors.

Enforced by an **import-boundary lint rule** (dependency-cruiser + `eslint no-restricted-imports`) in CI.

### 1.4 DSA & complexity (owner rule #1 — "DSA optimization approach first")
Before coding a non-trivial algorithm, state in `DEV.md` the **chosen data structure, time & space complexity, and why**.
Hot paths (formula recalculation, AI-intent diff/apply, large-grid render) get a **complexity budget** and a perf test.

### 1.5 Design patterns
Use named patterns deliberately — Adapter, Strategy, Factory, Command, Observer, Repository, Facade, State, **Chain of
Responsibility** (guardrail pipeline). Each `DEV.md` names the patterns used and why. No pattern for its own sake.

### 1.6 The narrator principle — made concrete (product DNA)
**Deterministic logic lives in our code; the LLM (Shiva) only narrates/phrases.** This is an *architecture constraint*:
- The model **never produces the file bytes, the formula result, or the layout.** It produces **validated structured
  intent** (see §6) that our deterministic appliers turn into the artifact.
- The engine — not the model — guarantees the `.xlsx/.pptx/.docx` is correct and opens in MS Office.

---

## 2. Vertical-slice discipline (owner rule #5 — "one functionality full … then join small make large")
- Work ships as **vertical slices**: a thin end-to-end path UI → port → domain → adapter, **fully done** (docs + tests +
  visual review) before the next slice starts.
- **Milestone 0 = Walking Skeleton**: a real-but-minimal app that boots, routes, themes, persists, and has a green CI.
- Each slice composes with prior ones — **no big-bang integration at the end.**

---

## 3. Documentation standard (owner rule — "doc should have QA, BA, DEV doc")
Every slice has `docs/features/<NN-slice>/` with:

| Doc | Role | Answers |
|---|---|---|
| `BA.md` | Business Analyst | *Why/what*: problem, users, user stories, acceptance criteria, scope, success metrics. |
| `DEV.md` | Developer | *How*: design, ports/adapters, data structures + complexity, patterns, flow, risks, ADR links. |
| `QA.md` | QA | *How we trust it*: risk-based strategy, coverage matrix, entry/exit, visual-review checklist. |
| `TEST-PLAN.md` | QA | Plan → suites → cases (§4). |

Plus repo-wide: `ARCHITECTURE.md`, `BUILD-PLAN.md`, **ADRs** in `docs/adr/NNNN-title.md`, a living `README.md`, `CHANGELOG.md`.

---

## 4. Testing standard (owner rules — "unit, integration, e2e", "steps + expected behaviour at every step", "plan→suite→cases first")

### 4.1 Author order (test-first)
**Test Plan → Test Suite → Test Cases are written before/with implementation**, derived from `BA.md` acceptance criteria.
Implementation makes them pass. **TDD** at unit level; **BDD / Given-When-Then** for acceptance ([test-pyramid guidance](https://testomat.io/blog/testing-pyramid-role-in-modern-software-testing-strategies/)).

### 4.2 The pyramid (many unit · fewer integration · few e2e)
- **Unit** (Vitest): pure domain + each adapter with the vendor mocked. The bulk.
- **Integration** (Vitest): port + real adapter (e.g. domain → ExcelJS adapter actually writes a valid `.xlsx`).
- **E2E** (Playwright): real app, critical user flows only.
- **AI evals** (§6.4): a golden-set harness scoring AI slices — a distinct, required level for AI features.
- Every case states **the Expected Result at each step** — no "click and hope".

### 4.3 Gates
- New/changed domain & adapter code: **unit coverage ≥ 90%** lines/branches.
- Every slice ships ≥1 integration test and (for user flows) ≥1 e2e test; AI slices add an eval suite.
- CI is **red-blocking**: no merge on failing tests, lint, typecheck, boundary check, or coverage.

---

## 5. Definition of Done (owner rule #6 — "final review … check UI, visual too")
A slice is **Done** only when ALL hold:
1. `BA/DEV/QA/TEST-PLAN` complete and reviewed.
2. Code adheres to §1 (SOLID, hexagonal, Wrapper Rule, complexity documented).
3. Unit + integration + e2e (+ AI eval for AI slices) present, **green**, coverage gate met.
4. `typecheck` + `lint` + import-boundary green.
5. **Code review** approved (PR).
6. **Visual/UI review** approved — light + dark screenshots attached to the PR; layout, theme, brand match the prototype; visual-regression snapshot stored.
7. Docs/README/CHANGELOG updated; ADRs filed.
8. Merged to `main` via PR with green required checks.

---

## 6. AI feature standard (owner rule #7 — expert agents + the AI build) — **new, researched**

The AI is built as a **multi-agent ReAct system**, one **expert per file type** (Slides, Sheets, Docs, PDF), coordinated
by an **Orchestrator**. Agents *reason → act (call our deterministic tools) → observe*, exchange feedback, and self-correct.
They produce **content/structure only**; our engines produce the file (§1.6).

### 6.1 Structured-intent contract (guardrail #1)
Every AI output is **machine-checkable structured data** validated against a schema (Zod/JSON-Schema) **before** anything is
applied. Free-form prose is allowed *only* inside fields the engine treats as text (a slide bullet, a paragraph). Invalid
intent is rejected, never applied. (Best practice: [structured outputs + format guardrails](https://orq.ai/blog/llm-guardrails).)

### 6.2 Guardrail pipeline (Chain of Responsibility)
`input guard → LLM → output guard (schema + policy) → deterministic applier`. A failed output-guard feeds a
**self-correction loop** (re-prompt with the validator error) rather than a hard block — bounded by a max-retry budget.
([Guardrails + self-correction](https://www.arthur.ai/blog/best-practices-for-building-agents-guardrails).)

### 6.3 ReAct expert agents
Each expert is a discrete unit with a **strict tool contract** (only our deterministic tools: `addSlide`, `setCell`,
`insertParagraph`, …) and **deterministic state transitions**. Interleaving thought/action keeps plans grounded and
reduces hallucination ([ReAct / agentic playbook 2026](https://promptengineering.org/agents-at-work-the-2026-playbook-for-building-reliable-agentic-workflows/)).

### 6.4 Evaluation — score trajectories, not just final answers
AI slices ship a **golden-set eval harness** run in CI with **deterministic model mocks** (no live model in CI). We score
the **full trajectory**: tool-choice correctness, argument validity, schema compliance, step count, and artifact validity
(does the produced deck/sheet open and match the rubric). Judge-based scoring only with a written rubric + auditing.
([Evaluate full trajectories](https://mlflow.org/articles/building-production-ready-ai-agents-in-2026/), [agent observability](https://blog.jetbrains.com/pycharm/2026/05/llm-evaluation-and-ai-observability-for-agent-monitoring/).)

### 6.5 Model routing & provenance
- **Shiva (local, default)** is the runtime author — good at PPT; **BYOK cloud** is opt-in. **Claude is a DEV-time tool to
  author new templates**, not a runtime dependency.
- Every AI action is logged (prompt, model+version, intent, guard verdicts, retries) for reproducibility. Nothing leaves the
  device unless the user enables a cloud provider (Confidential mode honored).

---

## 7. Git & GitHub governance (owner rule #8 — public repo, rulesets, labeler, docs, README, tags)
- **Repo**: public, professional README (badges, screenshots, architecture, quickstart), `LICENSE` (Apache-2.0),
  `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, topics/tags, social preview.
- **Branching**: trunk-based — short-lived `feat/*`, `fix/*`, `docs/*`, `chore/*` off `main`; small PRs.
- **Commits**: **Conventional Commits**, enforced by ruleset + commitlint.
- **Versioning**: **SemVer**; release notes auto-generated; git **tags** per release.
- **Branch ruleset on `main`**: require PR, ≥1 review, required status checks (build, typecheck, lint, boundary, unit,
  integration, e2e, coverage, ai-eval), linear history, no force-push, no deletion.
- **CODEOWNERS** + PR/issue templates + a **labeler** action (auto-label by path/type) + a triage label set.

## 8. CI/CD (owner rule #9 — implemented; download page LAST)
- **CI** (GitHub Actions) from M0: install → typecheck → lint → import-boundary → unit → integration → e2e (headless) →
  ai-eval → coverage → build. Unique job names for status checks.
- **CD**: tag → build the web bundle (and, at the packaging milestone, signed desktop installers via electron-builder +
  `electron-updater`) → GitHub Release.
- **Download page on keepvidya.com**: wired **last**, only once the app is functionally complete and a stable release
  exists (mirrors the Flows/Knovex pattern).

## 9. Security & privacy baseline (web-first; desktop at packaging)
- Strict **CSP**; no remote code execution; external links open in a new tab/OS browser.
- **Local-first**: documents + BYOK keys live on-device (IndexedDB; OS keychain once packaged). No telemetry.
- AI calls to cloud providers happen **only** with explicit user opt-in; prompts/inputs never sent otherwise.
- When packaged to Electron: `contextIsolation:true`, `sandbox:true`, `nodeIntegration:false`, typed `contextBridge` IPC,
  IPC args validated in preload **and** main.

## 10. Quality gates — summary
| Gate | Tool | Blocks merge? |
|---|---|---|
| Types | `tsc` strict | ✅ |
| Lint + format | ESLint + Prettier | ✅ |
| Import boundaries (Wrapper Rule) | dependency-cruiser / eslint | ✅ |
| Unit (≥90%) | Vitest + coverage | ✅ |
| Integration | Vitest | ✅ |
| E2E (critical paths) | Playwright | ✅ |
| AI eval (golden set, mocked model) | Vitest harness | ✅ (AI slices) |
| Visual review + snapshot | screenshots + Playwright snapshot | ✅ (human + snapshot) |
| Conventional Commits | commitlint ruleset | ✅ |

## 11. Roles
- **BA** — frames problem, writes user stories + acceptance criteria.
- **DEV** — designs + implements within §1, writes `DEV.md`, code, tests.
- **QA** — owns `QA.md` + `TEST-PLAN.md`, signs off the DoD incl. visual review.
- **Expert agents** (runtime) — per file type, ReAct, peer feedback, self-correction (§6).

*(In this collaboration, Claude rotates through BA/DEV/QA per slice and produces the artifacts; the owner approves each gate.)*

## 12. Sources informing this protocol
- Hexagonal / Ports & Adapters — [AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/hexagonal-architectures/welcome.html), [tsh.io](https://tsh.io/blog/hexagonal-architecture), [domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon)
- Test pyramid / TDD / BDD — [testomat.io](https://testomat.io/blog/testing-pyramid-role-in-modern-software-testing-strategies/)
- LLM guardrails & structured output — [orq.ai](https://orq.ai/blog/llm-guardrails), [Arthur](https://www.arthur.ai/blog/best-practices-for-building-agents-guardrails)
- Agent reliability, ReAct, trajectory evals — [Agents 2026 Playbook](https://promptengineering.org/agents-at-work-the-2026-playbook-for-building-reliable-agentic-workflows/), [MLflow](https://mlflow.org/articles/building-production-ready-ai-agents-in-2026/), [JetBrains](https://blog.jetbrains.com/pycharm/2026/05/llm-evaluation-and-ai-observability-for-agent-monitoring/)
- GitHub governance — [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets), [Conventional Commits](https://www.conventionalcommits.org)

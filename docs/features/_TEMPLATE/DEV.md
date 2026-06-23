# DEV — <NN-slice-name>

> Technical design. Written before code. Must satisfy ENGINEERING-PROTOCOL §1 (SOLID, hexagonal, Wrapper Rule, DSA).

## 1. Approach (think-first)
2–5 sentences: how we'll build it and why this way.

## 2. Ports touched
- Inbound: `…Port` (driven by which UI/agent)
- Outbound: `…Port` (implemented by which adapter)

## 3. Domain model
Entities / value objects / use-cases added or changed. Keep it pure (no vendor/DOM).

## 4. Data structures & complexity (DSA)
| Operation | Structure | Time | Space | Why / budget |
|---|---|---|---|---|
| … | … | O(…) | O(…) | … |

## 5. Design patterns used
Adapter / Strategy / Factory / Command / Observer / State / Facade / Repository / Chain of Responsibility — name each + reason.

## 6. External modules (Wrapper Rule)
| Vendor | Wrapped by (adapter) | Port it implements | Vendor types leak? (must be "no") |
|---|---|---|---|
| … | `adapters/…` | `…Port` | no |

## 7. (AI slices only) Intent schema & guardrails
- Intent type (Zod schema location): …
- Guard pipeline steps + max self-correction retries: …
- Tools the expert agent may call (strict contract): …

## 8. Flow / sequence
UI → inbound port → use-case → domain → outbound port → adapter → world.

## 9. Error handling
`Result<T,E>` usage, validation points, failure surfacing (never silent).

## 10. Risks & mitigations
- …

## 11. ADRs
Links to decision records this slice introduces.

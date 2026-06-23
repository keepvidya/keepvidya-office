import { describe, expect, it } from 'vitest';
import { generateSheetIntent } from '../../src/ai/pipeline';
import { BUDGET_FIXTURE, createFixtureLlm, createScriptedLlm } from '../../src/adapters/llm/mock-llm';

describe('TS-03.1 — guardrail pipeline & self-correction', () => {
  it('TC-03.1.5 — invalid-then-valid succeeds with one retry', async () => {
    const llm = createScriptedLlm(['oops not json', '{"writes":[{"ref":"A1","value":"ok"}]}']);
    const r = await generateSheetIntent('x', { llm });
    expect(r.ok).toBe(true);
    expect(r.trace).toHaveLength(2);
    expect(r.trace[0].ok).toBe(false);
    expect(r.trace[1].ok).toBe(true);
  });

  it('TC-03.1.6 — bounded retries fail cleanly (no hang)', async () => {
    const llm = createScriptedLlm(['still bad']);
    const r = await generateSheetIntent('x', { llm, maxRetries: 2 });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
    expect(r.trace).toHaveLength(3); // attempts 0, 1, 2
  });

  it('first-try success has zero retries', async () => {
    const r = await generateSheetIntent('x', { llm: createFixtureLlm(BUDGET_FIXTURE) });
    expect(r.ok).toBe(true);
    expect(r.trace).toHaveLength(1);
    expect(r.trace[0].ok).toBe(true);
  });
});

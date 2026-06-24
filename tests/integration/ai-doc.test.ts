import { describe, expect, it } from 'vitest';
import { buildDoc } from '../../src/ai/doc-orchestrator';
import { normalizeDoc } from '../../src/domain/doc/doc';
import { createFixtureLlm, createScriptedLlm } from '../../src/adapters/llm/mock-llm';

describe('TS-06.2 — buildDoc orchestrator (integration)', () => {
  it('TC-06.2.1 — prompt → structured document', async () => {
    const r = await buildDoc('a project proposal', normalizeDoc(undefined), { llm: createFixtureLlm() });
    expect(r.ok).toBe(true);
    expect(r.data.html).toContain('<h1>');
    expect(r.data.html).toContain('<p>');
    expect(r.data.html).toContain('<ul>');
  });

  it('leaves the document unchanged + notes on failure', async () => {
    const current = normalizeDoc({ html: '<p>original</p>' });
    const r = await buildDoc('x', current, { llm: createScriptedLlm(['garbage']), maxRetries: 1 });
    expect(r.ok).toBe(false);
    expect(r.data).toBe(current);
    expect(r.note).toBeTruthy();
  });
});

// AI eval (§6.4): score the document pipeline's trajectory + result with a fixture model.
import { describe, expect, it } from 'vitest';
import { buildDoc } from '../../src/ai/doc-orchestrator';
import { normalizeDoc } from '../../src/domain/doc/doc';
import { createFixtureLlm } from '../../src/adapters/llm/mock-llm';

describe('TS-06.4 — doc eval (golden set, fixture model)', () => {
  it('TC-06.4.1 — doc rubric + trajectory', async () => {
    const r = await buildDoc('a one-page project proposal', normalizeDoc(undefined), { llm: createFixtureLlm() });

    expect(r.ok).toBe(true);
    expect(r.trace.filter((s) => !s.ok)).toHaveLength(0); // no retries

    // rubric: a heading, at least one paragraph, at least one bullet
    expect(r.data.html).toMatch(/<h[1-3]>/);
    expect(r.data.html).toContain('<p>');
    expect(r.data.html).toContain('<li>');
  });
});

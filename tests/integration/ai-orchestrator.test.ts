import { describe, expect, it } from 'vitest';
import { fillSheet } from '../../src/ai/orchestrator';
import { type SheetData, compute } from '../../src/domain/sheet/sheet';
import { createFixtureLlm, createScriptedLlm } from '../../src/adapters/llm/mock-llm';

const empty: SheetData = { cells: {}, cols: 26, rows: 100 };

describe('TS-03.2 — fillSheet orchestrator (integration)', () => {
  it('TC-03.2.1 — fills a budget that computes via the engine', async () => {
    const r = await fillSheet('a freelancer monthly budget', empty, { llm: createFixtureLlm() });
    expect(r.ok).toBe(true);
    expect(r.data.cells['A1']).toBe('Category'); // label applied
    expect(compute(r.data)['B5'].display).toBe('2400'); // Net computed by OUR engine
  });

  it('leaves the sheet unchanged + notes on failure', async () => {
    const r = await fillSheet('x', empty, { llm: createScriptedLlm(['garbage']), maxRetries: 1 });
    expect(r.ok).toBe(false);
    expect(r.data).toBe(empty); // unchanged on failure
    expect(r.note).toBeTruthy();
  });
});

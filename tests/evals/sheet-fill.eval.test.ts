// AI eval (ENGINEERING-PROTOCOL §6.4): score the pipeline's trajectory AND the
// applied result against a rubric, with a deterministic fixture model (no live LLM).
import { describe, expect, it } from 'vitest';
import { fillSheet } from '../../src/ai/orchestrator';
import { type SheetData, compute } from '../../src/domain/sheet/sheet';
import { createFixtureLlm } from '../../src/adapters/llm/mock-llm';

interface GoldenCase {
  prompt: string;
  expectLabels: string[];
  netRef: string;
  netValue: string;
  maxRetries: number;
}

const GOLDEN: GoldenCase[] = [
  {
    prompt: 'a freelancer monthly budget with income, rent, food and a net total',
    expectLabels: ['Category', 'Income', 'Rent', 'Food', 'Net'],
    netRef: 'B5',
    netValue: '2400',
    maxRetries: 0,
  },
];

describe('TS-03.4 — AI eval (golden set, fixture model)', () => {
  for (const g of GOLDEN) {
    it(`TC-03.4.1 — "${g.prompt.slice(0, 28)}…"`, async () => {
      const empty: SheetData = { cells: {}, cols: 26, rows: 100 };
      const r = await fillSheet(g.prompt, empty, { llm: createFixtureLlm() });

      // trajectory score: validated, no retries
      expect(r.ok).toBe(true);
      const retries = r.trace.filter((s) => !s.ok).length;
      expect(retries).toBeLessThanOrEqual(g.maxRetries);
      expect(r.trace[r.trace.length - 1].ok).toBe(true);

      // result rubric: required labels present + computed total correct
      const values = Object.values(r.data.cells);
      for (const label of g.expectLabels) expect(values).toContain(label);
      expect(compute(r.data)[g.netRef].display).toBe(g.netValue);
    });
  }
});

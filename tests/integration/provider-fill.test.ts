import { afterEach, describe, expect, it, vi } from 'vitest';
import { createConfigurableLlm } from '../../src/adapters/llm/configurable-llm';
import { BUDGET_FIXTURE } from '../../src/adapters/llm/mock-llm';
import { fillSheet } from '../../src/ai/orchestrator';
import { type SheetData, compute } from '../../src/domain/sheet/sheet';
import type { AiProviderConfig } from '../../src/domain/ai-provider';
import type { ProviderSettingsPort } from '../../src/domain/ports';

afterEach(() => vi.unstubAllGlobals());

describe('TS-05.2 — provider path end-to-end (integration)', () => {
  it('TC-05.2.1 — fillSheet via the configurable Ollama provider (stubbed fetch)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ message: { content: BUDGET_FIXTURE } }) }) as Response),
    );
    let cfg: AiProviderConfig = { provider: 'ollama', baseUrl: 'http://localhost:11434', model: 'shiva', apiKey: '' };
    const settings: ProviderSettingsPort = { get: () => cfg, set: (c) => (cfg = c) };
    const llm = createConfigurableLlm(settings);

    const empty: SheetData = { cells: {}, cols: 26, rows: 100 };
    const r = await fillSheet('a freelancer budget', empty, { llm });
    expect(r.ok).toBe(true);
    expect(compute(r.data)['B5'].display).toBe('2400'); // engine computes; provider only supplied text
  });
});

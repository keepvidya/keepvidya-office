import { describe, expect, it } from 'vitest';
import {
  type AiProviderConfig,
  defaultProviderConfig,
  validateProviderConfig,
} from '../../src/domain/ai-provider';

const cfg = (over: Partial<AiProviderConfig>): AiProviderConfig => ({
  provider: 'mock',
  baseUrl: '',
  model: '',
  apiKey: '',
  ...over,
});

describe('TS-05.1 — provider config (unit)', () => {
  it('TC-05.1.1 — default is mock; validation enforces required fields', () => {
    expect(defaultProviderConfig().provider).toBe('mock');
    expect(validateProviderConfig(cfg({ provider: 'mock' })).ok).toBe(true);
    expect(validateProviderConfig(cfg({ provider: 'ollama', baseUrl: '', model: 'm' })).ok).toBe(false); // url required
    expect(validateProviderConfig(cfg({ provider: 'ollama', baseUrl: 'x', model: '' })).ok).toBe(false); // model required
    expect(validateProviderConfig(cfg({ provider: 'ollama', baseUrl: 'x', model: 'm' })).ok).toBe(true);
    expect(validateProviderConfig(cfg({ provider: 'byok', baseUrl: 'x', model: 'm', apiKey: '' })).ok).toBe(false); // key required
    expect(validateProviderConfig(cfg({ provider: 'byok', baseUrl: 'x', model: 'm', apiKey: 'k' })).ok).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalProviderSettings } from '../../src/adapters/settings/local-provider-settings';
import type { AiProviderConfig } from '../../src/domain/ai-provider';

function memLocalStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as Storage;
}

describe('TS-05.1 — provider settings (unit)', () => {
  beforeEach(() => vi.stubGlobal('localStorage', memLocalStorage()));

  it('TC-05.1.2 — default when empty, then round-trips', () => {
    expect(createLocalProviderSettings().get().provider).toBe('mock');
    const cfg: AiProviderConfig = { provider: 'ollama', baseUrl: 'http://x', model: 'shiva', apiKey: '' };
    createLocalProviderSettings().set(cfg);
    expect(createLocalProviderSettings().get()).toEqual(cfg); // persists across instances
  });

  it('falls back to default on corrupt storage', () => {
    localStorage.setItem('kvoffice-ai-provider', '{not json');
    expect(createLocalProviderSettings().get().provider).toBe('mock');
  });
});

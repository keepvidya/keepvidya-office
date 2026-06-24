// AI provider configuration (value object) + validation. Pure — no DOM/vendor.
export type AiProvider = 'mock' | 'ollama' | 'byok';

export interface AiProviderConfig {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export function defaultProviderConfig(): AiProviderConfig {
  return { provider: 'mock', baseUrl: 'http://localhost:11434', model: 'shiva', apiKey: '' };
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateProviderConfig(cfg: AiProviderConfig): Validated<AiProviderConfig> {
  if (cfg.provider === 'mock') return { ok: true, value: cfg };
  if (!cfg.baseUrl.trim()) return { ok: false, error: 'A base URL is required for this provider' };
  if (!cfg.model.trim()) return { ok: false, error: 'A model name is required' };
  if (cfg.provider === 'byok' && !cfg.apiKey.trim()) return { ok: false, error: 'An API key is required for BYOK' };
  return { ok: true, value: cfg };
}

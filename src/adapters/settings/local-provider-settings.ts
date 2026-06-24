// ProviderSettingsPort backed by localStorage (device-only). BYOK keys never leave here.
import { type AiProviderConfig, defaultProviderConfig } from '../../domain/ai-provider';
import type { ProviderSettingsPort } from '../../domain/ports';

const KEY = 'kvoffice-ai-provider';

export function createLocalProviderSettings(): ProviderSettingsPort {
  return {
    get(): AiProviderConfig {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return defaultProviderConfig();
        return { ...defaultProviderConfig(), ...(JSON.parse(raw) as Partial<AiProviderConfig>) };
      } catch {
        return defaultProviderConfig();
      }
    },
    set(config: AiProviderConfig): void {
      localStorage.setItem(KEY, JSON.stringify(config));
    },
  };
}

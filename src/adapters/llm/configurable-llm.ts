// A configurable LlmPort (Proxy): resolves the real provider from current settings
// on each call, so changing the provider takes effect immediately. Mock is the
// safe default (Null Object) — nothing leaves the device unless the user opts in.
import type { LlmPort } from '../../ai/ports';
import type { ProviderSettingsPort } from '../../domain/ports';
import { createFixtureLlm } from './mock-llm';
import { createOllamaLlm } from './ollama-llm';
import { createOpenAiCompatLlm } from './openai-compat-llm';

export function createConfigurableLlm(settings: ProviderSettingsPort): LlmPort {
  return {
    complete(req) {
      const cfg = settings.get();
      const impl =
        cfg.provider === 'ollama'
          ? createOllamaLlm(cfg)
          : cfg.provider === 'byok'
            ? createOpenAiCompatLlm(cfg)
            : createFixtureLlm();
      return impl.complete(req);
    },
  };
}

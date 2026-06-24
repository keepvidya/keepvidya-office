// Shiva via a local Ollama-compatible endpoint. Default-private, no key.
import type { LlmPort } from '../../ai/ports';
import { httpPostJson, trimUrl } from './http';

export function createOllamaLlm(cfg: { baseUrl: string; model: string }): LlmPort {
  return {
    async complete(req) {
      const res = await httpPostJson(`${trimUrl(cfg.baseUrl)}/api/chat`, {
        model: cfg.model,
        stream: false,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt },
        ],
      });
      if (!res.ok) throw new Error(`Ollama returned HTTP ${res.status}`);
      const data = (await res.json()) as { message?: { content?: string } };
      return { text: data.message?.content ?? '' };
    },
  };
}

// BYOK — any OpenAI-compatible chat-completions endpoint. Key is sent only here,
// only when the user has selected this provider.
import type { LlmPort } from '../../ai/ports';
import { httpPostJson, trimUrl } from './http';

export function createOpenAiCompatLlm(cfg: { baseUrl: string; model: string; apiKey: string }): LlmPort {
  return {
    async complete(req) {
      const res = await httpPostJson(
        `${trimUrl(cfg.baseUrl)}/chat/completions`,
        {
          model: cfg.model,
          temperature: 0.4,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.prompt },
          ],
        },
        { authorization: `Bearer ${cfg.apiKey}` },
      );
      if (!res.ok) throw new Error(`Provider returned HTTP ${res.status}`);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return { text: data.choices?.[0]?.message?.content ?? '' };
    },
  };
}

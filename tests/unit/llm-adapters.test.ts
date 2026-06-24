import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOllamaLlm } from '../../src/adapters/llm/ollama-llm';
import { createOpenAiCompatLlm } from '../../src/adapters/llm/openai-compat-llm';
import { createConfigurableLlm } from '../../src/adapters/llm/configurable-llm';
import { type AiProviderConfig, defaultProviderConfig } from '../../src/domain/ai-provider';
import type { ProviderSettingsPort } from '../../src/domain/ports';

interface Call {
  url: string;
  init: RequestInit;
}
function fakeRes(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}
function stubFetch(body: unknown, ok = true, status = 200): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return fakeRes(body, ok, status);
    }),
  );
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('TS-05.1 — LLM adapters (fetch mocked)', () => {
  it('TC-05.1.4 — Ollama adapter posts to /api/chat and parses message.content', async () => {
    const calls = stubFetch({ message: { content: 'HELLO' } });
    const r = await createOllamaLlm({ baseUrl: 'http://localhost:11434/', model: 'shiva' }).complete({
      system: 'sys',
      prompt: 'hi',
    });
    expect(r.text).toBe('HELLO');
    expect(calls[0].url).toBe('http://localhost:11434/api/chat');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.model).toBe('shiva');
    expect(body.stream).toBe(false);
    expect(body.messages).toHaveLength(2);
  });

  it('Ollama HTTP error throws', async () => {
    stubFetch({}, false, 500);
    await expect(
      createOllamaLlm({ baseUrl: 'http://x', model: 'm' }).complete({ system: '', prompt: '' }),
    ).rejects.toThrow();
  });

  it('TC-05.1.5 — BYOK adapter posts to /chat/completions with a Bearer key', async () => {
    const calls = stubFetch({ choices: [{ message: { content: 'HI' } }] });
    const r = await createOpenAiCompatLlm({ baseUrl: 'https://api.x.com/v1', model: 'gpt', apiKey: 'sk-123' }).complete({
      system: 's',
      prompt: 'p',
    });
    expect(r.text).toBe('HI');
    expect(calls[0].url).toBe('https://api.x.com/v1/chat/completions');
    expect((calls[0].init.headers as Record<string, string>).authorization).toBe('Bearer sk-123');
  });

  it('TC-05.1.6 — configurable dispatch: mock (no fetch) then ollama', async () => {
    let cfg: AiProviderConfig = defaultProviderConfig();
    const settings: ProviderSettingsPort = { get: () => cfg, set: (c) => (cfg = c) };
    const llm = createConfigurableLlm(settings);

    const mock = await llm.complete({ system: 'spreadsheet content', prompt: 'x' });
    expect(mock.text).toContain('writes'); // mock budget fixture, no network

    stubFetch({ message: { content: 'OK' } });
    cfg = { provider: 'ollama', baseUrl: 'http://x', model: 'shiva', apiKey: '' };
    const real = await llm.complete({ system: 's', prompt: 'p' });
    expect(real.text).toBe('OK');
  });

  it('empty responses → empty text; configurable dispatches BYOK', async () => {
    stubFetch({}); // Ollama with no message
    expect((await createOllamaLlm({ baseUrl: 'http://x', model: 'm' }).complete({ system: '', prompt: '' })).text).toBe('');
    stubFetch({ choices: [] }); // BYOK with no choices
    expect(
      (await createOpenAiCompatLlm({ baseUrl: 'http://x', model: 'm', apiKey: 'k' }).complete({ system: '', prompt: '' })).text,
    ).toBe('');

    let cfg: AiProviderConfig = { provider: 'byok', baseUrl: 'http://x', model: 'm', apiKey: 'k' };
    const settings: ProviderSettingsPort = { get: () => cfg, set: (c) => (cfg = c) };
    stubFetch({ choices: [{ message: { content: 'BYE' } }] });
    expect((await createConfigurableLlm(settings).complete({ system: 's', prompt: 'p' })).text).toBe('BYE');
  });
});

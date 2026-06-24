// AI provider settings panel. Lets the user pick Built-in (mock) / Local Shiva
// (Ollama) / BYOK and configure the endpoint, model and key (BYOK only).
import { el } from './dom';
import { type AiProvider, type AiProviderConfig, validateProviderConfig } from '../domain/ai-provider';

export interface SettingsHandlers {
  config: AiProviderConfig;
  onSave: (config: AiProviderConfig) => void;
  onClose: () => void;
}

interface Field {
  wrap: HTMLElement;
  input: HTMLInputElement;
}

function field(label: string, testid: string, value: string, type = 'text'): Field {
  const input = el('input', { class: 'inp', type, value, 'data-testid': testid }) as HTMLInputElement;
  const wrap = el('label', { class: 'settings-field' }, [el('span', { text: label }), input]);
  return { wrap, input };
}

export function renderSettingsModal(h: SettingsHandlers): HTMLElement {
  const c = h.config;

  const provider = el('select', { class: 'inp', 'data-testid': 'settings-provider' }, [
    el('option', { value: 'mock', text: 'Built-in demo (offline)' }),
    el('option', { value: 'ollama', text: 'Local Shiva (Ollama)' }),
    el('option', { value: 'byok', text: 'BYOK (OpenAI-compatible)' }),
  ]) as HTMLSelectElement;
  provider.value = c.provider;

  const baseUrl = field('Endpoint URL', 'settings-baseurl', c.baseUrl);
  const model = field('Model', 'settings-model', c.model);
  const apiKey = field('API key', 'settings-key', c.apiKey, 'password');
  const err = el('div', { class: 'settings-err', 'data-testid': 'settings-err' });

  const sync = (): void => {
    const isMock = provider.value === 'mock';
    baseUrl.wrap.style.display = isMock ? 'none' : '';
    model.wrap.style.display = isMock ? 'none' : '';
    apiKey.wrap.style.display = provider.value === 'byok' ? '' : 'none';
  };
  provider.addEventListener('change', sync);

  const save = el('button', {
    class: 'btn',
    text: 'Save',
    'data-testid': 'settings-save',
    onclick: () => {
      const cfg: AiProviderConfig = {
        provider: provider.value as AiProvider,
        baseUrl: baseUrl.input.value.trim(),
        model: model.input.value.trim(),
        apiKey: apiKey.input.value,
      };
      const v = validateProviderConfig(cfg);
      if (!v.ok) {
        err.textContent = v.error;
        return;
      }
      h.onSave(v.value);
      h.onClose();
    },
  });
  const cancel = el('button', { class: 'btn ghost', text: 'Cancel', onclick: () => h.onClose() });

  const overlay = el(
    'div',
    {
      class: 'settings-bg',
      'data-testid': 'settings-modal',
      onclick: (e: Event) => {
        if (e.target === overlay) h.onClose();
      },
    },
    [
      el('div', { class: 'settings-card' }, [
        el('h3', { text: 'AI provider' }),
        el('p', {
          class: 'settings-sub',
          text: 'Choose where generation runs. Built-in is offline; your key never leaves this device.',
        }),
        el('label', { class: 'settings-field' }, [el('span', { text: 'Provider' }), provider]),
        baseUrl.wrap,
        model.wrap,
        apiKey.wrap,
        err,
        el('div', { class: 'settings-row' }, [cancel, save]),
      ]),
    ],
  );
  sync();
  return overlay;
}

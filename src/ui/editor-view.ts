import { el } from './dom';
import { icons } from './icons';
import type { OfficeFile } from '../domain/file';

export interface EditorHandlers {
  file: OfficeFile;
  onBack: () => void;
  onRename: (name: string) => void;
}

// M0 placeholder editor — proves routing, rename + persistence, and the chrome.
// The real editors (and the AI prompt bar) arrive at M2/M3 per the build plan.
export function renderEditor(h: EditorHandlers): HTMLElement {
  const title = el('input', {
    class: 'title',
    value: h.file.name,
    spellcheck: 'false',
    'data-testid': 'editor-title',
  }) as HTMLInputElement;
  title.addEventListener('input', () => h.onRename(title.value));

  const typeLabel = { writer: 'Writer', sheets: 'Sheets', slides: 'Slides' }[h.file.type];

  const edbar = el('div', { class: 'edbar' }, [
    el('button', { class: 'back', html: icons.back, title: 'All files', 'data-testid': 'editor-back', onclick: () => h.onBack() }),
    el('span', { class: 'ftype-dot', style: `background:var(--${h.file.type})` }),
    title,
    el('span', { class: 'saved', html: '<span class="dot"></span>Saved locally' }),
  ]);

  const body = el('div', { class: 'ed-placeholder', 'data-testid': `editor-${h.file.type}` }, [
    el('div', { class: 'ph-card' }, [
      el('div', { class: 'ph-ic', html: icons[h.file.type] }),
      el('h2', { text: `${typeLabel} editor` }),
      el('p', {
        text: 'Walking skeleton (M0): routing, rename, and local persistence are live. The full editor and the AI prompt bar arrive in the next slices.',
      }),
      el('div', { class: 'ph-ai', html: icons.spark + '<span>AI: prompt → validated intent → deterministic engine (M3+)</span>' }),
    ]),
  ]);

  return el('div', { class: 'ed', 'data-testid': 'editor' }, [edbar, body]);
}

import { el } from './dom';
import { icons } from './icons';
import type { OfficeFile } from '../domain/file';

export interface EditorHandlers {
  file: OfficeFile;
  onBack: () => void;
  onRename: (name: string) => void;
}

// Shared editor chrome (back, type dot, title, saved indicator) wrapping a body node.
export function editorChrome(h: EditorHandlers, body: Node): HTMLElement {
  const title = el('input', {
    class: 'title',
    value: h.file.name,
    spellcheck: 'false',
    'data-testid': 'editor-title',
  }) as HTMLInputElement;
  title.addEventListener('input', () => h.onRename(title.value));

  const edbar = el('div', { class: 'edbar' }, [
    el('button', {
      class: 'back',
      html: icons.back,
      title: 'All files',
      'data-testid': 'editor-back',
      onclick: () => h.onBack(),
    }),
    el('span', { class: 'ftype-dot', style: `background:var(--${h.file.type})` }),
    title,
    el('span', { class: 'saved', html: '<span class="dot"></span>Saved locally' }),
  ]);
  return el('div', { class: 'ed', 'data-testid': 'editor' }, [edbar, body]);
}

// Placeholder body for editors not yet implemented (writer/slides until their slices).
export function placeholderBody(file: OfficeFile): HTMLElement {
  const typeLabel = { writer: 'Writer', sheets: 'Sheets', slides: 'Slides' }[file.type];
  return el('div', { class: 'ed-placeholder', 'data-testid': `editor-${file.type}` }, [
    el('div', { class: 'ph-card' }, [
      el('div', { class: 'ph-ic', html: icons[file.type] }),
      el('h2', { text: `${typeLabel} editor` }),
      el('p', {
        text: 'This editor arrives in an upcoming slice. Routing, rename, and local persistence are already live.',
      }),
      el('div', {
        class: 'ph-ai',
        html: icons.spark + '<span>AI: prompt → validated intent → deterministic engine (M3+)</span>',
      }),
    ]),
  ]);
}

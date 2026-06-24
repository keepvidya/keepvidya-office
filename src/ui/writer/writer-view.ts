// Writer editor — a contentEditable document page with an execCommand toolbar, a
// live word count, an AI prompt bar, and autosave. DOM lives here (UI layer);
// document logic is in the doc domain; AI via an injected buildDoc function.
import { el } from '../dom';
import { type DocData, wordCount } from '../../domain/doc/doc';

export interface WriterHandlers {
  data: DocData;
  onChange: (data: DocData) => void;
  aiWrite?: (prompt: string, data: DocData) => Promise<{ data: DocData; ok: boolean; note?: string }>;
}

export function renderWriter(h: WriterHandlers): HTMLElement {
  const page = el('div', {
    class: 'w-page',
    contenteditable: 'true',
    spellcheck: 'true',
    'data-testid': 'doc-page',
  });
  page.innerHTML = h.data.html;

  const status = el('div', { class: 'w-status', 'data-testid': 'doc-status' });
  const renderCount = (): void => {
    const words = wordCount(page.innerText || '');
    status.textContent = `${words} word${words === 1 ? '' : 's'}`;
  };
  const sync = (): void => {
    h.onChange({ html: page.innerHTML });
    renderCount();
  };
  page.addEventListener('input', sync);

  const cmd = (c: string, v?: string): void => {
    page.focus();
    document.execCommand(c, false, v);
    sync();
  };
  const tb = (title: string, label: string, on: () => void, testid?: string): HTMLElement =>
    el('button', { class: 'tb', title, html: label, 'data-testid': testid ?? null, onclick: on });

  const styleSel = el('select', {
    class: 'tbsel',
    title: 'Paragraph style',
    'data-testid': 'fmt-style',
    onchange: () => cmd('formatBlock', styleSel.value),
  }, [
    el('option', { value: 'P', text: 'Body' }),
    el('option', { value: 'H1', text: 'Title' }),
    el('option', { value: 'H2', text: 'Heading' }),
    el('option', { value: 'H3', text: 'Subheading' }),
  ]) as HTMLSelectElement;

  const toolbar = el('div', { class: 'tbar' }, [
    el('div', { class: 'grp' }, [tb('Undo', '↶', () => cmd('undo')), tb('Redo', '↷', () => cmd('redo'))]),
    el('div', { class: 'grp' }, [styleSel]),
    el('div', { class: 'grp' }, [
      tb('Bold', '<b>B</b>', () => cmd('bold'), 'fmt-bold'),
      tb('Italic', '<i>I</i>', () => cmd('italic')),
      tb('Underline', '<u>U</u>', () => cmd('underline')),
    ]),
    el('div', { class: 'grp' }, [
      tb('Bulleted list', '•&nbsp;—', () => cmd('insertUnorderedList')),
      tb('Numbered list', '1.', () => cmd('insertOrderedList')),
    ]),
  ]);

  let aiBar: HTMLElement | null = null;
  if (h.aiWrite) {
    const aiWrite = h.aiWrite;
    const promptInput = el('input', {
      class: 'ai-prompt',
      placeholder: 'Describe a document… (e.g. a one-page project proposal)',
      'data-testid': 'ai-prompt',
    }) as HTMLInputElement;
    const note = el('span', { class: 'ai-note', 'data-testid': 'ai-note' });
    const genBtn = el('button', { class: 'ai-gen', text: 'Generate', 'data-testid': 'ai-generate' }) as HTMLButtonElement;
    const run = async (): Promise<void> => {
      const p = promptInput.value.trim();
      if (!p || genBtn.disabled) return;
      genBtn.disabled = true;
      genBtn.textContent = 'Generating…';
      note.textContent = '';
      try {
        const out = await aiWrite(p, { html: page.innerHTML });
        page.innerHTML = out.data.html;
        sync();
        note.textContent = out.ok ? '✓ drafted' : (out.note ?? 'No result');
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = 'Generate';
      }
    };
    genBtn.addEventListener('click', () => void run());
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void run();
    });
    aiBar = el('div', { class: 'ai-bar' }, [el('span', { class: 'ai-spark', text: '✦' }), promptInput, genBtn, note]);
  }

  renderCount();
  return el('div', { class: 'w-root' }, [aiBar, toolbar, el('div', { class: 'w-scroll' }, [page]), status]);
}

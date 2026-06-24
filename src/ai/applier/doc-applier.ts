// Doc applier (Builder): turns validated document STRUCTURE into HTML. All markup
// and formatting is decided HERE (our code) — the model's text is escaped, never
// trusted as markup. Narrator boundary made literal.
import type { DocData } from '../../domain/doc/doc';
import type { DocIntent } from '../intent/doc-intent';

export function applyDocIntent(intent: DocIntent): DocData {
  const html = intent.blocks
    .map((b) => {
      if (b.type === 'heading') return `<h${b.level}>${esc(b.text)}</h${b.level}>`;
      if (b.type === 'paragraph') return `<p>${esc(b.text)}</p>`;
      return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    })
    .join('');
  return { html };
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);
}
